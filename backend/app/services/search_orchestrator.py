import hashlib
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.search import SearchJob, SearchResult, JobStatus
from app.models.research import ResearchCase, ResearchSnapshot, PersonCandidate, CaseStatus
from app.models.knowledge import (
    Source, SourceDocument, KnowledgeEntity, KnowledgeRelation,
    KnowledgeEvidence, PublicFact, EntityType, RelationType, ConnectionNature
)
from app.connectors.searxng import SearXNGConnector
from app.connectors.github import GitHubConnector
from app.connectors.gitlab import GitLabConnector
from app.connectors.orcid import OrcidConnector
from app.connectors.crossref import CrossrefConnector
from app.connectors.openalex import OpenAlexConnector
from app.services.policy_engine import policy_engine
from app.services.ai_provider import ai_provider
from app.services.knowledge_engine import knowledge_engine

logger = logging.getLogger(__name__)

class SearchOrchestrator:
    """
    Coordinates asynchronous multi-source investigation, deduplication,
    evidence capture, entity extraction, and knowledge graph persistence.
    """

    def __init__(self):
        self.connectors = {
            "searxng": SearXNGConnector(),
            "github": GitHubConnector(),
            "gitlab": GitLabConnector(),
            "orcid": OrcidConnector(),
            "crossref": CrossrefConnector(),
            "openalex": OpenAlexConnector(),
        }

    async def execute_search_job(self, job_id: str, db: AsyncSession):
        stmt = select(SearchJob).where(SearchJob.id == job_id)
        res = await db.execute(stmt)
        job = res.scalar_one_or_none()
        if not job:
            return

        user_id = job.user_id
        query_params = job.query_params
        mode = job.mode
        depth = job.depth

        first_name = query_params.get("first_name", "")
        last_name = query_params.get("last_name", "")
        target_name = f"{first_name} {last_name}".strip()

        # Step 1: Initialize Job & Research Case
        job.status = JobStatus.RUNNING.value
        job.progress_pct = 10
        job.progress_step = "Initialisation de la recherche et du dossier"

        case = None
        if job.case_id:
            stmt_case = select(ResearchCase).where(ResearchCase.id == job.case_id)
            res_case = await db.execute(stmt_case)
            case = res_case.scalar_one_or_none()

        if not case:
            case = ResearchCase(
                user_id=user_id,
                title=f"Dossier : {target_name}",
                target_name=target_name,
                mode=mode,
                status=CaseStatus.ACTIVE.value,
                meta_info=query_params
            )
            db.add(case)
            await db.flush()
            job.case_id = case.id

        await db.commit()

        # Step 2: Select connectors according to mode & policies
        job.progress_pct = 25
        job.progress_step = "Sélection et vérification des politiques de connecteurs"
        active_connectors = []

        if mode == "PROFESSIONAL":
            target_connector_names = ["github", "gitlab", "orcid", "crossref", "openalex", "searxng"]
        else: # FULL_WEB
            target_connector_names = ["searxng", "github", "gitlab", "orcid", "crossref", "openalex"]

        for name in target_connector_names:
            can_search = await policy_engine.can_perform_action(name, "search", db)
            if can_search and name in self.connectors:
                active_connectors.append(self.connectors[name])

        await db.commit()

        # Step 3: Run queries across connectors
        job.progress_pct = 40
        job.progress_step = f"Interrogation de {len(active_connectors)} connecteurs en parallèle"
        raw_results = []
        for conn in active_connectors:
            try:
                items = await conn.search(query_params, depth=depth)
                raw_results.extend(items)
            except Exception as e:
                logger.error(f"Error executing connector {conn.name}: {e}")

        # Step 4: URL Deduplication & Normalization
        job.progress_pct = 60
        job.progress_step = "Déduplication des sources et filtrage de sécurité"
        seen_urls = set()
        deduped_results = []
        for item in raw_results:
            normalized_url = item.source_url.strip().rstrip("/")
            if normalized_url and normalized_url not in seen_urls:
                if policy_engine.validate_url_safety(normalized_url):
                    seen_urls.add(normalized_url)
                    deduped_results.append(item)

        # Persist SearchResults
        for item in deduped_results:
            sr = SearchResult(
                job_id=job.id,
                case_id=case.id,
                connector=item.connector,
                source_url=item.source_url,
                title=item.title,
                snippet=item.snippet,
                raw_data=item.raw_data
            )
            db.add(sr)
        await db.flush()

        # Step 5: Entity Resolution & Structured Fact Extraction via LiteLLM
        job.progress_pct = 75
        job.progress_step = "Analyse sémantique et extraction des relations"
        snippets = [{"source_url": r.source_url, "title": r.title, "snippet": r.snippet} for r in deduped_results]
        extracted = await ai_provider.extract_structured_entities_and_relations(target_name, snippets)

        # Ensure main Person entity exists
        main_person = await knowledge_engine.get_or_create_entity(
            db=db,
            user_id=user_id,
            entity_type=EntityType.PERSON.value,
            name=target_name,
            case_id=case.id,
            attributes={"search_mode": mode}
        )

        # Persist Candidates
        candidates_data = extracted.get("candidates", [])
        for cand in candidates_data:
            c_name = cand.get("name") or target_name
            pc = PersonCandidate(
                case_id=case.id,
                full_name=c_name,
                disambiguation_score=float(cand.get("confidence", 0.9)),
                attributes=cand.get("attributes", {}),
                confidence=float(cand.get("confidence", 0.85))
            )
            db.add(pc)

        # Persist Sources & Documents
        for item in deduped_results:
            domain = item.source_url.split("//")[-1].split("/")[0] if "//" in item.source_url else "web"
            src = Source(
                case_id=case.id,
                domain=domain,
                url=item.source_url,
                connector=item.connector,
                trust_score=item.confidence,
                license_info="Licence publique / Open Access"
            )
            db.add(src)
            await db.flush()

            content_hash = hashlib.sha256(item.snippet.encode("utf-8")).hexdigest()
            doc = SourceDocument(
                source_id=src.id,
                case_id=case.id,
                title=item.title,
                content=item.snippet,
                mime_type="text/plain",
                content_hash=content_hash
            )
            db.add(doc)

        # Persist Facts
        facts_data = extracted.get("facts", [])
        for f in facts_data:
            pf = PublicFact(
                entity_id=main_person.id,
                case_id=case.id,
                fact_type=f.get("fact_type", "PROFILE_ATTRIBUTE"),
                fact_value=f.get("fact_value", ""),
                confidence=0.85,
                source_url=f.get("source_url")
            )
            db.add(pf)

        # Persist Relations
        relations_data = extracted.get("relations", [])
        for rel in relations_data:
            target_ent_name = rel.get("target") or "Organisation / Projet"
            target_ent_type = EntityType.ORGANIZATION.value if "WORKED" in rel.get("type", "") else EntityType.PROJECT.value
            
            target_entity = await knowledge_engine.get_or_create_entity(
                db=db,
                user_id=user_id,
                entity_type=target_ent_type,
                name=target_ent_name,
                case_id=case.id
            )

            await knowledge_engine.add_relation_with_evidence(
                db=db,
                user_id=user_id,
                source_id=main_person.id,
                target_id=target_entity.id,
                relation_type=rel.get("type", RelationType.WORKED_AT.value),
                connection_nature=rel.get("nature", ConnectionNature.DOCUMENTED.value),
                uncertainty_score=float(rel.get("uncertainty", 0.1)),
                case_id=case.id,
                evidence_snippet=rel.get("evidence_snippet", "")
            )

        # Step 6: Generate Dated Snapshot & Summary
        job.progress_pct = 90
        job.progress_step = "Génération du snapshot et finalisation"
        synthesis = extracted.get("synthesis", f"Synthèse de recherche pour {target_name}.")
        case.summary_ai = synthesis

        # Count snapshots for case
        stmt_snap = select(ResearchSnapshot).where(ResearchSnapshot.case_id == case.id)
        res_snap = await db.execute(stmt_snap)
        snap_count = len(res_snap.scalars().all())

        snapshot = ResearchSnapshot(
            case_id=case.id,
            snapshot_number=snap_count + 1,
            summary=synthesis,
            data_snapshot={
                "target_name": target_name,
                "sources_count": len(deduped_results),
                "candidates_count": len(candidates_data),
                "relations_count": len(relations_data),
                "facts_count": len(facts_data)
            }
        )
        db.add(snapshot)

        # Finalize job
        job.progress_pct = 100
        job.progress_step = "Recherche terminée avec succès"
        job.status = JobStatus.COMPLETED.value
        await db.commit()

search_orchestrator = SearchOrchestrator()

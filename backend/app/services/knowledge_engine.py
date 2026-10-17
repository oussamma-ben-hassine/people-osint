import math
from typing import List, Dict, Any, Optional
from sqlalchemy import select, or_, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.knowledge import (
    KnowledgeEntity, KnowledgeRelation, KnowledgeEvidence,
    PublicFact, SourceDocument, DocumentChunk, Source,
    EntityType, RelationType, ConnectionNature
)
from app.models.research import ResearchCase, ResearchSnapshot, PersonCandidate
from app.schemas.all_schemas import (
    CytoscapeGraphResponse, CytoscapeNode, CytoscapeNodeData,
    CytoscapeEdge, CytoscapeEdgeData
)
from app.services.ai_provider import ai_provider

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot / (norm1 * norm2)

class KnowledgeEngine:
    """
    Manages Knowledge Base Entities, Relations, Evidence, and Cytoscape Graphs.
    Provides safe structured tools for AI Explorer and hybrid query retrieval.
    """

    async def get_or_create_entity(
        self,
        db: AsyncSession,
        user_id: str,
        entity_type: str,
        name: str,
        case_id: Optional[str] = None,
        attributes: Optional[Dict[str, Any]] = None
    ) -> KnowledgeEntity:
        stmt = select(KnowledgeEntity).where(
            KnowledgeEntity.user_id == user_id,
            KnowledgeEntity.entity_type == entity_type,
            KnowledgeEntity.name == name
        )
        res = await db.execute(stmt)
        ent = res.scalar_one_or_none()
        if not ent:
            ent = KnowledgeEntity(
                user_id=user_id,
                case_id=case_id,
                entity_type=entity_type,
                name=name,
                attributes=attributes or {}
            )
            db.add(ent)
            await db.flush()
        return ent

    async def add_relation_with_evidence(
        self,
        db: AsyncSession,
        user_id: str,
        source_id: str,
        target_id: str,
        relation_type: str,
        connection_nature: str = "DOCUMENTED",
        uncertainty_score: float = 0.1,
        case_id: Optional[str] = None,
        source_url: str = "",
        evidence_snippet: str = "",
    ) -> KnowledgeRelation:
        stmt = select(KnowledgeRelation).where(
            KnowledgeRelation.user_id == user_id,
            KnowledgeRelation.source_entity_id == source_id,
            KnowledgeRelation.target_entity_id == target_id,
            KnowledgeRelation.relation_type == relation_type
        )
        res = await db.execute(stmt)
        rel = res.scalar_one_or_none()
        if not rel:
            rel = KnowledgeRelation(
                user_id=user_id,
                case_id=case_id,
                source_entity_id=source_id,
                target_entity_id=target_id,
                relation_type=relation_type,
                connection_nature=connection_nature,
                uncertainty_score=uncertainty_score
            )
            db.add(rel)
            await db.flush()

        if evidence_snippet:
            ev = KnowledgeEvidence(
                relation_id=rel.id,
                source_url=source_url,
                text_snippet=evidence_snippet,
                verified=True
            )
            db.add(ev)
            await db.flush()

        return rel

    async def get_user_graph(
        self,
        db: AsyncSession,
        user_id: str,
        case_id: Optional[str] = None
    ) -> CytoscapeGraphResponse:
        """
        Builds Cytoscape-compliant graph with:
        - Nodes (Persons, Organizations, Projects, Publications)
        - Edges with types, nature (DOCUMENTED/DECLARED/UNCERTAIN), uncertainty scores, and evidence count.
        """
        stmt_ent = select(KnowledgeEntity).where(KnowledgeEntity.user_id == user_id)
        if case_id:
            stmt_ent = stmt_ent.where(KnowledgeEntity.case_id == case_id)
        res_ent = await db.execute(stmt_ent)
        entities = res_ent.scalars().all()

        nodes: List[CytoscapeNode] = []
        entity_ids = set()
        for e in entities:
            entity_ids.add(e.id)
            nodes.append(CytoscapeNode(
                data=CytoscapeNodeData(
                    id=e.id,
                    label=e.name,
                    entity_type=e.entity_type,
                    attributes=e.attributes
                )
            ))

        stmt_rel = select(KnowledgeRelation).where(KnowledgeRelation.user_id == user_id)
        if case_id:
            stmt_rel = stmt_rel.where(KnowledgeRelation.case_id == case_id)
        res_rel = await db.execute(stmt_rel)
        relations = res_rel.scalars().all()

        edges: List[CytoscapeEdge] = []
        for r in relations:
            if r.source_entity_id in entity_ids and r.target_entity_id in entity_ids:
                stmt_ev = select(KnowledgeEvidence).where(KnowledgeEvidence.relation_id == r.id)
                res_ev = await db.execute(stmt_ev)
                ev_count = len(res_ev.scalars().all())

                edges.append(CytoscapeEdge(
                    data=CytoscapeEdgeData(
                        id=r.id,
                        source=r.source_entity_id,
                        target=r.target_entity_id,
                        label=r.relation_type,
                        relation_type=r.relation_type,
                        connection_nature=r.connection_nature,
                        uncertainty_score=r.uncertainty_score,
                        evidence_count=ev_count
                    )
                ))

        return CytoscapeGraphResponse(nodes=nodes, edges=edges)

    # SAFE CONTROLLED TOOLS FOR AI EXPLORER
    async def search_documents(self, db: AsyncSession, user_id: str, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        stmt = select(SourceDocument).join(Source).where(
            SourceDocument.content.ilike(f"%{query}%")
        ).limit(limit)
        res = await db.execute(stmt)
        docs = res.scalars().all()
        return [{"id": d.id, "title": d.title, "content_snippet": d.content[:400]} for d in docs]

    async def search_entities(self, db: AsyncSession, user_id: str, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        stmt = select(KnowledgeEntity).where(
            KnowledgeEntity.user_id == user_id,
            KnowledgeEntity.name.ilike(f"%{query}%")
        ).limit(limit)
        res = await db.execute(stmt)
        ents = res.scalars().all()
        return [{"id": e.id, "name": e.name, "type": e.entity_type, "attributes": e.attributes} for e in ents]

    async def search_research_cases(self, db: AsyncSession, user_id: str, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        stmt = select(ResearchCase).where(
            ResearchCase.user_id == user_id,
            or_(
                ResearchCase.title.ilike(f"%{query}%"),
                ResearchCase.target_name.ilike(f"%{query}%")
            )
        ).limit(limit)
        res = await db.execute(stmt)
        cases = res.scalars().all()
        return [{"id": c.id, "title": c.title, "target_name": c.target_name, "summary": c.summary_ai} for c in cases]

    async def get_entity_facts(self, db: AsyncSession, user_id: str, entity_name: str) -> List[Dict[str, Any]]:
        stmt = select(PublicFact).join(KnowledgeEntity).where(
            KnowledgeEntity.user_id == user_id,
            KnowledgeEntity.name.ilike(f"%{entity_name}%")
        )
        res = await db.execute(stmt)
        facts = res.scalars().all()
        return [{"type": f.fact_type, "value": f.fact_value, "confidence": f.confidence, "source": f.source_url} for f in facts]

    async def get_entity_relations(self, db: AsyncSession, user_id: str, entity_name: str) -> List[Dict[str, Any]]:
        stmt_ent = select(KnowledgeEntity).where(
            KnowledgeEntity.user_id == user_id,
            KnowledgeEntity.name.ilike(f"%{entity_name}%")
        )
        res_ent = await db.execute(stmt_ent)
        ent = res_ent.scalar_one_or_none()
        if not ent:
            return []

        stmt = select(KnowledgeRelation, KnowledgeEntity).join(
            KnowledgeEntity, KnowledgeRelation.target_entity_id == KnowledgeEntity.id
        ).where(
            KnowledgeRelation.user_id == user_id,
            KnowledgeRelation.source_entity_id == ent.id
        )
        res = await db.execute(stmt)
        pairs = res.all()
        return [
            {
                "relation": rel.relation_type,
                "target_name": target.name,
                "target_type": target.entity_type,
                "nature": rel.connection_nature,
                "uncertainty": rel.uncertainty_score
            }
            for rel, target in pairs
        ]

    async def compare_research_cases(self, db: AsyncSession, user_id: str, case_ids: List[str]) -> Dict[str, Any]:
        stmt = select(ResearchCase).where(
            ResearchCase.user_id == user_id,
            ResearchCase.id.in_(case_ids)
        )
        res = await db.execute(stmt)
        cases = res.scalars().all()
        if len(cases) < 2:
            return {"error": "Au moins deux dossiers sont requis pour la comparaison."}

        # Compare entities and facts
        entities_per_case = {}
        for c in cases:
            stmt_e = select(KnowledgeEntity.name).where(KnowledgeEntity.case_id == c.id)
            res_e = await db.execute(stmt_e)
            entities_per_case[c.title] = set(res_e.scalars().all())

        case_names = list(entities_per_case.keys())
        common = set.intersection(*entities_per_case.values()) if entities_per_case else set()

        return {
            "cases_compared": [c.title for c in cases],
            "common_entities": list(common),
            "unique_per_case": {name: list(ents - common) for name, ents in entities_per_case.items()},
            "summary": f"Comparaison effectuée entre {len(cases)} dossiers. {len(common)} entités partagées détectées."
        }

knowledge_engine = KnowledgeEngine()

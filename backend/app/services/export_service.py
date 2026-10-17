import io
import json
from typing import Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors

from app.models.research import ResearchCase, ResearchSnapshot, PersonCandidate
from app.models.knowledge import KnowledgeEntity, KnowledgeRelation, KnowledgeEvidence, PublicFact, Source

class ExportService:
    """
    Generates authorized and sanitized exports in JSON and PDF format.
    Enforces privacy by design and owner authorization.
    """

    async def get_case_export_data(self, db: AsyncSession, case_id: str, user_id: str) -> Dict[str, Any]:
        stmt = select(ResearchCase).where(
            ResearchCase.id == case_id,
            ResearchCase.user_id == user_id
        )
        res = await db.execute(stmt)
        case = res.scalar_one_or_none()
        if not case:
            return {}

        # Fetch Entities
        stmt_e = select(KnowledgeEntity).where(KnowledgeEntity.case_id == case.id)
        res_e = await db.execute(stmt_e)
        entities = [{"id": e.id, "type": e.entity_type, "name": e.name, "attributes": e.attributes} for e in res_e.scalars().all()]

        # Fetch Relations
        stmt_r = select(KnowledgeRelation).where(KnowledgeRelation.case_id == case.id)
        res_r = await db.execute(stmt_r)
        relations = [
            {
                "id": r.id,
                "source_id": r.source_entity_id,
                "target_id": r.target_entity_id,
                "type": r.relation_type,
                "nature": r.connection_nature,
                "uncertainty": r.uncertainty_score
            }
            for r in res_r.scalars().all()
        ]

        # Fetch Sources
        stmt_s = select(Source).where(Source.case_id == case.id)
        res_s = await db.execute(stmt_s)
        sources = [{"domain": s.domain, "url": s.url, "connector": s.connector, "trust": s.trust_score} for s in res_s.scalars().all()]

        # Fetch Facts
        stmt_f = select(PublicFact).where(PublicFact.case_id == case.id)
        res_f = await db.execute(stmt_f)
        facts = [{"type": f.fact_type, "value": f.fact_value, "confidence": f.confidence} for f in res_f.scalars().all()]

        return {
            "application": "People OSINT",
            "compliance": "RGPD / Privacy by Design",
            "case_id": case.id,
            "target_name": case.target_name,
            "mode": case.mode,
            "summary": case.summary_ai,
            "created_at": str(case.created_at),
            "sources": sources,
            "entities": entities,
            "relations": relations,
            "facts": facts
        }

    async def export_json(self, db: AsyncSession, case_id: str, user_id: str) -> str:
        data = await self.get_case_export_data(db, case_id, user_id)
        return json.dumps(data, indent=2, ensure_ascii=False)

    async def export_pdf(self, db: AsyncSession, case_id: str, user_id: str) -> bytes:
        data = await self.get_case_export_data(db, case_id, user_id)
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        p.setTitle(f"Rapport People OSINT - {data.get('target_name', 'Rapport')}")

        # Header
        p.setFillColor(colors.HexColor("#0f172a"))
        p.rect(0, 740, 612, 60, fill=True, stroke=False)
        p.setFillColor(colors.white)
        p.setFont("Helvetica-Bold", 18)
        p.drawString(40, 762, "PEOPLE OSINT — RAPPORT D'ENQUÊTE")
        p.setFont("Helvetica", 10)
        p.drawString(40, 748, "plateforme sécurisée • people.oussamma.tn")

        # Case info
        y = 700
        p.setFillColor(colors.HexColor("#0f172a"))
        p.setFont("Helvetica-Bold", 14)
        p.drawString(40, y, f"Cible : {data.get('target_name', 'Inconnue')}")
        y -= 20
        p.setFont("Helvetica", 10)
        p.drawString(40, y, f"Dossier ID : {data.get('case_id')} | Mode : {data.get('mode')} | Date : {data.get('created_at')}")

        # Summary
        y -= 30
        p.setFont("Helvetica-Bold", 12)
        p.drawString(40, y, "1. Synthèse analytique")
        y -= 15
        p.setFont("Helvetica", 9)
        summary = data.get("summary") or "Aucune synthèse disponible."
        # Split into lines
        for line in summary.split("\n")[:8]:
            p.drawString(40, y, line[:100])
            y -= 12

        # Entities
        y -= 20
        p.setFont("Helvetica-Bold", 12)
        p.drawString(40, y, f"2. Entités documentées ({len(data.get('entities', []))})")
        y -= 15
        p.setFont("Helvetica", 9)
        for e in data.get("entities", [])[:10]:
            p.drawString(40, y, f"• [{e.get('type')}] {e.get('name')}")
            y -= 12

        # Relations
        y -= 20
        p.setFont("Helvetica-Bold", 12)
        p.drawString(40, y, f"3. Relations vérifiées ({len(data.get('relations', []))})")
        y -= 15
        p.setFont("Helvetica", 9)
        for r in data.get("relations", [])[:8]:
            p.drawString(40, y, f"• Relation {r.get('type')} ({r.get('nature')}) - Incertitude : {r.get('uncertainty')}")
            y -= 12

        # Footer
        p.setFont("Helvetica-Oblique", 8)
        p.setFillColor(colors.HexColor("#64748b"))
        p.drawString(40, 30, "Document confidentiel à usage autorisé. Protection des données personnelles conformément au RGPD.")

        p.showPage()
        p.save()
        buffer.seek(0)
        return buffer.getvalue()

export_service = ExportService()

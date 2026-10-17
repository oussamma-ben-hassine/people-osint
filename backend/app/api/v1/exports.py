from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.api.auth import require_permission
from app.services.export_service import export_service

router = APIRouter(prefix="/exports", tags=["exports"])

@router.get("/cases/{case_id}/json")
async def export_case_json(
    case_id: str,
    user: User = Depends(require_permission("reports.export")),
    db: AsyncSession = Depends(get_db)
):
    json_str = await export_service.export_json(db, case_id, user.id)
    if not json_str:
        raise HTTPException(status_code=404, detail="Dossier introuvable.")
    return Response(content=json_str, media_type="application/json")

@router.get("/cases/{case_id}/pdf")
async def export_case_pdf(
    case_id: str,
    user: User = Depends(require_permission("reports.export")),
    db: AsyncSession = Depends(get_db)
):
    pdf_bytes = await export_service.export_pdf(db, case_id, user.id)
    if not pdf_bytes:
        raise HTTPException(status_code=404, detail="Dossier introuvable.")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=rapport-osint-{case_id[:8]}.pdf"}
    )

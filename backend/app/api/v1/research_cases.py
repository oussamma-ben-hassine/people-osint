from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.models.research import ResearchCase, ResearchSnapshot, CaseStatus
from app.schemas.all_schemas import (
    ResearchCaseRead, ResearchSnapshotRead,
    CompareCasesRequest, CompareCasesResponse
)
from app.api.auth import require_active_user, require_permission
from app.services.knowledge_engine import knowledge_engine

router = APIRouter(prefix="/research-cases", tags=["research-cases"])

@router.get("", response_model=List[ResearchCaseRead])
async def list_cases(
    user: User = Depends(require_permission("research.read_own")),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ResearchCase).where(
        ResearchCase.user_id == user.id,
        ResearchCase.status != CaseStatus.DELETED.value
    ).order_by(ResearchCase.updated_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/{id}", response_model=ResearchCaseRead)
async def get_case(
    id: str,
    user: User = Depends(require_permission("research.read_own")),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ResearchCase).where(
        ResearchCase.id == id,
        ResearchCase.user_id == user.id,
        ResearchCase.status != CaseStatus.DELETED.value
    )
    res = await db.execute(stmt)
    case = res.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Dossier de recherche introuvable.")
    return case

@router.get("/{id}/snapshots", response_model=List[ResearchSnapshotRead])
async def get_case_snapshots(
    id: str,
    user: User = Depends(require_permission("research.read_own")),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ResearchCase).where(ResearchCase.id == id, ResearchCase.user_id == user.id)
    res = await db.execute(stmt)
    if not res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Dossier introuvable.")

    stmt_s = select(ResearchSnapshot).where(ResearchSnapshot.case_id == id).order_by(ResearchSnapshot.snapshot_number.desc())
    res_s = await db.execute(stmt_s)
    return res_s.scalars().all()

@router.post("/compare")
async def compare_cases(
    data: CompareCasesRequest,
    user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await knowledge_engine.compare_research_cases(db, user.id, data.case_ids)
    return result

@router.delete("/{id}")
async def delete_case(
    id: str,
    user: User = Depends(require_permission("research.delete_own")),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ResearchCase).where(ResearchCase.id == id, ResearchCase.user_id == user.id)
    res = await db.execute(stmt)
    case = res.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Dossier introuvable.")

    case.status = CaseStatus.DELETED.value
    await db.commit()
    return {"status": "deleted"}

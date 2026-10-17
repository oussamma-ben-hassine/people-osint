import asyncio
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, AsyncSessionLocal
from app.models.user import User
from app.models.search import SearchJob, SearchResult, JobStatus
from app.schemas.all_schemas import SearchCreate, SearchJobRead, SearchResultRead
from app.api.auth import require_active_user, require_permission
from app.services.search_orchestrator import search_orchestrator

router = APIRouter(prefix="/searches", tags=["searches"])

async def run_search_background(job_id: str):
    async with AsyncSessionLocal() as session:
        await search_orchestrator.execute_search_job(job_id, session)

@router.post("", response_model=SearchJobRead)
async def create_search(
    data: SearchCreate,
    background_tasks: BackgroundTasks,
    user: User = Depends(require_permission("search.create")),
    db: AsyncSession = Depends(get_db)
):
    query_dict = data.model_dump()
    job = SearchJob(
        user_id=user.id,
        status=JobStatus.PENDING.value,
        mode=data.mode,
        depth=data.depth,
        query_params=query_dict,
        progress_pct=0,
        progress_step="Job queued"
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Launch async task
    background_tasks.add_task(run_search_background, job.id)
    return job

@router.get("", response_model=List[SearchJobRead])
async def list_searches(
    user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(SearchJob).where(SearchJob.user_id == user.id).order_by(SearchJob.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/{id}", response_model=SearchJobRead)
async def get_search(
    id: str,
    user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(SearchJob).where(SearchJob.id == id, SearchJob.user_id == user.id)
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Recherche introuvable.")
    return job

@router.get("/{id}/results", response_model=List[SearchResultRead])
async def get_search_results(
    id: str,
    user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(SearchJob).where(SearchJob.id == id, SearchJob.user_id == user.id)
    res = await db.execute(stmt)
    if not res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Recherche introuvable.")

    stmt_res = select(SearchResult).where(SearchResult.job_id == id)
    res_items = await db.execute(stmt_res)
    return res_items.scalars().all()

@router.post("/{id}/refresh", response_model=SearchJobRead)
async def refresh_search(
    id: str,
    background_tasks: BackgroundTasks,
    user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(SearchJob).where(SearchJob.id == id, SearchJob.user_id == user.id)
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Recherche introuvable.")

    # Reset job
    job.status = JobStatus.PENDING.value
    job.progress_pct = 0
    job.progress_step = "Actualisation initiée"
    await db.commit()
    await db.refresh(job)

    background_tasks.add_task(run_search_background, job.id)
    return job

@router.post("/{id}/cancel")
async def cancel_search(
    id: str,
    user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(SearchJob).where(SearchJob.id == id, SearchJob.user_id == user.id)
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Recherche introuvable.")

    job.status = JobStatus.CANCELLED.value
    job.progress_step = "Recherche annulée par l'utilisateur"
    await db.commit()
    return {"status": "cancelled"}

@router.delete("/{id}")
async def delete_search(
    id: str,
    user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(SearchJob).where(SearchJob.id == id, SearchJob.user_id == user.id)
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Recherche introuvable.")

    await db.delete(job)
    await db.commit()
    return {"status": "deleted"}

@router.delete("/{id}/results/{result_id}")
async def delete_search_result(
    id: str,
    result_id: str,
    user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(SearchJob).where(SearchJob.id == id, SearchJob.user_id == user.id)
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Recherche introuvable.")

    stmt_res = select(SearchResult).where(SearchResult.id == result_id, SearchResult.job_id == id)
    res_item = (await db.execute(stmt_res)).scalar_one_or_none()
    if not res_item:
        raise HTTPException(status_code=404, detail="Résultat introuvable.")

    await db.delete(res_item)
    await db.commit()
    return {"status": "deleted", "result_id": result_id}


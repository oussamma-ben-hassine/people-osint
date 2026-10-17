from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.models.knowledge import KnowledgeEntity, KnowledgeRelation, KnowledgeEvidence
from app.schemas.all_schemas import (
    KnowledgeEntityRead, KnowledgeRelationRead, KnowledgeEvidenceRead,
    KnowledgeQueryRequest
)
from app.api.auth import require_active_user, require_permission
from app.services.knowledge_engine import knowledge_engine

router = APIRouter(prefix="/knowledge", tags=["knowledge"])

@router.get("/entities", response_model=List[KnowledgeEntityRead])
async def list_entities(
    type: Optional[str] = Query(None, description="Filtrer par type d'entité"),
    case_id: Optional[str] = Query(None, description="Filtrer par dossier"),
    user: User = Depends(require_permission("knowledge.query")),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(KnowledgeEntity).where(KnowledgeEntity.user_id == user.id)
    if type:
        stmt = stmt.where(KnowledgeEntity.entity_type == type)
    if case_id:
        stmt = stmt.where(KnowledgeEntity.case_id == case_id)
    stmt = stmt.order_by(KnowledgeEntity.name.asc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/entities/{id}", response_model=KnowledgeEntityRead)
async def get_entity(
    id: str,
    user: User = Depends(require_permission("knowledge.query")),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(KnowledgeEntity).where(KnowledgeEntity.id == id, KnowledgeEntity.user_id == user.id)
    res = await db.execute(stmt)
    entity = res.scalar_one_or_none()
    if not entity:
        raise HTTPException(status_code=404, detail="Entité introuvable.")
    return entity

@router.get("/relations", response_model=List[KnowledgeRelationRead])
async def list_relations(
    case_id: Optional[str] = Query(None),
    relation_type: Optional[str] = Query(None),
    user: User = Depends(require_permission("knowledge.query")),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(KnowledgeRelation).where(KnowledgeRelation.user_id == user.id)
    if case_id:
        stmt = stmt.where(KnowledgeRelation.case_id == case_id)
    if relation_type:
        stmt = stmt.where(KnowledgeRelation.relation_type == relation_type)
    res = await db.execute(stmt)
    relations = res.scalars().all()

    # Populate evidence
    result = []
    for r in relations:
        stmt_ev = select(KnowledgeEvidence).where(KnowledgeEvidence.relation_id == r.id)
        res_ev = await db.execute(stmt_ev)
        ev_items = res_ev.scalars().all()
        rel_dict = KnowledgeRelationRead.model_validate(r)
        rel_dict.evidence = [KnowledgeEvidenceRead.model_validate(ev) for ev in ev_items]
        result.append(rel_dict)
    return result

@router.post("/query")
async def query_knowledge(
    req: KnowledgeQueryRequest,
    user: User = Depends(require_permission("knowledge.query")),
    db: AsyncSession = Depends(get_db)
):
    q = req.query.strip()
    entities = await knowledge_engine.search_entities(db, user.id, q, limit=req.limit)
    cases = await knowledge_engine.search_research_cases(db, user.id, q, limit=5)
    docs = await knowledge_engine.search_documents(db, user.id, q, limit=5)
    return {
        "query": q,
        "mode": req.mode,
        "matched_entities": entities,
        "matched_cases": cases,
        "matched_documents": docs
    }

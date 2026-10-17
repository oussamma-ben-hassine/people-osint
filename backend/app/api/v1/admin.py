from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User, UserRole, AccessStatus, AuditLog, AppSetting
from app.models.connector import ConnectorConfig, RetentionPolicy
from app.models.search import SearchJob
from app.models.research import ResearchCase
from app.models.knowledge import KnowledgeEntity, KnowledgeRelation
from app.schemas.all_schemas import (
    UserRead, UserAccessUpdate, ConnectorRead, ConnectorUpdate,
    AppSettingRead, AppSettingUpdate
)
from app.api.auth import require_super_admin

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users", response_model=List[UserRead])
async def list_admin_users(
    admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).order_by(User.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.patch("/users/{id}/access", response_model=UserRead)
async def update_user_access(
    id: str,
    data: UserAccessUpdate,
    admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.id == id)
    res = await db.execute(stmt)
    target_user = res.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")

    if data.role is not None:
        target_user.role = data.role
    if data.access_status is not None:
        target_user.access_status = data.access_status
    if data.permissions is not None:
        target_user.permissions = data.permissions
    if data.quotas is not None:
        target_user.quotas = data.quotas

    # Audit event
    db.add(AuditLog(
        user_id=admin.id,
        event_type="admin.user_access_updated",
        details={
            "target_user_id": target_user.id,
            "target_email": target_user.email,
            "new_role": target_user.role,
            "new_status": target_user.access_status
        }
    ))

    await db.commit()
    await db.refresh(target_user)
    return target_user

@router.get("/connectors", response_model=List[ConnectorRead])
async def list_admin_connectors(
    admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ConnectorConfig).order_by(ConnectorConfig.name.asc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.patch("/connectors/{id}", response_model=ConnectorRead)
async def update_connector_config(
    id: str,
    data: ConnectorUpdate,
    admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ConnectorConfig).where(ConnectorConfig.id == id)
    res = await db.execute(stmt)
    conn = res.scalar_one_or_none()
    if not conn:
        raise HTTPException(status_code=404, detail="Connecteur introuvable.")

    update_dict = data.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(conn, k, v)

    db.add(AuditLog(
        user_id=admin.id,
        event_type="admin.connector_updated",
        details={"connector": conn.name, "updates": list(update_dict.keys())}
    ))

    await db.commit()
    await db.refresh(conn)
    return conn

@router.get("/settings", response_model=List[AppSettingRead])
async def get_settings(
    admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AppSetting)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.patch("/settings/{key}", response_model=AppSettingRead)
async def update_setting(
    key: str,
    data: AppSettingUpdate,
    admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AppSetting).where(AppSetting.key == key)
    res = await db.execute(stmt)
    setting = res.scalar_one_or_none()
    if not setting:
        setting = AppSetting(key=key, value=data.value, description=data.description)
        db.add(setting)
    else:
        setting.value = data.value
        if data.description:
            setting.description = data.description

    db.add(AuditLog(
        user_id=admin.id,
        event_type="admin.setting_updated",
        details={"key": key, "value": data.value}
    ))

    await db.commit()
    await db.refresh(setting)
    return setting

@router.get("/stats")
async def get_system_stats(
    admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db)
):
    user_count = (await db.execute(select(func.count(User.id)))).scalar() or 0
    jobs_count = (await db.execute(select(func.count(SearchJob.id)))).scalar() or 0
    cases_count = (await db.execute(select(func.count(ResearchCase.id)))).scalar() or 0
    entities_count = (await db.execute(select(func.count(KnowledgeEntity.id)))).scalar() or 0
    relations_count = (await db.execute(select(func.count(KnowledgeRelation.id)))).scalar() or 0

    return {
        "users_total": user_count,
        "searches_total": jobs_count,
        "cases_total": cases_count,
        "knowledge_entities": entities_count,
        "knowledge_relations": relations_count,
        "sso_status": "ONLINE",
        "ai_gateway_status": "ONLINE"
    }

@router.get("/audit")
async def get_audit_logs(
    admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(100)
    res = await db.execute(stmt)
    return res.scalars().all()

# GDPR / Privacy deletion
@router.post("/gdpr/erasure/{user_id}")
async def gdpr_erasure_request(
    user_id: str,
    admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    target = res.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")

    # Cascading delete of user's personal research data
    await db.execute(delete(KnowledgeRelation).where(KnowledgeRelation.user_id == user_id))
    await db.execute(delete(KnowledgeEntity).where(KnowledgeEntity.user_id == user_id))
    await db.execute(delete(ResearchCase).where(ResearchCase.user_id == user_id))
    await db.execute(delete(SearchJob).where(SearchJob.user_id == user_id))
    await db.delete(target)

    db.add(AuditLog(
        user_id=admin.id,
        event_type="gdpr.user_erased",
        details={"erased_user_id": user_id}
    ))
    await db.commit()
    return {"status": "erased", "message": "Données personnelles et entités associées supprimées conformément au RGPD."}

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.models.connector import ConnectorConfig
from app.schemas.all_schemas import ConnectorRead
from app.api.auth import require_active_user

router = APIRouter(prefix="/connectors", tags=["connectors"])

@router.get("", response_model=List[ConnectorRead])
async def list_connectors(
    user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ConnectorConfig).order_by(ConnectorConfig.name.asc())
    res = await db.execute(stmt)
    return res.scalars().all()

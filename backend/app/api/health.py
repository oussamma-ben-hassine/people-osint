from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db

router = APIRouter(prefix="/health", tags=["health"])

@router.get("/live")
async def health_live():
    return {"status": "alive", "service": "people-osint-api"}

@router.get("/ready")
async def health_ready(response: Response, db: AsyncSession = Depends(get_db)):
    db_ok = False
    try:
        res = await db.execute(text("SELECT 1"))
        db_ok = res.scalar() == 1
    except Exception:
        db_ok = False

    if not db_ok:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "unhealthy", "database": "disconnected"}

    return {"status": "ready", "database": "connected"}

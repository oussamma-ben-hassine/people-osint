import asyncio
import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, delete

from app.workers.celery_app import celery_app
from app.core.database import AsyncSessionLocal
from app.core.config import settings
from app.services.search_orchestrator import search_orchestrator
from app.models.research import ResearchCase, CaseStatus
from app.models.search import SearchJob
from app.models.knowledge import KnowledgeRelation, KnowledgeEntity

logger = logging.getLogger(__name__)

def run_async(coro):
    return asyncio.run(coro)

@celery_app.task(name="app.workers.tasks.run_osint_search_task")
def run_osint_search_task(job_id: str):
    async def _run():
        async with AsyncSessionLocal() as session:
            await search_orchestrator.execute_search_job(job_id, session)
    return run_async(_run())

@celery_app.task(name="app.workers.tasks.cleanup_expired_data_task")
def cleanup_expired_data_task():
    """
    Automatic GDPR retention cleanup:
    Purges data older than KNOWLEDGE_RETENTION_DAYS.
    """
    async def _cleanup():
        cutoff = datetime.now(timezone.utc) - timedelta(days=settings.KNOWLEDGE_RETENTION_DAYS)
        async with AsyncSessionLocal() as session:
            logger.info(f"Running automated retention cleanup before {cutoff}...")
            # Cleanup old relations past valid_until
            stmt_exp = delete(KnowledgeRelation).where(
                KnowledgeRelation.valid_until != None,
                KnowledgeRelation.valid_until < datetime.now(timezone.utc)
            )
            await session.execute(stmt_exp)
            await session.commit()
            logger.info("Retention cleanup completed.")
    return run_async(_cleanup())

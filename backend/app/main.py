import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
from app.services.policy_engine import policy_engine
from app.api.auth import router as auth_router
from app.api.health import router as health_router
from app.api.v1.searches import router as searches_router
from app.api.v1.research_cases import router as cases_router
from app.api.v1.knowledge import router as knowledge_router
from app.api.v1.graph import router as graph_router
from app.api.v1.ai import router as ai_router
from app.api.v1.exposure import router as exposure_router
from app.api.v1.exports import router as exports_router
from app.api.v1.connectors import router as connectors_router
from app.api.v1.admin import router as admin_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("people_osint")

from sqlalchemy import text

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database schema and policies...")
    async with engine.begin() as conn:
        try:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            await conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
        except Exception as e:
            logger.warning(f"Could not create extensions (might already exist or not supported): {e}")
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionLocal() as session:
        await policy_engine.initialize_default_policies(session)

    logger.info("People OSINT API started successfully.")
    yield
    logger.info("Shutting down People OSINT API...")

app = FastAPI(
    title="People OSINT API",
    version="1.0.0",
    description="Multi-source OSINT knowledge engine, interactive graph & AI investigation platform",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth_router)
app.include_router(auth_router, prefix="/api/v1")
app.include_router(health_router)
app.include_router(searches_router, prefix="/api/v1")
app.include_router(cases_router, prefix="/api/v1")
app.include_router(knowledge_router, prefix="/api/v1")
app.include_router(graph_router, prefix="/api/v1")
app.include_router(ai_router, prefix="/api/v1")
app.include_router(exposure_router, prefix="/api/v1")
app.include_router(exports_router, prefix="/api/v1")
app.include_router(connectors_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")

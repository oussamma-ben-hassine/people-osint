import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.core.database import Base, get_db
from app.core.config import settings
from app.main import app
from app.models.user import User, UserRole, AccessStatus
from app.core.security import create_session_token

# Use SQLite in-memory for fast automated unit tests
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

@pytest_asyncio.fixture(scope="function")
async def test_db():
    engine = create_async_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest_asyncio.fixture(scope="function")
async def client(test_db):
    async def override_get_db():
        yield test_db

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()

@pytest_asyncio.fixture(scope="function")
async def superadmin_user(test_db):
    user = User(
        sso_issuer="https://sso-a.oussamma.tn",
        sso_sub="superadmin-sub-001",
        email="superadmin@oussamma.tn",
        name="Super Admin",
        role=UserRole.SUPER_ADMIN.value,
        access_status=AccessStatus.ACTIVE.value,
        permissions=["search.create", "search.read_own", "research.read_own", "research.delete_own", "knowledge.query", "graph.view", "exposure.check_own", "reports.export", "connectors.manage", "users.manage", "settings.manage", "audit.read"]
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user

@pytest_asyncio.fixture(scope="function")
async def pending_user(test_db):
    user = User(
        sso_issuer="https://sso-a.oussamma.tn",
        sso_sub="regular-user-sub-002",
        email="visitor@example.com",
        name="Visitor User",
        role=UserRole.USER.value,
        access_status=AccessStatus.PENDING.value,
        permissions=[]
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user

@pytest_asyncio.fixture(scope="function")
async def active_user(test_db):
    user = User(
        sso_issuer="https://sso-a.oussamma.tn",
        sso_sub="approved-user-sub-003",
        email="analyst@example.com",
        name="Analyst User",
        role=UserRole.USER.value,
        access_status=AccessStatus.ACTIVE.value,
        permissions=["search.create", "search.read_own", "research.read_own", "knowledge.query", "graph.view", "exposure.check_own", "reports.export"]
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user

def auth_headers_for(user: User):
    token = create_session_token({"sub": user.id, "role": user.role, "status": user.access_status})
    return {"Authorization": f"Bearer {token}"}

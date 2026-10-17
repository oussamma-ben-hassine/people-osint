import pytest
from tests.conftest import auth_headers_for
from app.models.user import UserRole, AccessStatus
from app.models.research import ResearchCase

@pytest.mark.asyncio
async def test_oidc_login_url_generation(client):
    resp = await client.get("/auth/login")
    assert resp.status_code == 200
    data = resp.json()
    assert "authorization_url" in data
    assert "client_people_osint" in data["authorization_url"]
    assert "code_challenge=" in data["authorization_url"]
    assert "code_challenge_method=S256" in data["authorization_url"]

@pytest.mark.asyncio
async def test_unauthenticated_request_is_denied(client):
    resp = await client.get("/api/v1/searches")
    assert resp.status_code == 401

@pytest.mark.asyncio
async def test_strict_initial_access_pending_user_is_forbidden(client, pending_user):
    """
    CRITICAL REQUIREMENT 3.1:
    New SSO users default to PENDING and MUST see 403 Forbidden on all feature routes.
    """
    headers = auth_headers_for(pending_user)
    
    # Check searches
    resp = await client.get("/api/v1/searches", headers=headers)
    assert resp.status_code == 403
    assert "PENDING" in resp.json()["detail"]

    # Check research cases
    resp = await client.get("/api/v1/research-cases", headers=headers)
    assert resp.status_code == 403

    # Check knowledge
    resp = await client.get("/api/v1/knowledge/entities", headers=headers)
    assert resp.status_code == 403

    # Check graph
    resp = await client.get("/api/v1/graph", headers=headers)
    assert resp.status_code == 403

    # Check admin
    resp = await client.get("/api/v1/admin/users", headers=headers)
    assert resp.status_code == 403

@pytest.mark.asyncio
async def test_superadmin_bootstrap_and_approval_flow(client, superadmin_user, pending_user):
    """
    SUPER_ADMIN can list users and approve a PENDING user to ACTIVE.
    Once approved, the user gains access to authorized features.
    """
    admin_headers = auth_headers_for(superadmin_user)
    
    # 1. Super Admin lists users
    resp = await client.get("/api/v1/admin/users", headers=admin_headers)
    assert resp.status_code == 200
    users = resp.json()
    assert len(users) >= 2

    # 2. Super Admin approves pending user
    approve_payload = {
        "access_status": AccessStatus.ACTIVE.value,
        "permissions": ["search.create", "search.read_own", "research.read_own", "knowledge.query", "graph.view"]
    }
    patch_resp = await client.patch(f"/api/v1/admin/users/{pending_user.id}/access", json=approve_payload, headers=admin_headers)
    assert patch_resp.status_code == 200
    assert patch_resp.json()["access_status"] == AccessStatus.ACTIVE.value

    # 3. Newly approved user can now access searches
    user_headers = auth_headers_for(pending_user)
    # Update token status representation
    pending_user.access_status = AccessStatus.ACTIVE.value
    user_headers = auth_headers_for(pending_user)
    
    search_resp = await client.get("/api/v1/searches", headers=user_headers)
    assert search_resp.status_code == 200

@pytest.mark.asyncio
async def test_user_data_isolation(client, test_db, active_user, superadmin_user):
    """
    Ensures strict object-level isolation: User A cannot access User B's case.
    """
    # Create private case for superadmin
    private_case = ResearchCase(
        user_id=superadmin_user.id,
        title="Dossier Secret Superadmin",
        target_name="Projet Confidentiel",
        mode="PROFESSIONAL"
    )
    test_db.add(private_case)
    await test_db.commit()
    await test_db.refresh(private_case)

    # Active regular user attempts to access superadmin's case
    user_headers = auth_headers_for(active_user)
    resp = await client.get(f"/api/v1/research-cases/{private_case.id}", headers=user_headers)
    assert resp.status_code == 404

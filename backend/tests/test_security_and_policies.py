import pytest
from app.core.security import is_safe_external_url, encrypt_secret, decrypt_secret
from app.services.policy_engine import policy_engine

def test_ssrf_protection_blocks_malicious_and_internal_targets():
    # Loopback & local
    assert is_safe_external_url("http://127.0.0.1/admin") is False
    assert is_safe_external_url("http://localhost:8000") is False
    assert is_safe_external_url("http://[::1]/") is False

    # Private RFC1918 subnets
    assert is_safe_external_url("http://10.0.0.1:8080/secret") is False
    assert is_safe_external_url("http://192.168.1.1/router") is False
    assert is_safe_external_url("http://172.16.0.5/api") is False

    # Cloud metadata endpoints
    assert is_safe_external_url("http://169.254.169.254/latest/meta-data") is False
    assert is_safe_external_url("http://metadata.google.internal") is False

    # Valid public web domains
    assert is_safe_external_url("https://api.github.com/users") is True
    assert is_safe_external_url("https://pub.orcid.org") is True

def test_aes_gcm_credential_encryption():
    secret = "sk-super-secret-key-12345"
    encrypted = encrypt_secret(secret)
    assert encrypted != secret
    decrypted = decrypt_secret(encrypted)
    assert decrypted == secret

@pytest.mark.asyncio
async def test_policy_engine_deny_by_default(test_db):
    # Unregistered connector should be denied by default
    can_search = await policy_engine.can_perform_action("unregistered_dark_source", "search", test_db)
    assert can_search is False

@pytest.mark.asyncio
async def test_health_endpoints(client):
    res_live = await client.get("/health/live")
    assert res_live.status_code == 200
    assert res_live.json()["status"] == "alive"

    res_ready = await client.get("/health/ready")
    assert res_ready.status_code == 200
    assert res_ready.json()["status"] == "ready"

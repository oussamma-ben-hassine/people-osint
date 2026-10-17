import pytest
from tests.conftest import auth_headers_for
from app.services.knowledge_engine import knowledge_engine
from app.models.research import ResearchCase
from app.models.knowledge import EntityType, RelationType, ConnectionNature

@pytest.mark.asyncio
async def test_knowledge_base_and_cytoscape_graph(test_db, active_user):
    # 1. Create entities
    p1 = await knowledge_engine.get_or_create_entity(
        test_db, active_user.id, EntityType.PERSON.value, "Alice Researcher"
    )
    o1 = await knowledge_engine.get_or_create_entity(
        test_db, active_user.id, EntityType.ORGANIZATION.value, "Inria Labs"
    )

    # 2. Add relation with evidence
    rel = await knowledge_engine.add_relation_with_evidence(
        db=test_db,
        user_id=active_user.id,
        source_id=p1.id,
        target_id=o1.id,
        relation_type=RelationType.WORKED_AT.value,
        connection_nature=ConnectionNature.DOCUMENTED.value,
        uncertainty_score=0.05,
        source_url="https://inria.fr/team/alice",
        evidence_snippet="Alice Researcher joined Inria as a Principal Scientist."
    )
    await test_db.commit()

    # 3. Retrieve Cytoscape graph
    graph = await knowledge_engine.get_user_graph(test_db, active_user.id)
    assert len(graph.nodes) == 2
    assert len(graph.edges) == 1
    edge = graph.edges[0].data
    assert edge.source == p1.id
    assert edge.target == o1.id
    assert edge.label == "WORKED_AT"
    assert edge.connection_nature == "DOCUMENTED"
    assert edge.uncertainty_score == 0.05
    assert edge.evidence_count == 1

@pytest.mark.asyncio
async def test_ai_explorer_safe_tools_no_arbitrary_sql(test_db, active_user):
    # Seed an entity and query via safe tool
    await knowledge_engine.get_or_create_entity(
        test_db, active_user.id, EntityType.PERSON.value, "Bob CyberExpert"
    )
    await test_db.commit()

    entities = await knowledge_engine.search_entities(test_db, active_user.id, "CyberExpert")
    assert len(entities) == 1
    assert entities[0]["name"] == "Bob CyberExpert"

@pytest.mark.asyncio
async def test_exposure_monitor_requires_ownership_proof(client, active_user):
    headers = auth_headers_for(active_user)
    
    # 1. User checks external third-party domain without auto-proof
    create_resp = await client.post(
        "/api/v1/exposure/checks",
        json={"identifier_type": "DOMAIN", "identifier_value": "company-target.com"},
        headers=headers
    )
    assert create_resp.status_code == 200
    check_data = create_resp.json()
    assert check_data["is_verified"] is False
    assert check_data["verification_token"] is not None
    token = check_data["verification_token"]

    # 2. Complete verification with token
    verify_resp = await client.post(
        f"/api/v1/exposure/checks/{check_data['id']}/verify",
        json={"verification_token": token},
        headers=headers
    )
    assert verify_resp.status_code == 200
    assert verify_resp.json()["is_verified"] is True
    assert len(verify_resp.json()["recommendations"]) > 0

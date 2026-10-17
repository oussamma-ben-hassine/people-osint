from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.schemas.all_schemas import CytoscapeGraphResponse
from app.api.auth import require_permission
from app.services.knowledge_engine import knowledge_engine

router = APIRouter(prefix="/graph", tags=["graph"])

@router.get("", response_model=CytoscapeGraphResponse)
async def get_graph(
    case_id: Optional[str] = Query(None, description="Filtrer le graphe par dossier"),
    user: User = Depends(require_permission("graph.view")),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns full Cytoscape-formatted graph with nodes and edges.
    Differentiates visually: DOCUMENTED, DECLARED, and UNCERTAIN edges.
    """
    graph_data = await knowledge_engine.get_user_graph(db, user.id, case_id)
    return graph_data

@router.get("/entities/{id}")
async def get_entity_graph_subgraph(
    id: str,
    user: User = Depends(require_permission("graph.view")),
    db: AsyncSession = Depends(get_db)
):
    # Returns 1-hop subgraph centered on entity
    full_graph = await knowledge_engine.get_user_graph(db, user.id)
    related_edge_ids = set()
    neighbor_node_ids = {id}

    for edge in full_graph.edges:
        if edge.data.source == id or edge.data.target == id:
            related_edge_ids.add(edge.data.id)
            neighbor_node_ids.add(edge.data.source)
            neighbor_node_ids.add(edge.data.target)

    sub_nodes = [n for n in full_graph.nodes if n.data.id in neighbor_node_ids]
    sub_edges = [e for e in full_graph.edges if e.data.id in related_edge_ids]

    return {"nodes": sub_nodes, "edges": sub_edges}

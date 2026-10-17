from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

# User & Auth
class UserRead(BaseModel):
    id: str
    sso_issuer: str
    sso_sub: str
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    access_status: str
    permissions: List[str] = []
    quotas: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserAccessUpdate(BaseModel):
    role: Optional[str] = None
    access_status: Optional[str] = None
    permissions: Optional[List[str]] = None
    quotas: Optional[Dict[str, Any]] = None

# Search
class SearchCreate(BaseModel):
    first_name: Optional[str] = None
    last_name: str
    country: Optional[str] = None
    city: Optional[str] = None
    profession: Optional[str] = None
    organization: Optional[str] = None
    keywords: Optional[str] = None
    mode: str = "PROFESSIONAL"  # PROFESSIONAL or FULL_WEB
    depth: str = "QUICK"         # QUICK, DEEP, EXTENDED
    use_existing_knowledge: bool = True
    enable_ai_analysis: bool = True
    selected_connectors: Optional[List[str]] = None

class SearchJobRead(BaseModel):
    id: str
    user_id: str
    case_id: Optional[str] = None
    status: str
    mode: str
    depth: str
    query_params: Dict[str, Any]
    progress_pct: int
    progress_step: str
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SearchResultRead(BaseModel):
    id: str
    job_id: str
    case_id: Optional[str] = None
    connector: str
    source_url: str
    title: str
    snippet: str
    raw_data: Dict[str, Any] = {}
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Research Cases & Snapshots
class ResearchCaseRead(BaseModel):
    id: str
    user_id: str
    title: str
    target_name: str
    mode: str
    status: str
    summary_ai: Optional[str] = None
    tags: List[str] = []
    notes: Optional[str] = None
    meta_info: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ResearchSnapshotRead(BaseModel):
    id: str
    case_id: str
    snapshot_number: int
    summary: str
    data_snapshot: Dict[str, Any]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CompareCasesRequest(BaseModel):
    case_ids: List[str]

class CompareCasesResponse(BaseModel):
    cases: List[ResearchCaseRead]
    common_entities: List[Dict[str, Any]]
    contradictory_facts: List[Dict[str, Any]]
    divergences_summary: str

# Knowledge Base & Relations
class KnowledgeEntityRead(BaseModel):
    id: str
    user_id: str
    case_id: Optional[str] = None
    entity_type: str
    name: str
    canonical_id: Optional[str] = None
    attributes: Dict[str, Any] = {}
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class KnowledgeEvidenceRead(BaseModel):
    id: str
    relation_id: str
    source_url: str
    text_snippet: str
    verified: bool
    consulted_at: datetime

    model_config = ConfigDict(from_attributes=True)

class KnowledgeRelationRead(BaseModel):
    id: str
    user_id: str
    case_id: Optional[str] = None
    source_entity_id: str
    target_entity_id: str
    relation_type: str
    connection_nature: str
    uncertainty_score: float
    provenance: str
    access_policy: str
    valid_until: Optional[datetime] = None
    created_at: datetime
    evidence: List[KnowledgeEvidenceRead] = []

    model_config = ConfigDict(from_attributes=True)

class KnowledgeQueryRequest(BaseModel):
    query: str
    mode: str = "HYBRID"  # KEYWORD, SEMANTIC, STRUCTURED, GRAPH, HYBRID
    limit: int = 20

# Cytoscape Graph
class CytoscapeNodeData(BaseModel):
    id: str
    label: str
    entity_type: str
    attributes: Dict[str, Any] = {}

class CytoscapeNode(BaseModel):
    data: CytoscapeNodeData

class CytoscapeEdgeData(BaseModel):
    id: str
    source: str
    target: str
    label: str
    relation_type: str
    connection_nature: str
    uncertainty_score: float
    evidence_count: int

class CytoscapeEdge(BaseModel):
    data: CytoscapeEdgeData

class CytoscapeGraphResponse(BaseModel):
    nodes: List[CytoscapeNode]
    edges: List[CytoscapeEdge]

# AI Assistant
class AIConversationCreate(BaseModel):
    title: Optional[str] = None
    mode: str = "KNOWLEDGE_ONLY" # KNOWLEDGE_ONLY or WEB_ENRICHED
    case_id: Optional[str] = None

class AIConversationRead(BaseModel):
    id: str
    user_id: str
    title: str
    mode: str
    case_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AIMessageCreate(BaseModel):
    content: str

class AIMessageRead(BaseModel):
    id: str
    conversation_id: str
    sender: str
    content: str
    citations: List[Dict[str, Any]] = []
    tools_used: List[Dict[str, Any]] = []
    tokens_used: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Exposure Monitor
class ExposureCheckCreate(BaseModel):
    identifier_type: str = "EMAIL"
    identifier_value: str

class ExposureVerifyRequest(BaseModel):
    verification_token: str

class ExposureCheckRead(BaseModel):
    id: str
    user_id: str
    identifier_type: str
    identifier_value: str
    is_verified: bool
    verification_token: Optional[str] = None
    verification_method: str
    breach_count: int
    breach_details: List[Dict[str, Any]]
    recommendations: List[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Connectors & Admin
class ConnectorRead(BaseModel):
    id: str
    name: str
    display_name: str
    is_enabled: bool
    allows_search: bool
    allows_extract: bool
    allows_store: bool
    allows_export: bool
    rate_limit_per_minute: int
    daily_quota: int
    custom_settings: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True)

class ConnectorUpdate(BaseModel):
    is_enabled: Optional[bool] = None
    allows_search: Optional[bool] = None
    allows_extract: Optional[bool] = None
    allows_store: Optional[bool] = None
    allows_export: Optional[bool] = None
    rate_limit_per_minute: Optional[int] = None
    daily_quota: Optional[int] = None
    custom_settings: Optional[Dict[str, Any]] = None

class AppSettingRead(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

class AppSettingUpdate(BaseModel):
    value: str
    description: Optional[str] = None

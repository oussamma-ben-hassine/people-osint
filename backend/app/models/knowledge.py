import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    String, Integer, Float, Text, JSON, DateTime, ForeignKey, Boolean, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.user import gen_uuid, utc_now

class EntityType(str, Enum):
    PERSON = "Person"
    ORGANIZATION = "Organization"
    PROJECT = "Project"
    PUBLICATION = "Publication"
    DOCUMENT = "Document"
    PUBLIC_PROFILE = "PublicProfile"
    RESEARCH_CASE = "ResearchCase"
    SOURCE = "Source"

class RelationType(str, Enum):
    WORKED_AT = "WORKED_AT"
    CONTRIBUTED_TO = "CONTRIBUTED_TO"
    COAUTHORED_WITH = "COAUTHORED_WITH"
    MEMBER_OF = "MEMBER_OF"
    PARTICIPATED_IN = "PARTICIPATED_IN"
    AFFILIATED_WITH = "AFFILIATED_WITH"
    DECLARED_CONNECTION = "DECLARED_CONNECTION"

class ConnectionNature(str, Enum):
    DOCUMENTED = "DOCUMENTED"
    DECLARED = "DECLARED"
    UNCERTAIN = "UNCERTAIN"

class Source(Base):
    __tablename__ = "sources"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    case_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("research_cases.id", ondelete="CASCADE"), nullable=True, index=True)
    
    domain: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    url: Mapped[str] = mapped_column(String(1024), nullable=False)
    connector: Mapped[str] = mapped_column(String(64), nullable=False)
    trust_score: Mapped[float] = mapped_column(Float, default=0.7)
    license_info: Mapped[str] = mapped_column(String(255), default="Public Web Document")
    consulted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

class SourceDocument(Base):
    __tablename__ = "source_documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    source_id: Mapped[str] = mapped_column(String(36), ForeignKey("sources.id", ondelete="CASCADE"), nullable=False, index=True)
    case_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)
    
    title: Mapped[str] = mapped_column(String(512), default="")
    content: Mapped[str] = mapped_column(Text, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(64), default="text/html")
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    extracted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

class KnowledgeEntity(Base):
    __tablename__ = "knowledge_entities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    case_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("research_cases.id", ondelete="SET NULL"), nullable=True, index=True)
    
    entity_type: Mapped[str] = mapped_column(String(32), default=EntityType.PERSON.value, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    canonical_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    attributes: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

class KnowledgeRelation(Base):
    __tablename__ = "knowledge_relations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    case_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("research_cases.id", ondelete="SET NULL"), nullable=True, index=True)
    
    source_entity_id: Mapped[str] = mapped_column(String(36), ForeignKey("knowledge_entities.id", ondelete="CASCADE"), nullable=False, index=True)
    target_entity_id: Mapped[str] = mapped_column(String(36), ForeignKey("knowledge_entities.id", ondelete="CASCADE"), nullable=False, index=True)
    
    relation_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    connection_nature: Mapped[str] = mapped_column(String(32), default=ConnectionNature.DOCUMENTED.value, nullable=False)
    uncertainty_score: Mapped[float] = mapped_column(Float, default=0.1, nullable=False) # 0.0=certain, 1.0=uncertain
    
    provenance: Mapped[str] = mapped_column(String(255), default="Automated multi-source extraction")
    access_policy: Mapped[str] = mapped_column(String(32), default="OWNER_ONLY")
    valid_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

class KnowledgeEvidence(Base):
    __tablename__ = "knowledge_evidence"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    relation_id: Mapped[str] = mapped_column(String(36), ForeignKey("knowledge_relations.id", ondelete="CASCADE"), nullable=False, index=True)
    source_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("sources.id", ondelete="SET NULL"), nullable=True)
    
    source_url: Mapped[str] = mapped_column(String(1024), default="")
    text_snippet: Mapped[str] = mapped_column(Text, nullable=False)
    verified: Mapped[bool] = mapped_column(Boolean, default=True)
    consulted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

class PublicFact(Base):
    __tablename__ = "public_facts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    entity_id: Mapped[str] = mapped_column(String(36), ForeignKey("knowledge_entities.id", ondelete="CASCADE"), nullable=False, index=True)
    case_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("research_cases.id", ondelete="CASCADE"), nullable=True, index=True)
    
    fact_type: Mapped[str] = mapped_column(String(64), nullable=False)
    fact_value: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.8)
    source_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    valid_date: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    document_id: Mapped[str] = mapped_column(String(36), ForeignKey("source_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index: Mapped[int] = mapped_column(Integer, default=0)
    text_content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding_vector: Mapped[Optional[List[float]]] = mapped_column(JSON, nullable=True)
    meta_chunk: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    String, Integer, Float, Text, JSON, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.models.user import gen_uuid, utc_now

class CaseStatus(str, Enum):
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"
    DELETED = "DELETED"

class ResearchCase(Base):
    __tablename__ = "research_cases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    target_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    mode: Mapped[str] = mapped_column(String(32), default="PROFESSIONAL", nullable=False)
    status: Mapped[str] = mapped_column(String(32), default=CaseStatus.ACTIVE.value, nullable=False)
    
    summary_ai: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tags: Mapped[List[str]] = mapped_column(JSON, default=list)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    meta_info: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

class ResearchSnapshot(Base):
    __tablename__ = "research_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("research_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    snapshot_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    
    summary: Mapped[str] = mapped_column(Text, default="", nullable=False)
    data_snapshot: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

class PersonCandidate(Base):
    __tablename__ = "person_candidates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("research_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    disambiguation_score: Mapped[float] = mapped_column(Float, default=1.0)
    attributes: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    confidence: Mapped[float] = mapped_column(Float, default=0.8)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

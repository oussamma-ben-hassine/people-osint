import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Dict, Any
from sqlalchemy import (
    String, Integer, Text, JSON, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.models.user import gen_uuid, utc_now

class JobStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    PARTIAL = "PARTIAL"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class SearchMode(str, Enum):
    PROFESSIONAL = "PROFESSIONAL"
    FULL_WEB = "FULL_WEB"

class SearchDepth(str, Enum):
    QUICK = "QUICK"
    DEEP = "DEEP"
    EXTENDED = "EXTENDED"

class SearchJob(Base):
    __tablename__ = "search_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    case_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)
    
    status: Mapped[str] = mapped_column(String(32), default=JobStatus.PENDING.value, nullable=False, index=True)
    mode: Mapped[str] = mapped_column(String(32), default=SearchMode.PROFESSIONAL.value, nullable=False)
    depth: Mapped[str] = mapped_column(String(32), default=SearchDepth.QUICK.value, nullable=False)
    
    query_params: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    progress_pct: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    progress_step: Mapped[str] = mapped_column(String(128), default="Initialized", nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

class SearchResult(Base):
    __tablename__ = "search_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("search_jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    case_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)
    
    connector: Mapped[str] = mapped_column(String(64), nullable=False)
    source_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    title: Mapped[str] = mapped_column(String(512), default="", nullable=False)
    snippet: Mapped[str] = mapped_column(Text, default="", nullable=False)
    raw_data: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    @property
    def image_url(self) -> Optional[str]:
        if not self.raw_data or not isinstance(self.raw_data, dict):
            return None
        return (
            self.raw_data.get("image_url")
            or self.raw_data.get("avatar_url")
            or self.raw_data.get("img_src")
            or self.raw_data.get("thumbnail_src")
            or self.raw_data.get("thumbnail")
        )


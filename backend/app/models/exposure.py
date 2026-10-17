import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    String, Integer, Boolean, Text, JSON, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.models.user import gen_uuid, utc_now

class IdentifierType(str, Enum):
    EMAIL = "EMAIL"
    DOMAIN = "DOMAIN"

class ExposureCheck(Base):
    __tablename__ = "exposure_checks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    
    identifier_type: Mapped[str] = mapped_column(String(32), default=IdentifierType.EMAIL.value, nullable=False)
    identifier_value: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verification_token: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    verification_method: Mapped[str] = mapped_column(String(64), default="DNS_OR_EMAIL_PROOF")
    
    breach_count: Mapped[int] = mapped_column(Integer, default=0)
    breach_details: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    recommendations: Mapped[List[str]] = mapped_column(JSON, default=list)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

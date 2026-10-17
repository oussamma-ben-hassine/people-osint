import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy import (
    String, Integer, Boolean, Text, JSON, DateTime
)
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.models.user import gen_uuid, utc_now

class ConnectorConfig(Base):
    __tablename__ = "connectors"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    display_name: Mapped[str] = mapped_column(String(128), nullable=False)
    
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    allows_search: Mapped[bool] = mapped_column(Boolean, default=True)
    allows_extract: Mapped[bool] = mapped_column(Boolean, default=True)
    allows_store: Mapped[bool] = mapped_column(Boolean, default=True)
    allows_export: Mapped[bool] = mapped_column(Boolean, default=True)
    
    rate_limit_per_minute: Mapped[int] = mapped_column(Integer, default=60)
    daily_quota: Mapped[int] = mapped_column(Integer, default=500)
    custom_settings: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

class RetentionPolicy(Base):
    __tablename__ = "retention_policies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    category: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    retention_days: Mapped[int] = mapped_column(Integer, default=30)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

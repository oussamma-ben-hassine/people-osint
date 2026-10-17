import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    String, Integer, Text, JSON, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.models.user import gen_uuid, utc_now

class AIMode(str, Enum):
    KNOWLEDGE_ONLY = "KNOWLEDGE_ONLY"
    WEB_ENRICHED = "WEB_ENRICHED"

class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), default="Nouvelle consultation IA")
    mode: Mapped[str] = mapped_column(String(32), default=AIMode.KNOWLEDGE_ONLY.value, nullable=False)
    case_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("research_cases.id", ondelete="SET NULL"), nullable=True, index=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

class AIMessage(Base):
    __tablename__ = "ai_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    conversation_id: Mapped[str] = mapped_column(String(36), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    sender: Mapped[str] = mapped_column(String(32), nullable=False) # "user", "assistant", "tool"
    content: Mapped[str] = mapped_column(Text, nullable=False)
    citations: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    tools_used: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    tokens_used: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

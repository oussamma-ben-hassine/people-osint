from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.models.ai import AIConversation, AIMessage, AIMode
from app.schemas.all_schemas import (
    AIConversationCreate, AIConversationRead,
    AIMessageCreate, AIMessageRead
)
from app.api.auth import require_active_user
from app.services.ai_provider import ai_provider
from app.services.knowledge_engine import knowledge_engine

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/conversations", response_model=AIConversationRead)
async def create_conversation(
    data: AIConversationCreate,
    user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db)
):
    conv = AIConversation(
        user_id=user.id,
        title=data.title or "Nouvelle session AI Explorer",
        mode=data.mode,
        case_id=data.case_id
    )
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return conv

@router.get("/conversations", response_model=List[AIConversationRead])
async def list_conversations(
    user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AIConversation).where(AIConversation.user_id == user.id).order_by(AIConversation.updated_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/conversations/{id}/messages", response_model=List[AIMessageRead])
async def get_messages(
    id: str,
    user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AIConversation).where(AIConversation.id == id, AIConversation.user_id == user.id)
    res = await db.execute(stmt)
    if not res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Conversation introuvable.")

    stmt_m = select(AIMessage).where(AIMessage.conversation_id == id).order_by(AIMessage.created_at.asc())
    res_m = await db.execute(stmt_m)
    return res_m.scalars().all()

@router.post("/conversations/{id}/messages", response_model=AIMessageRead)
async def send_message(
    id: str,
    data: AIMessageCreate,
    user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AIConversation).where(AIConversation.id == id, AIConversation.user_id == user.id)
    res = await db.execute(stmt)
    conv = res.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation introuvable.")

    # 1. Save User Message
    user_msg = AIMessage(
        conversation_id=conv.id,
        sender="user",
        content=data.content
    )
    db.add(user_msg)
    await db.commit()

    # 2. Retrieve relevant context via safe controlled tools
    user_q = data.content.strip()
    matched_entities = await knowledge_engine.search_entities(db, user.id, user_q, limit=5)
    matched_cases = await knowledge_engine.search_research_cases(db, user.id, user_q, limit=3)
    matched_docs = await knowledge_engine.search_documents(db, user.id, user_q, limit=3)

    citations = []
    context_str = "CONTEXTE AUTORISÉ DE LA BASE DE CONNAISSANCES :\n"
    for e in matched_entities:
        context_str += f"- Entité : {e['name']} ({e['type']}), attributs: {e.get('attributes')}\n"
        citations.append({"type": "entity", "name": e["name"], "entity_type": e["type"]})

    for c in matched_cases:
        context_str += f"- Dossier : '{c['title']}' sur {c['target_name']}\n"
        citations.append({"type": "case", "title": c["title"]})

    for d in matched_docs:
        context_str += f"- Document : '{d['title']}' : {d['content_snippet']}\n"
        citations.append({"type": "document", "title": d["title"]})

    # Mode notice
    mode_instructions = ""
    if conv.mode == AIMode.KNOWLEDGE_ONLY.value:
        mode_instructions = "Tu es en mode KNOWLEDGE_ONLY. Tu ne dois répondre qu'à partir des informations fournies ci-dessus. N'invente aucun fait externe."
    else:
        mode_instructions = "Tu es en mode WEB_ENRICHED. Indique clairement les éléments issus de la base interne et ceux relevant de connaissances générales ou enrichies."

    messages = [
        {
            "role": "system",
            "content": (
                "Tu es l'assistant d'investigation AI Explorer de 'People OSINT'. "
                f"{mode_instructions}\n"
                "Réponds avec rigueur, cite tes sources et explicite tout doute ou incertitude."
            )
        },
        {
            "role": "user",
            "content": f"{context_str}\n\nQuestion de l'analyste :\n{user_q}"
        }
    ]

    ai_resp = await ai_provider.chat_completion(messages)
    assistant_content = ai_resp.get("content", "Aucune réponse disponible.")
    tokens = ai_resp.get("tokens", 0)

    assistant_msg = AIMessage(
        conversation_id=conv.id,
        sender="assistant",
        content=assistant_content,
        citations=citations,
        tools_used=[
            {"name": "search_entities", "count": len(matched_entities)},
            {"name": "search_research_cases", "count": len(matched_cases)},
            {"name": "search_documents", "count": len(matched_docs)}
        ],
        tokens_used=tokens
    )
    db.add(assistant_msg)
    await db.commit()
    await db.refresh(assistant_msg)

    return assistant_msg

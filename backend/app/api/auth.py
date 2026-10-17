from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import secrets

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_session_token, decode_session_token
from app.models.user import User, UserRole, AccessStatus
from app.schemas.all_schemas import UserRead
from app.services.sso_service import sso_service

router = APIRouter(prefix="/auth", tags=["auth"])

# State/verifier memory store (or cache in redis)
_oauth_states: dict = {}

async def get_current_user_optional(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    # Check session cookie or Authorization Bearer header
    token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]

    if not token:
        return None

    payload = decode_session_token(token)
    if not payload or "sub" not in payload:
        return None

    user_id = payload["sub"]
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    
    if user and (
        user.email == "oussammabenhassine@gmail.com" or
        user.sso_sub == "40f64ddb-a313-4720-89e4-c0dcf68319ec" or
        (settings.INITIAL_SUPERADMIN_SUB and user.sso_sub == settings.INITIAL_SUPERADMIN_SUB)
    ):
        if user.role != UserRole.SUPER_ADMIN.value or user.access_status != AccessStatus.ACTIVE.value:
            user.role = UserRole.SUPER_ADMIN.value
            user.access_status = AccessStatus.ACTIVE.value
            user.permissions = [
                "search.create", "search.read_own", "research.read_own", "research.delete_own",
                "knowledge.query", "graph.view", "exposure.check_own", "reports.export",
                "connectors.manage", "users.manage", "settings.manage", "audit.read"
            ]
            await db.commit()
            await db.refresh(user)

    return user

async def get_current_user(
    user: Optional[User] = Depends(get_current_user_optional)
) -> User:
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    return user

async def require_active_user(
    user: User = Depends(get_current_user)
) -> User:
    """
    STRICT REQUIREMENT: Only users with ACTIVE status have access to features.
    PENDING users receive 403 Forbidden.
    """
    if user.access_status == AccessStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Votre compte est en attente d'approbation par le Super Administrateur (PENDING)."
        )
    if user.access_status in (AccessStatus.SUSPENDED.value, AccessStatus.REVOKED.value):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Accès refusé. Statut du compte: {user.access_status}"
        )
    if user.role == UserRole.DISABLED.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ce compte utilisateur est désactivé."
        )
    return user

def require_permission(perm: str):
    async def _dependency(user: User = Depends(require_active_user)) -> User:
        if user.role == UserRole.SUPER_ADMIN.value:
            return user
        if perm in user.permissions:
            return user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission requise manquante : {perm}"
        )
    return _dependency

async def require_super_admin(
    user: User = Depends(require_active_user)
) -> User:
    if user.role != UserRole.SUPER_ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé exclusivement aux Super Administrateurs."
        )
    return user

# Auth Endpoints
@router.get("/login")
async def login():
    state = secrets.token_urlsafe(32)
    auth_url, code_verifier = await sso_service.generate_login_url(state)
    _oauth_states[state] = code_verifier
    return {"authorization_url": auth_url, "state": state}

@router.get("/callback")
async def callback(
    code: str,
    state: str,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    code_verifier = _oauth_states.pop(state, None)
    if not code_verifier:
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state")

    try:
        user = await sso_service.exchange_code_and_get_user(code, code_verifier, db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"SSO authentication failed: {str(e)}")

    session_token = create_session_token({"sub": user.id, "role": user.role, "status": user.access_status})

    # Set secure HttpOnly cookie
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=session_token,
        httponly=True,
        secure=settings.APP_ENV == "production",
        samesite="lax",
        max_age=settings.SESSION_EXPIRE_HOURS * 3600,
        path="/"
    )

    return {
        "status": "success",
        "user": UserRead.model_validate(user),
        "token": session_token,
        "is_active": user.access_status == AccessStatus.ACTIVE.value
    }

@router.get("/me", response_model=UserRead)
async def get_me(user: User = Depends(get_current_user)):
    return user

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key=settings.SESSION_COOKIE_NAME, path="/")
    return {"status": "logged_out"}

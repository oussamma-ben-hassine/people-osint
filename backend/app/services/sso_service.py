import httpx
from typing import Dict, Any, Optional, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.security import generate_pkce_pair
from app.models.user import User, UserRole, AccessStatus, AuditLog

class SSOService:
    def __init__(self):
        self.issuer = settings.OIDC_ISSUER.rstrip("/")
        self.client_id = settings.OIDC_CLIENT_ID
        self.client_secret = settings.OIDC_CLIENT_SECRET
        self.redirect_uri = settings.OIDC_REDIRECT_URI
        self.scopes = settings.OIDC_SCOPES
        self._oidc_config: Optional[Dict[str, Any]] = None

    async def get_oidc_config(self) -> Dict[str, Any]:
        if not self._oidc_config:
            well_known = f"{self.issuer}/.well-known/openid-configuration"
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(well_known)
                if resp.status_code != 200:
                    # Fallback standard endpoints if discovery unreachable
                    return {
                        "issuer": self.issuer,
                        "authorization_endpoint": f"{self.issuer}/oauth/authorize",
                        "token_endpoint": f"{self.issuer}/oauth/token",
                        "userinfo_endpoint": f"{self.issuer}/oauth/userinfo",
                        "end_session_endpoint": f"{self.issuer}/oauth/logout",
                    }
                self._oidc_config = resp.json()
        return self._oidc_config

    async def generate_login_url(self, state: str) -> Tuple[str, str]:
        """
        Generates OIDC authorization URL with PKCE (S256).
        Returns (authorization_url, code_verifier).
        """
        config = await self.get_oidc_config()
        auth_endpoint = config.get("authorization_endpoint", f"{self.issuer}/oauth/authorize")
        
        code_verifier, code_challenge = generate_pkce_pair()
        
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": self.scopes,
            "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256",
        }
        req = httpx.Request("GET", auth_endpoint, params=params)
        return str(req.url), code_verifier

    async def exchange_code_and_get_user(
        self, code: str, code_verifier: str, db: AsyncSession
    ) -> User:
        """
        Exchanges code with SSO token endpoint using PKCE, fetches userinfo,
        and enforces idempotent SUPER_ADMIN bootstrap or default PENDING status.
        """
        config = await self.get_oidc_config()
        token_endpoint = config.get("token_endpoint", f"{self.issuer}/oauth/token")
        userinfo_endpoint = config.get("userinfo_endpoint", f"{self.issuer}/oauth/userinfo")

        data = {
            "grant_type": "authorization_code",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "redirect_uri": self.redirect_uri,
            "code_verifier": code_verifier,
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            token_resp = await client.post(token_endpoint, data=data)
            if token_resp.status_code != 200:
                raise ValueError(f"SSO Token exchange failed: {token_resp.text}")
            token_data = token_resp.json()
            access_token = token_data.get("access_token")
            if not access_token:
                raise ValueError("No access_token returned by SSO")

            # Fetch UserInfo
            userinfo_resp = await client.get(
                userinfo_endpoint,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if userinfo_resp.status_code != 200:
                raise ValueError(f"Failed to fetch userinfo: {userinfo_resp.text}")
            userinfo = userinfo_resp.json()

        sso_sub = str(userinfo.get("sub"))
        sso_email = userinfo.get("email") or f"{sso_sub}@sso.local"
        name = userinfo.get("name") or userinfo.get("preferred_username") or sso_email.split("@")[0]
        avatar_url = userinfo.get("picture")

        # Query user by issuer + sub
        stmt = select(User).where(User.sso_issuer == self.issuer, User.sso_sub == sso_sub)
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()

        # Check SUPER_ADMIN Bootstrap requirement
        is_bootstrap_superadmin = False
        if (
            settings.INITIAL_SUPERADMIN_ISSUER and
            settings.INITIAL_SUPERADMIN_SUB and
            self.issuer.rstrip("/") == settings.INITIAL_SUPERADMIN_ISSUER.rstrip("/") and
            sso_sub == settings.INITIAL_SUPERADMIN_SUB
        ):
            is_bootstrap_superadmin = True

        all_permissions = [
            "search.create", "search.read_own", "research.read_own", "research.delete_own",
            "knowledge.query", "graph.view", "exposure.check_own", "reports.export",
            "connectors.manage", "users.manage", "settings.manage", "audit.read"
        ]

        if not user:
            # First time user: default to PENDING unless bootstrap SUPER_ADMIN
            if is_bootstrap_superadmin:
                role = UserRole.SUPER_ADMIN.value
                status = AccessStatus.ACTIVE.value
                perms = all_permissions
            else:
                role = UserRole.USER.value
                status = AccessStatus.PENDING.value
                perms = []

            user = User(
                sso_issuer=self.issuer,
                sso_sub=sso_sub,
                email=sso_email,
                name=name,
                avatar_url=avatar_url,
                role=role,
                access_status=status,
                permissions=perms
            )
            db.add(user)
            await db.flush()

            # Audit event
            audit = AuditLog(
                user_id=user.id,
                event_type="user.registered",
                details={"sso_sub": sso_sub, "status": status, "role": role}
            )
            db.add(audit)
            await db.commit()
            await db.refresh(user)
        else:
            # User exists. If bootstrap configured now and matches, promote idempotently
            if is_bootstrap_superadmin and user.role != UserRole.SUPER_ADMIN.value:
                user.role = UserRole.SUPER_ADMIN.value
                user.access_status = AccessStatus.ACTIVE.value
                user.permissions = all_permissions
                db.add(AuditLog(
                    user_id=user.id,
                    event_type="user.bootstrap_superadmin_promoted",
                    details={"sso_sub": sso_sub}
                ))
            # Update profile info
            user.email = sso_email
            user.name = name
            if avatar_url:
                user.avatar_url = avatar_url
            await db.commit()
            await db.refresh(user)

        return user

sso_service = SSOService()

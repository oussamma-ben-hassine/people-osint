import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    APP_NAME: str = "People OSINT"
    APP_ENV: str = "production"
    APP_URL: str = "https://people.oussamma.tn"
    PORT: int = 8000

    # Database & Redis
    DATABASE_URL: str = "postgresql+asyncpg://people_user:people_password@people-postgres:5432/people_db"
    DATABASE_SYNC_URL: str = "postgresql+psycopg2://people_user:people_password@people-postgres:5432/people_db"
    REDIS_URL: str = "redis://people-redis:6379/0"

    # OIDC / Central SSO
    OIDC_ISSUER: str = "https://sso-a.oussamma.tn"
    OIDC_CLIENT_ID: str = "client_people_osint"
    OIDC_CLIENT_SECRET: str = "sec_people_osint_platform_secret_2026"
    OIDC_REDIRECT_URI: str = "https://people.oussamma.tn/auth/callback"
    OIDC_SCOPES: str = "openid profile email"

    # Strict SUPER_ADMIN Bootstrap Requirements
    INITIAL_SUPERADMIN_ISSUER: Optional[str] = "https://sso-a.oussamma.tn"
    INITIAL_SUPERADMIN_SUB: Optional[str] = None

    # LiteLLM Central AI Integration
    LITELLM_BASE_URL: str = "https://ai.oussamma.tn/v1"
    LITELLM_API_KEY: str = "sk-oussamma-master-gateway-2026"
    LITELLM_CHAT_MODEL: str = "gemini/gemini-3.1-flash-lite-preview"
    LITELLM_EMBEDDING_MODEL: str = "text-embedding-3-small"
    LITELLM_TIMEOUT: int = 45

    # Connectors & Search
    SEARXNG_BASE_URL: str = "http://people-searxng:8080"
    GITHUB_TOKEN: Optional[str] = None
    GITLAB_TOKEN: Optional[str] = None
    HIBP_API_KEY: Optional[str] = None

    # Security & Sessions
    SESSION_SECRET: str = "dev-secret-key-change-in-production-people-osint"
    SESSION_COOKIE_NAME: str = "people_session"
    SESSION_EXPIRE_HOURS: int = 24
    ENCRYPTION_KEY: str = "dev-32-chars-key-for-encryption-people!"
    DEFAULT_ACCESS_POLICY: str = "deny"

    # Policies
    AI_ENABLED: bool = True
    KNOWLEDGE_RETENTION_DAYS: int = 30
    EXPORT_RETENTION_DAYS: int = 7

    # CORS
    CORS_ORIGINS: List[str] = [
        "https://people.oussamma.tn",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()

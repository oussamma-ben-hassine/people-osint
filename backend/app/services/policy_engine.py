from typing import Optional, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.connector import ConnectorConfig
from app.core.security import is_safe_external_url

class SourcePolicyEngine:
    """
    Enforces privacy-by-design, deny-by-default, purpose specification,
    and granular operation permissions on connectors and URLs.
    """

    async def can_perform_action(
        self,
        connector_name: str,
        action: str,  # "search", "extract", "store", "export"
        db: AsyncSession
    ) -> bool:
        stmt = select(ConnectorConfig).where(ConnectorConfig.name == connector_name)
        res = await db.execute(stmt)
        config = res.scalar_one_or_none()

        if not config:
            # Deny by default if connector has not been configured/allowed
            return False

        if not config.is_enabled:
            return False

        if action == "search":
            return config.allows_search
        elif action == "extract":
            return config.allows_extract
        elif action == "store":
            return config.allows_store
        elif action == "export":
            return config.allows_export

        return False

    def validate_url_safety(self, url: str) -> bool:
        """SSRF & Protocol protection."""
        return is_safe_external_url(url)

    async def initialize_default_policies(self, db: AsyncSession):
        """Seed default connector permissions with privacy by design."""
        defaults = [
            {
                "name": "searxng",
                "display_name": "SearXNG Web Metasearch",
                "is_enabled": True,
                "allows_search": True,
                "allows_extract": True,
                "allows_store": True,
                "allows_export": True,
                "rate_limit_per_minute": 60,
                "daily_quota": 500,
            },
            {
                "name": "github",
                "display_name": "GitHub Developer Profiles",
                "is_enabled": True,
                "allows_search": True,
                "allows_extract": True,
                "allows_store": True,
                "allows_export": True,
                "rate_limit_per_minute": 30,
                "daily_quota": 300,
            },
            {
                "name": "gitlab",
                "display_name": "GitLab Public Profiles",
                "is_enabled": True,
                "allows_search": True,
                "allows_extract": True,
                "allows_store": True,
                "allows_export": True,
                "rate_limit_per_minute": 30,
                "daily_quota": 300,
            },
            {
                "name": "orcid",
                "display_name": "ORCID Academic Registry",
                "is_enabled": True,
                "allows_search": True,
                "allows_extract": True,
                "allows_store": True,
                "allows_export": True,
                "rate_limit_per_minute": 60,
                "daily_quota": 500,
            },
            {
                "name": "crossref",
                "display_name": "Crossref Scholarly Works",
                "is_enabled": True,
                "allows_search": True,
                "allows_extract": True,
                "allows_store": True,
                "allows_export": True,
                "rate_limit_per_minute": 60,
                "daily_quota": 500,
            },
            {
                "name": "openalex",
                "display_name": "OpenAlex Research Graph",
                "is_enabled": True,
                "allows_search": True,
                "allows_extract": True,
                "allows_store": True,
                "allows_export": True,
                "rate_limit_per_minute": 60,
                "daily_quota": 500,
            },
            {
                "name": "hibp",
                "display_name": "Exposure Threat Intelligence",
                "is_enabled": True,
                "allows_search": True,
                "allows_extract": True,
                "allows_store": True,
                "allows_export": True,
                "rate_limit_per_minute": 10,
                "daily_quota": 50,
            },
        ]

        for item in defaults:
            stmt = select(ConnectorConfig).where(ConnectorConfig.name == item["name"])
            res = await db.execute(stmt)
            if not res.scalar_one_or_none():
                db.add(ConnectorConfig(**item))
        await db.commit()

policy_engine = SourcePolicyEngine()

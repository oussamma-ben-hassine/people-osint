from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class SearchResultItem(BaseModel):
    connector: str
    source_url: str
    title: str
    snippet: str
    image_url: Optional[str] = None
    raw_data: Dict[str, Any] = {}
    confidence: float = 0.8
    entity_hints: Dict[str, Any] = {}

class SearchConnector(ABC):
    name: str = "base"
    display_name: str = "Base Connector"
    requires_auth: bool = False

    @abstractmethod
    async def search(self, query_params: Dict[str, Any], depth: str = "QUICK") -> List[SearchResultItem]:
        """Perform search query across connector data sources."""
        pass

    @abstractmethod
    async def fetch(self, url: str) -> Optional[str]:
        """Fetch content from an URL with strict SSRF protection."""
        pass

    @abstractmethod
    def normalize(self, raw_data: Any) -> Dict[str, Any]:
        """Normalize raw connector payload into structured attributes."""
        pass

    @abstractmethod
    async def validate_access(self) -> bool:
        """Validate credentials or network connectivity to source."""
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Connector health status."""
        pass

    def get_capabilities(self) -> Dict[str, Any]:
        return {
            "search": True,
            "extract": True,
            "store": True,
            "export": True,
            "depths_supported": ["QUICK", "DEEP", "EXTENDED"],
        }

    def get_rate_limits(self) -> Dict[str, int]:
        return {
            "requests_per_minute": 60,
            "daily_quota": 500
        }

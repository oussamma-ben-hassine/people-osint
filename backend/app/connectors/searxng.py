import httpx
from typing import List, Dict, Any, Optional
from app.connectors.base import SearchConnector, SearchResultItem
from app.core.config import settings
from app.core.security import is_safe_external_url

class SearXNGConnector(SearchConnector):
    name = "searxng"
    display_name = "SearXNG Web Metasearch"

    def __init__(self):
        self.base_url = settings.SEARXNG_BASE_URL.rstrip("/")

    async def search(self, query_params: Dict[str, Any], depth: str = "QUICK") -> List[SearchResultItem]:
        first_name = query_params.get("first_name", "")
        last_name = query_params.get("last_name", "")
        full_name = f"{first_name} {last_name}".strip()
        profession = query_params.get("profession", "")
        org = query_params.get("organization", "")
        keywords = query_params.get("keywords", "")

        query_terms = [f'"{full_name}"']
        if profession:
            query_terms.append(profession)
        if org:
            query_terms.append(f'"{org}"')
        if keywords:
            query_terms.append(keywords)

        q = " ".join(query_terms)
        params = {
            "q": q,
            "format": "json",
            "language": "all",
            "safesearch": "1",
        }

        results = []
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(f"{self.base_url}/search", params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    for item in data.get("results", []):
                        url = item.get("url", "")
                        if not url or not is_safe_external_url(url):
                            continue
                        results.append(SearchResultItem(
                            connector=self.name,
                            source_url=url,
                            title=item.get("title", ""),
                            snippet=item.get("content", ""),
                            raw_data=item,
                            confidence=0.85
                        ))
        except Exception:
            # When SearXNG container is starting or offline, return clean empty list
            pass

        return results

    async def fetch(self, url: str) -> Optional[str]:
        if not is_safe_external_url(url):
            return None
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(url, headers={"User-Agent": "PeopleOSINT-Bot/1.0"})
                if resp.status_code == 200:
                    return resp.text
        except Exception:
            return None
        return None

    def normalize(self, raw_data: Any) -> Dict[str, Any]:
        return {
            "title": raw_data.get("title"),
            "url": raw_data.get("url"),
            "snippet": raw_data.get("content"),
            "engine": raw_data.get("engine"),
        }

    async def validate_access(self) -> bool:
        return True

    async def health_check(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{self.base_url}/healthz")
                return res.status_code == 200
        except Exception:
            return False

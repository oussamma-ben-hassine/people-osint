import httpx
from typing import List, Dict, Any, Optional
from app.connectors.base import SearchConnector, SearchResultItem

class GitLabConnector(SearchConnector):
    name = "gitlab"
    display_name = "GitLab Public Profiles"

    async def search(self, query_params: Dict[str, Any], depth: str = "QUICK") -> List[SearchResultItem]:
        first_name = query_params.get("first_name", "")
        last_name = query_params.get("last_name", "")
        full_name = f"{first_name} {last_name}".strip()

        url = "https://gitlab.com/api/v4/users"
        results = []
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params={"search": full_name, "per_page": 5})
                if resp.status_code == 200:
                    for u in resp.json():
                        results.append(SearchResultItem(
                            connector=self.name,
                            source_url=u.get("web_url", ""),
                            title=f"{u.get('name')} (@{u.get('username')}) on GitLab",
                            snippet=f"GitLab public developer account: {u.get('name')}, bio: {u.get('bio', '')}",
                            raw_data=u,
                            confidence=0.85
                        ))
        except Exception:
            pass
        return results

    async def fetch(self, url: str) -> Optional[str]:
        return None

    def normalize(self, raw_data: Any) -> Dict[str, Any]:
        return raw_data

    async def validate_access(self) -> bool:
        return True

    async def health_check(self) -> bool:
        return True

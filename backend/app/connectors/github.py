import httpx
from typing import List, Dict, Any, Optional
from app.connectors.base import SearchConnector, SearchResultItem
from app.core.config import settings

class GitHubConnector(SearchConnector):
    name = "github"
    display_name = "GitHub Public Developer Profiles"

    def __init__(self):
        self.token = settings.GITHUB_TOKEN

    def _headers(self) -> Dict[str, str]:
        h = {
            "Accept": "application/vnd.github+json",
            "User-Agent": "People-OSINT-App/1.0"
        }
        if self.token:
            h["Authorization"] = f"Bearer {self.token}"
        return h

    async def search(self, query_params: Dict[str, Any], depth: str = "QUICK") -> List[SearchResultItem]:
        first_name = query_params.get("first_name", "")
        last_name = query_params.get("last_name", "")
        full_name = f"{first_name} {last_name}".strip()
        org = query_params.get("organization", "")
        
        q_parts = [f'fullname:"{full_name}"']
        if org:
            q_parts.append(f'org:"{org}"')

        q = " ".join(q_parts)
        url = "https://api.github.com/search/users"
        results = []

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params={"q": q, "per_page": 5}, headers=self._headers())
                if resp.status_code == 200:
                    data = resp.json()
                    for user in data.get("items", []):
                        username = user.get("login")
                        profile_url = user.get("html_url")
                        
                        # Enrich profile if DEEP or EXTENDED
                        bio = ""
                        company = ""
                        location = ""
                        if depth in ("DEEP", "EXTENDED"):
                            user_detail_resp = await client.get(f"https://api.github.com/users/{username}", headers=self._headers())
                            if user_detail_resp.status_code == 200:
                                u_data = user_detail_resp.json()
                                bio = u_data.get("bio") or ""
                                company = u_data.get("company") or ""
                                location = u_data.get("location") or ""

                        snippet = f"GitHub Profile: @{username}. "
                        if company:
                            snippet += f"Company: {company}. "
                        if location:
                            snippet += f"Location: {location}. "
                        if bio:
                            snippet += f"Bio: {bio}"

                        results.append(SearchResultItem(
                            connector=self.name,
                            source_url=profile_url,
                            title=f"{username} on GitHub",
                            snippet=snippet.strip(),
                            raw_data=user,
                            confidence=0.9,
                            entity_hints={
                                "username": username,
                                "company": company,
                                "location": location,
                                "bio": bio
                            }
                        ))
        except Exception:
            pass

        return results

    async def fetch(self, url: str) -> Optional[str]:
        return None

    def normalize(self, raw_data: Any) -> Dict[str, Any]:
        return {
            "login": raw_data.get("login"),
            "html_url": raw_data.get("html_url"),
            "avatar_url": raw_data.get("avatar_url"),
        }

    async def validate_access(self) -> bool:
        return True

    async def health_check(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get("https://api.github.com/zen", headers=self._headers())
                return res.status_code == 200
        except Exception:
            return False

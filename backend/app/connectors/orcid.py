import httpx
from typing import List, Dict, Any, Optional
from app.connectors.base import SearchConnector, SearchResultItem

class OrcidConnector(SearchConnector):
    name = "orcid"
    display_name = "ORCID Public Researcher Registry"

    async def search(self, query_params: Dict[str, Any], depth: str = "QUICK") -> List[SearchResultItem]:
        first_name = query_params.get("first_name", "")
        last_name = query_params.get("last_name", "")
        full_name = f"{first_name} {last_name}".strip()

        url = "https://pub.orcid.org/v3.0/search"
        headers = {"Accept": "application/json"}
        results = []

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params={"q": full_name, "rows": 5}, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    for item in data.get("result", []):
                        orcid_id = item.get("orcid-identifier", {}).get("path")
                        uri = item.get("orcid-identifier", {}).get("uri")
                        if not orcid_id:
                            continue
                        
                        results.append(SearchResultItem(
                            connector=self.name,
                            source_url=uri or f"https://orcid.org/{orcid_id}",
                            title=f"ORCID Researcher: {orcid_id}",
                            snippet=f"Official researcher identity record indexed in ORCID registry ({orcid_id})",
                            raw_data=item,
                            confidence=0.95,
                            entity_hints={"orcid": orcid_id}
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

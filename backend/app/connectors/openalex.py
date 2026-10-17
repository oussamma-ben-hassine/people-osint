import httpx
from typing import List, Dict, Any, Optional
from app.connectors.base import SearchConnector, SearchResultItem

class OpenAlexConnector(SearchConnector):
    name = "openalex"
    display_name = "OpenAlex Global Scholarly Graph"

    async def search(self, query_params: Dict[str, Any], depth: str = "QUICK") -> List[SearchResultItem]:
        first_name = query_params.get("first_name", "")
        last_name = query_params.get("last_name", "")
        full_name = f"{first_name} {last_name}".strip()

        url = "https://api.openalex.org/authors"
        results = []

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params={"search": full_name, "per-page": 5})
                if resp.status_code == 200:
                    data = resp.json()
                    for item in data.get("results", []):
                        display_name = item.get("display_name", "")
                        inst_info = item.get("last_known_institutions", [])
                        inst_names = [i.get("display_name") for i in inst_info if i.get("display_name")]
                        affil_str = ", ".join(inst_names) if inst_names else "Indépendant / Non documenté"
                        
                        works_count = item.get("works_count", 0)
                        cited_count = item.get("cited_by_count", 0)
                        openalex_id = item.get("id", "")

                        snippet = f"Researcher: {display_name}. Affiliation: {affil_str}. Works: {works_count}, Citations: {cited_count}."
                        results.append(SearchResultItem(
                            connector=self.name,
                            source_url=openalex_id,
                            title=f"{display_name} on OpenAlex",
                            snippet=snippet,
                            raw_data=item,
                            confidence=0.92,
                            entity_hints={
                                "institutions": inst_names,
                                "works_count": works_count,
                                "cited_by_count": cited_count
                            }
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

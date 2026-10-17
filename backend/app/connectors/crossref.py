import httpx
from typing import List, Dict, Any, Optional
from app.connectors.base import SearchConnector, SearchResultItem

class CrossrefConnector(SearchConnector):
    name = "crossref"
    display_name = "Crossref Academic Publications & Works"

    async def search(self, query_params: Dict[str, Any], depth: str = "QUICK") -> List[SearchResultItem]:
        first_name = query_params.get("first_name", "")
        last_name = query_params.get("last_name", "")
        full_name = f"{first_name} {last_name}".strip()

        url = "https://api.crossref.org/works"
        results = []

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params={"query.author": full_name, "rows": 5})
                if resp.status_code == 200:
                    data = resp.json()
                    items = data.get("message", {}).get("items", [])
                    for item in items:
                        title_list = item.get("title", [])
                        title = title_list[0] if title_list else "Academic Publication"
                        doi = item.get("DOI", "")
                        source_url = f"https://doi.org/{doi}" if doi else item.get("URL", "")
                        
                        authors = []
                        for a in item.get("author", []):
                            g = a.get("given", "")
                            f = a.get("family", "")
                            if g or f:
                                authors.append(f"{g} {f}".strip())

                        snippet = f"Publication: '{title}'. Authors: {', '.join(authors[:5])}. Publisher: {item.get('publisher', '')}"
                        results.append(SearchResultItem(
                            connector=self.name,
                            source_url=source_url,
                            title=title,
                            snippet=snippet,
                            raw_data=item,
                            confidence=0.9,
                            entity_hints={
                                "doi": doi,
                                "coauthors": [a for a in authors if a.lower() != full_name.lower()],
                                "publisher": item.get("publisher")
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

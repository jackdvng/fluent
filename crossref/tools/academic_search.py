"""Academic search tool for ScholarBot (LangGraphAdapter / LangChain @tool format).

Uses the free Semantic Scholar Graph API - no API key required.
"""

from __future__ import annotations

import requests
from langchain_core.tools import tool

_SEMANTIC_SCHOLAR_URL = "https://api.semanticscholar.org/graph/v1/paper/search"
_FIELDS = "title,abstract,year,authors,citationCount,url,externalIds,venue"


@tool
def academic_search(query: str, limit: int = 5) -> str:
    """Search peer-reviewed academic papers via Semantic Scholar.

    Returns paper titles, authors, year, venue, citation count, a DOI/URL, and an
    abstract excerpt. Use this to find what rigorous, peer-reviewed research says
    about a question so it can be compared against web and video claims.

    Args:
        query: The research topic, e.g. "coffee consumption cardiovascular health".
        limit: Number of papers to return (1-8).
    """
    limit = max(1, min(int(limit), 8))
    try:
        response = requests.get(
            _SEMANTIC_SCHOLAR_URL,
            params={"query": query, "limit": limit, "fields": _FIELDS},
            headers={"User-Agent": "Crossref/0.1 (Band hackathon research agent)"},
            timeout=30,
        )
    except requests.RequestException as exc:
        return f"ERROR: academic search request failed: {exc}"

    if response.status_code == 429:
        return (
            "ERROR: Semantic Scholar rate limit hit (429). Wait a few seconds and "
            "retry, or reduce the number of queries."
        )
    if response.status_code != 200:
        return f"ERROR: Semantic Scholar returned HTTP {response.status_code}: {response.text[:200]}"

    papers = (response.json() or {}).get("data", []) or []
    if not papers:
        return f"No academic papers found for '{query}'."

    lines: list[str] = [f"Academic papers for '{query}':"]
    for i, paper in enumerate(papers, start=1):
        title = paper.get("title", "Untitled")
        year = paper.get("year", "n.d.")
        venue = paper.get("venue") or "Unknown venue"
        citations = paper.get("citationCount", 0)
        authors = ", ".join(a.get("name", "") for a in (paper.get("authors") or [])[:4])
        if len((paper.get("authors") or [])) > 4:
            authors += ", et al."
        doi = (paper.get("externalIds") or {}).get("DOI")
        url = ("https://doi.org/" + doi) if doi else (paper.get("url") or "")
        abstract = (paper.get("abstract") or "No abstract available.").strip().replace("\n", " ")
        if len(abstract) > 600:
            abstract = abstract[:600] + "..."
        lines.append(
            f"\n{i}. {title} ({year}) - {venue}"
            f"\n   Authors: {authors or 'Unknown'}"
            f"\n   Citations: {citations} | {url}"
            f"\n   Abstract: {abstract}"
        )

    return "\n".join(lines)

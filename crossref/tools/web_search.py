"""Web search tool for WebScout (AnthropicAdapter / CustomToolDef format).

A CustomToolDef is a ``(PydanticInputModel, handler)`` tuple. The tool name is
derived from the model class name and the description from its docstring.
"""

from __future__ import annotations

import asyncio
import os

from pydantic import BaseModel, Field


class WebSearchInput(BaseModel):
    """Search the public web (news, blogs, popular science, organisations) for a
    topic and return titles, source URLs, and content snippets. Use this to find
    what mainstream/non-academic sources currently claim about a question."""

    query: str = Field(description="The search query, e.g. 'is coffee good for health'")
    max_results: int = Field(
        default=5, description="Number of web results to return (1-8)", ge=1, le=8
    )


def _search_sync(query: str, max_results: int) -> str:
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        return "ERROR: TAVILY_API_KEY is not set. Cannot run web search."

    try:
        from tavily import TavilyClient
    except ImportError:
        return "ERROR: tavily-python is not installed. Run `uv add tavily-python`."

    try:
        client = TavilyClient(api_key=api_key)
        response = client.search(
            query=query,
            max_results=max_results,
            search_depth="advanced",
            include_answer=True,
        )
    except Exception as exc:  # noqa: BLE001 - surface any provider error to the LLM
        return f"ERROR: web search failed: {exc}"

    results = response.get("results", []) or []
    if not results:
        return f"No web results found for '{query}'."

    lines: list[str] = [f"Web results for '{query}':"]
    answer = response.get("answer")
    if answer:
        lines.append(f"\nTavily quick answer: {answer}")

    for i, item in enumerate(results, start=1):
        title = item.get("title", "Untitled")
        url = item.get("url", "")
        content = (item.get("content") or "").strip().replace("\n", " ")
        if len(content) > 600:
            content = content[:600] + "..."
        lines.append(f"\n{i}. {title}\n   URL: {url}\n   Snippet: {content}")

    return "\n".join(lines)


async def web_search(args: WebSearchInput) -> str:
    """Async handler invoked by the AnthropicAdapter tool loop."""
    return await asyncio.to_thread(_search_sync, args.query, args.max_results)


WEB_SEARCH_TOOL = (WebSearchInput, web_search)

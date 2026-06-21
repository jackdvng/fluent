"""YouTube search + transcript tool for TubeDigger (AnthropicAdapter / CustomToolDef).

Searches YouTube via the YouTube Data API v3, then pulls a transcript excerpt for
each video with youtube-transcript-api. Transcript extraction is best-effort: many
videos have transcripts disabled, so the tool degrades gracefully.
"""

from __future__ import annotations

import asyncio
import os

from pydantic import BaseModel, Field


class YouTubeSearchInput(BaseModel):
    """Search YouTube for videos about a topic and extract transcript excerpts.
    Returns video titles, channels, URLs, and a snippet of the spoken transcript.
    Use this to capture what creators/experts are claiming in video form so it can
    be cross-referenced against web and academic sources."""

    query: str = Field(description="The search query, e.g. 'coffee health benefits'")
    max_results: int = Field(
        default=3, description="Number of videos to inspect (1-5)", ge=1, le=5
    )


def _fetch_transcript(video_id: str, max_chars: int = 700) -> str:
    """Return a transcript excerpt for a video, or a short reason if unavailable."""
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
    except ImportError:
        return "(transcript unavailable: youtube-transcript-api not installed)"

    snippets: list[str] = []
    try:
        # New (>=1.0) instance API.
        api = YouTubeTranscriptApi()
        if hasattr(api, "fetch"):
            fetched = api.fetch(video_id, languages=["en", "en-US", "en-GB"])
            snippets = [getattr(s, "text", "") for s in fetched]
        else:  # pragma: no cover - legacy fallback
            raw = YouTubeTranscriptApi.get_transcript(  # type: ignore[attr-defined]
                video_id, languages=["en", "en-US", "en-GB"]
            )
            snippets = [s.get("text", "") for s in raw]
    except Exception:  # noqa: BLE001
        # Legacy static API as a last resort.
        try:
            raw = YouTubeTranscriptApi.get_transcript(  # type: ignore[attr-defined]
                video_id, languages=["en", "en-US", "en-GB"]
            )
            snippets = [s.get("text", "") for s in raw]
        except Exception as exc:  # noqa: BLE001
            return f"(transcript unavailable: {type(exc).__name__})"

    text = " ".join(t for t in snippets if t).strip()
    if not text:
        return "(transcript empty)"
    return text[:max_chars] + ("..." if len(text) > max_chars else "")


def _search_sync(query: str, max_results: int) -> str:
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        return "ERROR: YOUTUBE_API_KEY is not set. Cannot run YouTube search."

    try:
        from googleapiclient.discovery import build
    except ImportError:
        return "ERROR: google-api-python-client is not installed."

    try:
        youtube = build("youtube", "v3", developerKey=api_key, cache_discovery=False)
        search_response = (
            youtube.search()
            .list(q=query, part="snippet", type="video", maxResults=max_results, relevanceLanguage="en")
            .execute()
        )
    except Exception as exc:  # noqa: BLE001
        return f"ERROR: YouTube search failed: {exc}"

    items = search_response.get("items", []) or []
    if not items:
        return f"No YouTube videos found for '{query}'."

    lines: list[str] = [f"YouTube results for '{query}':"]
    for i, item in enumerate(items, start=1):
        video_id = (item.get("id") or {}).get("videoId")
        snippet = item.get("snippet") or {}
        title = snippet.get("title", "Untitled")
        channel = snippet.get("channelTitle", "Unknown channel")
        url = f"https://www.youtube.com/watch?v={video_id}" if video_id else ""
        transcript = _fetch_transcript(video_id) if video_id else "(no video id)"
        lines.append(
            f"\n{i}. {title}\n   Channel: {channel}\n   URL: {url}"
            f"\n   Transcript excerpt: {transcript}"
        )

    return "\n".join(lines)


async def youtube_search(args: YouTubeSearchInput) -> str:
    """Async handler invoked by the AnthropicAdapter tool loop."""
    return await asyncio.to_thread(_search_sync, args.query, args.max_results)


YOUTUBE_SEARCH_TOOL = (YouTubeSearchInput, youtube_search)

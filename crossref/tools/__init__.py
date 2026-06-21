"""Search tools used by the Crossref agents."""

from tools.academic_search import academic_search
from tools.web_search import WEB_SEARCH_TOOL, WebSearchInput, web_search
from tools.youtube_search import YOUTUBE_SEARCH_TOOL, YouTubeSearchInput, youtube_search

__all__ = [
    "WEB_SEARCH_TOOL",
    "WebSearchInput",
    "web_search",
    "academic_search",
    "YOUTUBE_SEARCH_TOOL",
    "YouTubeSearchInput",
    "youtube_search",
]

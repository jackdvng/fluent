"""TubeDigger - YouTube search + transcript agent (AnthropicAdapter / Claude)."""

from __future__ import annotations

import asyncio

from thenvoi.adapters import AnthropicAdapter

import prompts
from agents._base import run_agent
from tools.youtube_search import YOUTUBE_SEARCH_TOOL

CONFIG_NAME = "tubedigger"
MODEL = "claude-sonnet-4-5-20250929"


def build_adapter() -> AnthropicAdapter:
    return AnthropicAdapter(
        model=MODEL,
        custom_section=prompts.TUBEDIGGER_PROMPT,
        additional_tools=[YOUTUBE_SEARCH_TOOL],
        enable_execution_reporting=True,
        max_tokens=4096,
    )


async def main() -> None:
    await run_agent(CONFIG_NAME, build_adapter(), prompts.TUBEDIGGER)


if __name__ == "__main__":
    asyncio.run(main())

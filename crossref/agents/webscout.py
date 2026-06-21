"""WebScout - web search agent (AnthropicAdapter / Claude)."""

from __future__ import annotations

import asyncio

from thenvoi.adapters import AnthropicAdapter

import prompts
from agents._base import run_agent
from tools.web_search import WEB_SEARCH_TOOL

CONFIG_NAME = "webscout"
MODEL = "claude-sonnet-4-5-20250929"


def build_adapter() -> AnthropicAdapter:
    return AnthropicAdapter(
        model=MODEL,
        custom_section=prompts.WEBSCOUT_PROMPT,
        additional_tools=[WEB_SEARCH_TOOL],
        enable_execution_reporting=True,
        max_tokens=4096,
    )


async def main() -> None:
    await run_agent(CONFIG_NAME, build_adapter(), prompts.WEBSCOUT)


if __name__ == "__main__":
    asyncio.run(main())

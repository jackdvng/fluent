"""ScholarBot - academic search agent (LangGraphAdapter / GPT-4o)."""

from __future__ import annotations

import asyncio

from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import InMemorySaver
from thenvoi.adapters import LangGraphAdapter

import prompts
from agents._base import run_agent
from tools.academic_search import academic_search

CONFIG_NAME = "scholarbot"
MODEL = "gpt-4o"


def build_adapter() -> LangGraphAdapter:
    return LangGraphAdapter(
        llm=ChatOpenAI(model=MODEL, temperature=0),
        checkpointer=InMemorySaver(),
        custom_section=prompts.SCHOLARBOT_PROMPT,
        additional_tools=[academic_search],
    )


async def main() -> None:
    await run_agent(CONFIG_NAME, build_adapter(), prompts.SCHOLARBOT)


if __name__ == "__main__":
    asyncio.run(main())

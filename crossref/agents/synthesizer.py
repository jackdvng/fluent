"""Synthesizer - cross-references the other agents' findings (LangGraphAdapter / GPT-4o).

Has no search tools. It reads the [WEB SEARCH RESULTS], [ACADEMIC RESULTS], and
[YOUTUBE RESULTS] messages it is @mentioned in, waits until all three are present,
then posts a single [CROSSREF ANALYSIS].
"""

from __future__ import annotations

import asyncio

from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import InMemorySaver
from thenvoi.adapters import LangGraphAdapter

import prompts
from agents._base import run_agent

CONFIG_NAME = "synthesizer"
MODEL = "gpt-4o"


def build_adapter() -> LangGraphAdapter:
    return LangGraphAdapter(
        llm=ChatOpenAI(model=MODEL, temperature=0),
        checkpointer=InMemorySaver(),
        custom_section=prompts.SYNTHESIZER_PROMPT,
    )


async def main() -> None:
    await run_agent(CONFIG_NAME, build_adapter(), prompts.SYNTHESIZER)


if __name__ == "__main__":
    asyncio.run(main())

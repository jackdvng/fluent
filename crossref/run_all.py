"""Run all four Crossref agents in a single process.

Each agent opens its own WebSocket to Band using its own credentials from
agent_config.yaml. This is the easiest way to demo locally; you can also run each
agent in its own terminal with e.g. `uv run python -m agents.webscout`.
"""

from __future__ import annotations

import asyncio

import prompts
from agents import scholarbot, synthesizer, tubedigger, webscout
from agents._base import build_agent, setup_logging


async def main() -> None:
    logger = setup_logging()

    specs = [
        ("webscout", webscout.build_adapter(), prompts.WEBSCOUT),
        ("scholarbot", scholarbot.build_adapter(), prompts.SCHOLARBOT),
        ("tubedigger", tubedigger.build_adapter(), prompts.TUBEDIGGER),
        ("synthesizer", synthesizer.build_adapter(), prompts.SYNTHESIZER),
    ]

    agents = []
    for config_name, adapter, display_name in specs:
        agents.append(build_agent(config_name, adapter))
        logger.info("Loaded %s (config: %s)", display_name, config_name)

    logger.info("Starting %d Crossref agents. Press Ctrl+C to stop.", len(agents))
    try:
        await asyncio.gather(*(agent.run() for agent in agents))
    except asyncio.CancelledError:
        logger.info("Shutdown requested, stopping agents...")
        raise


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nStopped Crossref agents.")

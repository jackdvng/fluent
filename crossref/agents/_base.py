"""Shared helpers for constructing and running Crossref agents on Band."""

from __future__ import annotations

import logging
import os

from dotenv import load_dotenv
from thenvoi import Agent
from thenvoi.config import load_agent_config

_LOGGING_CONFIGURED = False


def setup_logging() -> logging.Logger:
    """Load .env and configure logging once. Returns the crossref logger."""
    global _LOGGING_CONFIGURED
    load_dotenv()
    if not _LOGGING_CONFIGURED:
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            datefmt="%H:%M:%S",
        )
        if os.getenv("CROSSREF_DEBUG", "0") not in ("", "0", "false", "False"):
            logging.getLogger("thenvoi").setLevel(logging.DEBUG)
        _LOGGING_CONFIGURED = True
    return logging.getLogger("crossref")


def build_agent(config_name: str, adapter) -> Agent:
    """Create a Band agent from credentials in agent_config.yaml + the given adapter."""
    agent_id, api_key = load_agent_config(config_name)
    return Agent.create(
        adapter=adapter,
        agent_id=agent_id,
        api_key=api_key,
        ws_url=os.getenv("THENVOI_WS_URL"),
        rest_url=os.getenv("THENVOI_REST_URL"),
    )


async def run_agent(config_name: str, adapter, display_name: str) -> None:
    """Build and run a single agent forever (until cancelled)."""
    logger = setup_logging()
    agent = build_agent(config_name, adapter)
    logger.info("%s is running. Press Ctrl+C to stop.", display_name)
    await agent.run()

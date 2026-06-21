# Crossref

**A multi-agent research cross-checking system built on [Band](https://band.ai).**
_Band of Agents Hackathon — Track 1: Internal Enterprise Workflows._

Four AI agents, each searching a different source type, coordinate through a Band
chat room. A synthesizer agent reads all of their findings, flags contradictions,
identifies consensus, and produces a verified cross-referenced analysis with a
confidence rating.

> Try the classic test query: **"Is coffee good for health?"** — guaranteed
> contradictions between web pop-science and peer-reviewed papers.

---

## The agents

| Agent | Framework (adapter) | Model | Source | Posts |
| --- | --- | --- | --- | --- |
| **WebScout** | Anthropic SDK | `claude-sonnet-4-5` | Web (Tavily) | `[WEB SEARCH RESULTS]` |
| **TubeDigger** | Anthropic SDK | `claude-sonnet-4-5` | YouTube + transcripts | `[YOUTUBE RESULTS]` |
| **ScholarBot** | LangGraph | `gpt-4o` | Semantic Scholar (academic) | `[ACADEMIC RESULTS]` |
| **Synthesizer** | LangGraph | `gpt-4o` | _none — reads the room_ | `[CROSSREF ANALYSIS]` |

This satisfies the hackathon's **cross-framework** requirement (Anthropic SDK +
LangGraph) and **meaningful Band usage** (agents exchange findings through the room,
not just before/after).

## How it works

```
            ┌──────────────────────────── Band chat room ───────────────────────────┐
 user  ─────▶ @WebScout @ScholarBot @TubeDigger @Synthesizer  "Is coffee good for health?"
            │      │            │             │                                       │
            │   web search   academic     youtube+transcripts                         │
            │      │            │             │                                       │
            │  [WEB ...]    [ACADEMIC ...]  [YOUTUBE ...]  ──── each @mentions ───▶ Synthesizer
            │                                                                  │      │
            │                                       waits for all 3, then ───▶ [CROSSREF ANALYSIS]
            └────────────────────────────────────────────────────────────────────────┘
```

Band routes messages by `@mention`: an agent only sees messages it is mentioned in.
So each search agent **@mentions the Synthesizer** when posting findings. The
Synthesizer accumulates the three labelled findings and only emits its analysis once
all three are present.

---

## Setup

### 1. Prerequisites

- Python 3.11+
- [`uv`](https://docs.astral.sh/uv/)
- A free [Band](https://app.band.ai) account (promo code **`BANDHACK26`** for free Band Pro)

### 2. Install dependencies

```bash
cd crossref
uv sync
```

### 3. Register four External Agents on Band

Go to [app.band.ai/agents](https://app.band.ai/agents) → **New Agent** → **External Agent**,
and create one agent for each, **naming them exactly** (names are used for `@mention`
routing):

- `WebScout`
- `ScholarBot`
- `TubeDigger`
- `Synthesizer`

Give each a short, descriptive description. For each agent, copy the **API key**
(shown only once) and the **Agent UUID** from its settings page.

### 4. Configure credentials and keys

```bash
cp .env.example .env
cp agent_config.yaml.example agent_config.yaml
```

- Fill `agent_config.yaml` with the four agents' `agent_id` + `api_key`.
- Fill `.env` with your provider keys:
  - `ANTHROPIC_API_KEY` — for WebScout + TubeDigger
  - `OPENAI_API_KEY` — for ScholarBot + Synthesizer
  - `TAVILY_API_KEY` — free at [tavily.com](https://tavily.com) (WebScout)
  - `YOUTUBE_API_KEY` — YouTube Data API v3 key (TubeDigger)
  - _ScholarBot needs no key — Semantic Scholar is free._

Both `.env` and `agent_config.yaml` are gitignored. Never commit them.

### 5. Run the agents

Run all four in one process:

```bash
uv run python run_all.py
```

Or run each in its own terminal (handy for reading per-agent logs):

```bash
uv run python -m agents.webscout
uv run python -m agents.scholarbot
uv run python -m agents.tubedigger
uv run python -m agents.synthesizer
```

### 6. Demo it

In Band, create a chat room and add all four agents as participants (**Remote**
section). Then send a single message mentioning all of them:

```
@WebScout @ScholarBot @TubeDigger @Synthesizer Is coffee good for health?
```

WebScout, ScholarBot, and TubeDigger each search and post their labelled findings
(mentioning the Synthesizer). Once all three have landed, the Synthesizer posts the
final `[CROSSREF ANALYSIS]` with consensus, contradictions, verified insights, and a
High/Medium/Low confidence rating.

---

## Project layout

```
crossref/
├── pyproject.toml              # uv project + dependencies
├── .env.example                # provider + platform keys
├── agent_config.yaml.example   # per-agent Band credentials
├── run_all.py                  # runs all four agents in one process
├── prompts.py                  # custom_section system prompts per agent
├── tools/
│   ├── web_search.py           # Tavily (Anthropic CustomToolDef)
│   ├── academic_search.py      # Semantic Scholar (LangChain @tool)
│   └── youtube_search.py       # YouTube Data API + transcripts (CustomToolDef)
└── agents/
    ├── _base.py                # shared Agent.create / run helpers
    ├── webscout.py             # AnthropicAdapter + web_search
    ├── tubedigger.py           # AnthropicAdapter + youtube_search
    ├── scholarbot.py           # LangGraphAdapter + academic_search
    └── synthesizer.py          # LangGraphAdapter, no search tools
```

## Notes & troubleshooting

- **Agent stays silent / no analysis:** the Synthesizer intentionally waits until it
  has seen all three labelled findings. Make sure all four agents are running and are
  participants in the room, and that the search agents are `@mention`-ing
  `Synthesizer` (check their posted messages).
- **`@mention` doesn't resolve:** the Band display names must be exactly `WebScout`,
  `ScholarBot`, `TubeDigger`, `Synthesizer`.
- **`401 Unauthorized`:** check `agent_id` / `api_key` in `agent_config.yaml`.
- **No YouTube transcripts:** many videos disable transcripts; TubeDigger degrades
  gracefully and reports when an excerpt is unavailable.
- **Semantic Scholar `429`:** the free API is rate-limited; wait a few seconds.
- **Verbose logs:** set `CROSSREF_DEBUG=1` in `.env` to enable `thenvoi` DEBUG logging.

## Scope

Deliberately tight: no frontend, no database, no auth. Band's built-in chat UI is the
interface. Just four agents that search, communicate through Band, and cross-reference.
```

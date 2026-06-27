"""
agents.py  —  SPEED-OPTIMIZED
------------------------------
Two-agent fast-path for RegIntel compliance extraction.

OLD: 6 agents × 6 LLM calls, memory=True, verbose=True  →  ~120–180s
NEW: 2 agents × 2 LLM calls, memory=False, verbose=False →  ~15–25s

Architecture:
  Agent 1 (FastExtractionAgent)  — reads raw text, outputs structured action list
  Agent 2 (FastMappingAgent)     — maps each action to dept + priority + due_days → JSON
"""

from __future__ import annotations

import logging
import os
from typing import Final

from dotenv import load_dotenv

try:
    from crewai import Agent
except ImportError as exc:
    raise ImportError("crewai is required: pip install crewai") from exc

try:
    from langchain_google_genai import ChatGoogleGenerativeAI
except ImportError as exc:
    raise ImportError("langchain-google-genai is required: pip install langchain-google-genai") from exc

logger = logging.getLogger(__name__)

load_dotenv(override=False)

_api_key: str | None = os.getenv("GOOGLE_API_KEY")
if not _api_key:
    raise EnvironmentError(
        "GOOGLE_API_KEY is not set. Add it to ai-agents/.env before importing this module."
    )

GEMINI_MODEL: Final[str] = "gemini-2.0-flash"

_llm: ChatGoogleGenerativeAI = ChatGoogleGenerativeAI(
    model=GEMINI_MODEL,
    temperature=0.1,          # lower = faster, more deterministic
    google_api_key=_api_key,
    convert_system_message_to_human=True,
)

logger.info("Initialised %s LLM for fast compliance pipeline.", GEMINI_MODEL)

# ── Agent 1: Fast Extraction ────────────────────────────────────────────────────
fast_extraction_agent: Agent = Agent(
    role="Compliance Extraction Specialist",
    goal=(
        "Extract every mandatory compliance obligation from the regulatory text "
        "and output a concise numbered list. Each item must state: "
        "what must be done, which bank department is responsible "
        "(IT Security / Risk Management / Compliance / Legal / Retail Banking), "
        "and the enforcement deadline in days from today."
    ),
    backstory="Expert in RBI regulations with 10 years extracting compliance mandates.",
    verbose=False,
    memory=False,
    allow_delegation=False,
    llm=_llm,
)

# ── Agent 2: Fast JSON Mapper ───────────────────────────────────────────────────
fast_mapping_agent: Agent = Agent(
    role="Compliance Task JSON Generator",
    goal=(
        "Convert the numbered obligation list into a valid JSON array. "
        "Each element must have exactly these keys: "
        "title (string), department (string), priority (High/Medium/Low), "
        "description (string), due_days (integer). "
        "Output ONLY the raw JSON array — no markdown, no commentary."
    ),
    backstory="Specialist in producing machine-readable compliance task payloads for banking APIs.",
    verbose=False,
    memory=False,
    allow_delegation=False,
    llm=_llm,
)

ALL_AGENTS = [fast_extraction_agent, fast_mapping_agent]

logger.info("Fast compliance agents ready (%d agents).", len(ALL_AGENTS))

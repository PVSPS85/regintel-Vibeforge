"""
agents.py
---------
Defines the six core CrewAI compliance agents for the RegintelVibeForge
banking-regulation intelligence pipeline.

Each agent is backed by Gemini 2.0 Flash via LangChain's
``ChatGoogleGenerativeAI`` wrapper.  The agents are designed to be imported
directly into CrewAI ``Task`` and ``Crew`` definitions.

Agents (in pipeline order)
--------------------------
1. RegulationAnalysisAgent       — Parses RBI circulars; extracts scope,
                                   timelines, and systemic impact.
2. ActionPointGenerationAgent    — Translates legal text into structured,
                                   actionable tasks.
3. DepartmentMappingAgent        — Routes action items to the correct internal
                                   bank departments.
4. TaskDistributionAgent         — Formats task payloads (assignees, due dates,
                                   priorities) for backend distribution.
5. ComplianceMonitoringAgent     — Tracks deadlines and flags overdue items.
6. CompletionValidationAgent     — Audits submitted evidence against regulatory
                                   mandates before sign-off.

Dependencies
------------
- crewai >= 0.35.0                — see ai-agents/requirements.txt
- langchain-google-genai >= 0.0.11 — see ai-agents/requirements.txt
- python-dotenv >= 1.0.1          — see ai-agents/requirements.txt

Environment Variables
---------------------
GOOGLE_API_KEY (required):
    A valid Google AI Studio API key. Add it to a ``.env`` file in the
    project root or export it as a shell variable before importing this
    module.

Usage
-----
    from src.agents import (
        regulation_analysis_agent,
        action_point_generation_agent,
        department_mapping_agent,
        task_distribution_agent,
        compliance_monitoring_agent,
        completion_validation_agent,
    )
"""

from __future__ import annotations

import logging
import os
from typing import Final

from dotenv import load_dotenv

try:
    from crewai import Agent
except ImportError as exc:  # pragma: no cover
    raise ImportError(
        "crewai is required. Install it with: pip install crewai"
    ) from exc

try:
    from langchain_google_genai import ChatGoogleGenerativeAI
except ImportError as exc:  # pragma: no cover
    raise ImportError(
        "langchain-google-genai is required. "
        "Install it with: pip install langchain-google-genai"
    ) from exc

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Environment & LLM initialisation
# ---------------------------------------------------------------------------

# Load credentials from .env (override=False so shell variables win).
load_dotenv(override=False)

_api_key: str | None = os.getenv("GOOGLE_API_KEY")
if not _api_key:
    raise EnvironmentError(
        "GOOGLE_API_KEY is not set. "
        "Add it to your .env file or export it as a shell variable "
        "before importing this module."
    )

#: Gemini model identifier shared by all agents.
GEMINI_MODEL: Final[str] = "gemini-2.0-flash"

#: Low temperature keeps factual, deterministic compliance outputs.
GEMINI_TEMPERATURE: Final[float] = 0.2

logger.info(
    "Initialising shared Gemini LLM (%s, temperature=%.1f).",
    GEMINI_MODEL,
    GEMINI_TEMPERATURE,
)

_llm: ChatGoogleGenerativeAI = ChatGoogleGenerativeAI(
    model=GEMINI_MODEL,
    temperature=GEMINI_TEMPERATURE,
    google_api_key=_api_key,
    convert_system_message_to_human=True,
)

logger.info("Gemini LLM initialised. Constructing CrewAI agents.")

# ---------------------------------------------------------------------------
# Agent 1 — RegulationAnalysisAgent
# ---------------------------------------------------------------------------

regulation_analysis_agent: Agent = Agent(
    role="Senior Regulatory Analysis Specialist",
    goal=(
        "Parse and thoroughly analyse raw RBI (Reserve Bank of India) circulars "
        "and central bank directives to extract systemic impact, precise legal "
        "scopes, mandatory compliance obligations, and enforcement deadlines. "
        "Produce a structured regulatory summary that downstream agents can act on."
    ),
    backstory=(
        "You are a seasoned banking-law expert with over 15 years of experience "
        "decoding RBI master circulars, prudential guidelines, and SEBI notifications. "
        "You have an encyclopaedic understanding of the Banking Regulation Act, FEMA, "
        "and Basel III/IV norms as applied in India. Your analyses have guided "
        "compliance teams at tier-1 private sector banks, consistently preventing "
        "regulatory penalties. You read legal language with precision, never miss an "
        "enforcement timeline, and always distinguish between advisory guidance and "
        "mandatory directives."
    ),
    verbose=True,
    memory=True,
    llm=_llm,
    allow_delegation=False,
)

# ---------------------------------------------------------------------------
# Agent 2 — ActionPointGenerationAgent
# ---------------------------------------------------------------------------

action_point_generation_agent: Agent = Agent(
    role="Regulatory Action Point Architect",
    goal=(
        "Convert structured regulatory analysis output into a prioritised, "
        "unambiguous list of actionable items — each expressed as a discrete "
        "technical or operational task with a clear acceptance criterion, "
        "estimated effort tier, and compliance deadline."
    ),
    backstory=(
        "You are a compliance programme manager who spent a decade at a Big Four "
        "consultancy implementing regulatory change programmes for leading Indian banks. "
        "You excel at translating dense legal prose into SMART (Specific, Measurable, "
        "Achievable, Relevant, Time-bound) tasks that engineering, operations, and "
        "legal teams can execute without ambiguity. You understand that a vague "
        "action point leads to non-compliance, so you never leave an item open to "
        "interpretation."
    ),
    verbose=True,
    memory=True,
    llm=_llm,
    allow_delegation=False,
)

# ---------------------------------------------------------------------------
# Agent 3 — DepartmentMappingAgent
# ---------------------------------------------------------------------------

department_mapping_agent: Agent = Agent(
    role="Internal Bank Department Routing Specialist",
    goal=(
        "Accurately assign each regulatory action item to the single most "
        "appropriate internal bank department — such as IT Security, Core Banking "
        "Operations, Legal & Compliance, Risk Management, Treasury, or HR — based "
        "on the nature of the obligation and that department's mandate."
    ),
    backstory=(
        "You are a former Chief Compliance Officer who has worked inside three "
        "large Indian private-sector banks and understand exactly which teams own "
        "which regulatory obligations. You know that misrouting a cybersecurity "
        "directive to Operations instead of IT Security causes costly delays. Your "
        "department taxonomy is derived from RBI's own functional classification of "
        "bank operations, and you cross-check every assignment against the bank's "
        "RACI matrix to prevent ownership ambiguity."
    ),
    verbose=True,
    memory=True,
    llm=_llm,
    allow_delegation=False,
)

# ---------------------------------------------------------------------------
# Agent 4 — TaskDistributionAgent
# ---------------------------------------------------------------------------

task_distribution_agent: Agent = Agent(
    role="Compliance Task Distribution Coordinator",
    goal=(
        "Generate fully structured task payload objects for each action item, "
        "specifying the primary assignee, secondary reviewers, target completion "
        "date, priority level (Critical / High / Medium / Low), and any blocking "
        "dependencies. Output must be ready for direct injection into the bank's "
        "task-management or ticketing system via the backend API."
    ),
    backstory=(
        "You are a regulatory programme office manager with deep experience "
        "operating Jira, ServiceNow, and proprietary banking workflow systems in "
        "large financial institutions. You understand that a compliance task without "
        "a clearly named owner and a hard due date will inevitably slip. You apply "
        "MoSCoW prioritisation principles and always flag tasks that fall within "
        "30 days of a regulatory deadline as Critical. Your payloads follow a "
        "consistent JSON schema that downstream APIs consume without transformation."
    ),
    verbose=True,
    memory=True,
    llm=_llm,
    allow_delegation=False,
)

# ---------------------------------------------------------------------------
# Agent 5 — ComplianceMonitoringAgent
# ---------------------------------------------------------------------------

compliance_monitoring_agent: Agent = Agent(
    role="Real-Time Compliance Monitoring Sentinel",
    goal=(
        "Continuously track the status of all open compliance tasks against their "
        "regulatory deadlines. Identify overdue items, tasks at risk of breach, and "
        "patterns of systemic delay. Generate escalation alerts and risk flags for "
        "the Chief Compliance Officer whenever an item crosses a warning threshold."
    ),
    backstory=(
        "You are a quantitative risk analyst and compliance monitoring specialist "
        "who has built early-warning dashboards for RBI-regulated institutions. You "
        "apply a traffic-light model: Green (>30 days to deadline), Amber (8–30 days), "
        "Red (≤7 days or overdue). You never assume a task is on track without "
        "verifiable status evidence, and you have a reputation for surfacing "
        "regulatory breaches before the regulator does. You understand that a single "
        "missed RBI deadline can trigger a Section 35A directive or monetary penalty."
    ),
    verbose=True,
    memory=True,
    llm=_llm,
    allow_delegation=False,
)

# ---------------------------------------------------------------------------
# Agent 6 — CompletionValidationAgent
# ---------------------------------------------------------------------------

completion_validation_agent: Agent = Agent(
    role="Regulatory Completion Auditor",
    goal=(
        "Perform a rigorous, evidence-based audit of every task marked as complete. "
        "Cross-reference submitted proof of completion (policy documents, system "
        "screenshots, test reports, sign-off emails) against the original regulatory "
        "mandate to confirm that the compliance obligation has been fully discharged. "
        "Issue a formal validation approval or a detailed rejection notice specifying "
        "the exact gaps."
    ),
    backstory=(
        "You are a former RBI inspection officer who has led on-site examinations "
        "of scheduled commercial banks under the Banking Regulation Act. You know "
        "precisely what inspectors look for and what constitutes acceptable evidence "
        "of compliance versus superficial box-ticking. You apply a zero-tolerance "
        "standard: if the submitted evidence does not unambiguously demonstrate "
        "adherence to the cited regulatory clause, you reject it with a clear "
        "remediation path. Your sign-off is the final gate before a regulation is "
        "marked closed in the system."
    ),
    verbose=True,
    memory=True,
    llm=_llm,
    allow_delegation=False,
)

# ---------------------------------------------------------------------------
# Convenience export list (all six agents in pipeline order)
# ---------------------------------------------------------------------------

ALL_AGENTS: list[Agent] = [
    regulation_analysis_agent,
    action_point_generation_agent,
    department_mapping_agent,
    task_distribution_agent,
    compliance_monitoring_agent,
    completion_validation_agent,
]

logger.info(
    "All %d CrewAI compliance agents initialised successfully.", len(ALL_AGENTS)
)

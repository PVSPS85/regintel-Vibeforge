"""
tasks.py  —  SPEED-OPTIMIZED
------------------------------
Two-task fast pipeline matching the two optimized agents.

Task 1 (extract_obligations_task):  raw text → numbered obligation list
Task 2 (generate_json_tasks_task):  obligation list → JSON array of task objects

This replaces the original 6-task sequential chain that made 6 LLM calls.
"""

from __future__ import annotations

import logging
from typing import List

try:
    from crewai import Task
except ImportError as exc:
    raise ImportError("crewai is required: pip install crewai") from exc

from src.agents import fast_extraction_agent, fast_mapping_agent

logger = logging.getLogger(__name__)

# ── Task 1: Extract Obligations ─────────────────────────────────────────────────
extract_obligations_task: Task = Task(
    description=(
        "Read the regulatory document text provided in the variable "
        "`{regulation_text}` and extract every mandatory compliance obligation.\n\n"
        "For each obligation write one line:\n"
        "  <N>. <What must be done> | Department: <dept> | Due: <N days from today>\n\n"
        "Valid departments: IT Security, Risk Management, Compliance, Legal, Retail Banking.\n"
        "Be concise. Do not include advisory items. Do not repeat obligations."
    ),
    expected_output=(
        "A numbered list where each line follows exactly this format:\n"
        "1. <Obligation title> | Department: <dept> | Due: <N days>\n"
        "2. ...\n"
        "Keep each line under 120 characters."
    ),
    agent=fast_extraction_agent,
)

# ── Task 2: Generate JSON ───────────────────────────────────────────────────────
generate_json_tasks_task: Task = Task(
    description=(
        "Convert the numbered obligation list from the previous step into a "
        "JSON array of compliance task objects.\n\n"
        "Required keys per object:\n"
        "  - title                : string, imperative, max 80 chars\n"
        "  - department           : exactly one of: IT Security, Risk Management, Compliance, Legal, Retail Banking\n"
        "  - priority             : High (due_days ≤ 21), Medium (22–45), Low (> 45)\n"
        "  - detailed_explanation : a 3-4 sentence, highly professional breakdown of exactly HOW the employee should execute this compliance task based on regulatory requirements\n"
        "  - description          : one-sentence description of what must be done\n"
        "  - due_days             : integer, days from today until deadline\n\n"
        "Output ONLY the JSON array. No markdown code fences. No comments. "
        "Ensure the JSON is valid and parseable by Python's json.loads()."
    ),
    expected_output=(
        '[{"title": "...", "department": "...", "priority": "High", '
        '"detailed_explanation": "...", "description": "...", "due_days": 14}, ...]'
    ),
    agent=fast_mapping_agent,
    context=[extract_obligations_task],
)

ALL_TASKS: List[Task] = [extract_obligations_task, generate_json_tasks_task]

logger.info("Fast compliance tasks ready (%d tasks).", len(ALL_TASKS))

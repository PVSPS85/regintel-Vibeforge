"""
tasks.py
--------
Defines the six sequential CrewAI compliance processing tasks for the
RegintelVibeForge banking-regulation intelligence pipeline.

Each task is tightly coupled to one of the six specialist agents defined in
``src.agents`` and produces a structured artefact that feeds the next task
in the chain, forming a deterministic, auditable compliance workflow.

Task pipeline (in execution order)
------------------------------------
1. regulation_analysis_task       — Raw PDF text → structured regulation summary.
2. action_point_generation_task   — Regulation summary → itemised mandate list.
3. department_mapping_task        — Mandate list → department-assigned action items.
4. task_distribution_task         — Assigned items → JSON-ready task payloads.
5. compliance_monitoring_task     — Task payloads → live monitoring log with status.
6. completion_validation_task     — Monitoring log + evidence → audit sign-off report.

Dependencies
------------
- crewai >= 0.35.0   — see ai-agents/requirements.txt
- src.agents         — must be importable from the same Python path.

Usage
-----
    from src.tasks import (
        regulation_analysis_task,
        action_point_generation_task,
        department_mapping_task,
        task_distribution_task,
        compliance_monitoring_task,
        completion_validation_task,
        ALL_TASKS,
    )

    from crewai import Crew
    from src.agents import ALL_AGENTS

    crew = Crew(agents=ALL_AGENTS, tasks=ALL_TASKS, verbose=True)
    result = crew.kickoff(inputs={"regulation_text": raw_pdf_text})
"""

from __future__ import annotations

import logging
from typing import List

try:
    from crewai import Task
except ImportError as exc:  # pragma: no cover
    raise ImportError(
        "crewai is required. Install it with: pip install crewai"
    ) from exc

from src.agents import (
    regulation_analysis_agent,
    action_point_generation_agent,
    department_mapping_agent,
    task_distribution_agent,
    compliance_monitoring_agent,
    completion_validation_agent,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Task 1 — Regulation Analysis
# ---------------------------------------------------------------------------

regulation_analysis_task: Task = Task(
    description=(
        "You will be provided with the full plain-text content of an RBI circular "
        "or central bank directive, supplied via the input variable "
        "``{regulation_text}``.\n\n"
        "Your objective is to perform a comprehensive regulatory analysis. "
        "Specifically, you must:\n"
        "  1. Identify the circular's reference number, issuing authority, and "
        "     publication date.\n"
        "  2. Determine the regulatory framework it falls under (e.g., Basel III, "
        "     PMLA, Cyber Security Framework, KYC Master Direction).\n"
        "  3. Extract every mandatory compliance obligation, distinguishing clearly "
        "     between 'must' obligations and advisory 'should' recommendations.\n"
        "  4. List all enforcement deadlines and effective dates in ISO 8601 format "
        "     (YYYY-MM-DD).\n"
        "  5. Assess systemic impact: which categories of banks or NBFCs are "
        "     covered, what the penalty for non-compliance is (if stated), and "
        "     whether the circular supersedes an earlier directive.\n\n"
        "Do not paraphrase or summarise loosely — reproduce the exact regulatory "
        "language for each obligation, then annotate with your structured metadata."
    ),
    expected_output=(
        "A structured regulation summary in the following format:\n\n"
        "CIRCULAR METADATA\n"
        "  - Reference Number: <value>\n"
        "  - Issuing Authority: <value>\n"
        "  - Publication Date: <YYYY-MM-DD>\n"
        "  - Effective Date(s): <YYYY-MM-DD or list>\n"
        "  - Regulatory Framework: <value>\n"
        "  - Entities Covered: <list>\n"
        "  - Supersedes: <reference or 'None'>\n\n"
        "MANDATORY OBLIGATIONS\n"
        "  [OBL-001] <exact regulatory language> | Deadline: <YYYY-MM-DD>\n"
        "  [OBL-002] ...\n\n"
        "ADVISORY RECOMMENDATIONS\n"
        "  [ADV-001] <exact advisory language>\n\n"
        "SYSTEMIC IMPACT ASSESSMENT\n"
        "  - Scope: <broad / targeted>\n"
        "  - Non-compliance Penalty: <value or 'Not specified'>\n"
        "  - Risk Level: <Critical / High / Medium / Low>\n"
        "  - Summary: <2–4 sentence plain-English impact narrative>"
    ),
    agent=regulation_analysis_agent,
)

# ---------------------------------------------------------------------------
# Task 2 — Action Point Generation
# ---------------------------------------------------------------------------

action_point_generation_task: Task = Task(
    description=(
        "Using the structured regulation summary produced by the Regulation "
        "Analysis task (available as context), decompose every mandatory obligation "
        "into granular, independently executable action points.\n\n"
        "For each action point you must:\n"
        "  1. Assign a unique sequential identifier (AP-001, AP-002, …).\n"
        "  2. Write the action in imperative form — a verb-led instruction that "
        "     leaves no ambiguity about what must be done.\n"
        "  3. Specify the acceptance criterion: the single observable outcome that "
        "     proves the action has been completed.\n"
        "  4. Estimate effort tier: Quick Win (<1 week), Short Term (1–4 weeks), "
        "     Medium Term (1–3 months), or Long Term (>3 months).\n"
        "  5. Copy the compliance deadline from the source obligation.\n"
        "  6. Flag whether the action requires a policy change, a system change, "
        "     a process change, or a training programme (or a combination).\n\n"
        "Do not merge obligations into compound action points. Each AP must be "
        "addressable by a single team without cross-functional dependencies "
        "where possible."
    ),
    expected_output=(
        "An itemised action point register in the following format:\n\n"
        "ACTION POINT REGISTER\n\n"
        "[AP-001]\n"
        "  Action     : <imperative instruction>\n"
        "  Source Ref : <OBL-XXX from regulation analysis>\n"
        "  Criterion  : <acceptance criterion>\n"
        "  Effort     : <Quick Win | Short Term | Medium Term | Long Term>\n"
        "  Deadline   : <YYYY-MM-DD>\n"
        "  Change Type: <Policy | System | Process | Training | Combination>\n\n"
        "[AP-002]\n"
        "  ...\n\n"
        "Total Action Points: <N>\n"
        "Critical (deadline ≤ 30 days): <count>\n"
        "Advisory items excluded: <count>"
    ),
    agent=action_point_generation_agent,
    context=[regulation_analysis_task],
)

# ---------------------------------------------------------------------------
# Task 3 — Department Mapping
# ---------------------------------------------------------------------------

department_mapping_task: Task = Task(
    description=(
        "Review the complete Action Point Register from the previous task and "
        "assign each action point to the single most appropriate internal bank "
        "department.\n\n"
        "Use the following canonical department list; do not invent new departments:\n"
        "  - IT Security & Cyber Risk\n"
        "  - Core Banking & Technology Operations\n"
        "  - Legal & Compliance\n"
        "  - Risk Management & Internal Audit\n"
        "  - Treasury & ALM\n"
        "  - Retail & Branch Operations\n"
        "  - Human Resources & Training\n"
        "  - Finance & Accounts\n"
        "  - Customer Service & Grievance Redressal\n\n"
        "For each action point:\n"
        "  1. State the primary owning department.\n"
        "  2. List any secondary departments that must be consulted (RACI: "
        "     Consulted), if applicable.\n"
        "  3. Provide a one-sentence justification for the primary assignment "
        "     grounded in the nature of the regulatory obligation.\n\n"
        "If an action point genuinely spans two departments equally, designate one "
        "as Lead Owner and the other as Co-Owner, and note why joint ownership is "
        "unavoidable."
    ),
    expected_output=(
        "A department-mapped action point list in the following format:\n\n"
        "DEPARTMENT MAPPING REGISTER\n\n"
        "[AP-001]\n"
        "  Action Summary : <brief description>\n"
        "  Primary Owner  : <Department Name>\n"
        "  Co-Owner       : <Department Name or 'None'>\n"
        "  Consulted      : <Department(s) or 'None'>\n"
        "  Justification  : <one sentence>\n\n"
        "[AP-002]\n"
        "  ...\n\n"
        "SUMMARY TABLE\n"
        "  Department                        | Action Point Count\n"
        "  ----------------------------------|-------------------\n"
        "  IT Security & Cyber Risk          | <N>\n"
        "  Core Banking & Technology Ops     | <N>\n"
        "  Legal & Compliance                | <N>\n"
        "  Risk Management & Internal Audit  | <N>\n"
        "  Treasury & ALM                    | <N>\n"
        "  Retail & Branch Operations        | <N>\n"
        "  Human Resources & Training        | <N>\n"
        "  Finance & Accounts                | <N>\n"
        "  Customer Service & Grievance      | <N>"
    ),
    agent=department_mapping_agent,
    context=[action_point_generation_task],
)

# ---------------------------------------------------------------------------
# Task 4 — Task Distribution
# ---------------------------------------------------------------------------

task_distribution_task: Task = Task(
    description=(
        "Transform each entry in the Department Mapping Register into a fully "
        "structured task payload object that can be inserted directly into a "
        "task-management system (e.g., Jira, ServiceNow) via a REST API.\n\n"
        "Each payload must include the following fields with no omissions:\n"
        "  - task_id         : A unique string identifier formatted as "
        "                      'REGINTEL-<YYYYMMDD>-<AP-ID>' "
        "                      (e.g., 'REGINTEL-20240315-AP001').\n"
        "  - department      : The primary owning department name (exact string).\n"
        "  - title           : A concise task title (max 80 characters, "
        "                      imperative verb + object).\n"
        "  - description     : Full task description including the acceptance "
        "                      criterion and source regulatory reference.\n"
        "  - priority        : One of 'Critical', 'High', 'Medium', or 'Low'.\n"
        "                      Assign 'Critical' if deadline ≤ 30 days from today; "
        "                      'High' if 31–60 days; 'Medium' if 61–90 days; "
        "                      'Low' if >90 days.\n"
        "  - due_date        : ISO 8601 date string (YYYY-MM-DD).\n"
        "  - assignee        : The department name (individual assignment is "
        "                      resolved downstream by department leads).\n"
        "  - tags            : A list of relevant tags "
        "                      (e.g., ['RBI', 'CyberSecurity', 'Q1-2025']).\n"
        "  - source_ref      : The original obligation reference (OBL-XXX).\n"
        "  - change_type     : From the action point register "
        "                      (Policy / System / Process / Training / Combination).\n\n"
        "Output all payloads as a valid JSON array. Validate that every object "
        "has all ten fields before finalising."
    ),
    expected_output=(
        "A valid JSON array of task payload objects where each object contains "
        "exactly ten fields: task_id (string, format REGINTEL-YYYYMMDD-APXXX), "
        "department (string, primary owning department), "
        "title (string, max 80 chars, imperative verb plus object), "
        "description (string, full task description with acceptance criterion and source ref), "
        "priority (string, one of Critical / High / Medium / Low), "
        "due_date (string, ISO 8601 YYYY-MM-DD), "
        "assignee (string, department name), "
        "tags (array of strings such as RBI, CyberSecurity, Q1-2025), "
        "source_ref (string, obligation reference e.g. OBL-001), "
        "change_type (string, one of Policy / System / Process / Training / Combination). "
        "The output must be a syntactically valid JSON array with no trailing commas, "
        "no comments, and all string values properly escaped. "
        "Every object in the array must contain all ten fields with no omissions."
    ),
    agent=task_distribution_agent,
    context=[department_mapping_task],
)

# ---------------------------------------------------------------------------
# Task 5 — Compliance Monitoring
# ---------------------------------------------------------------------------

compliance_monitoring_task: Task = Task(
    description=(
        "Using the JSON task payload array from the Task Distribution step, "
        "construct a comprehensive monitoring log that tracks each compliance "
        "task through its lifecycle.\n\n"
        "For each task in the payload array:\n"
        "  1. Determine its current RAG (Red / Amber / Green) status based on "
        "     days remaining to the due date:\n"
        "       - Green  : > 30 days remaining.\n"
        "       - Amber  : 8–30 days remaining.\n"
        "       - Red    : ≤ 7 days remaining or past due date.\n"
        "  2. Calculate the exact number of calendar days remaining from today's "
        "     date to the due date.\n"
        "  3. Set the initial ``completion_status`` to 'Not Started'.\n"
        "  4. Populate the ``escalation_required`` flag as ``true`` if the task "
        "     is Red-status, otherwise ``false``.\n"
        "  5. Generate an ``alert_message`` for any Red or Amber task that "
        "     describes the risk in plain English, names the owning department, "
        "     and states the consequence of missing the deadline.\n\n"
        "Additionally, produce an Executive Monitoring Summary at the top of the "
        "output: total tasks, breakdown by RAG status, and an overall portfolio "
        "risk level (Critical if any Red tasks exist, Elevated if any Amber, "
        "Managed if all Green)."
    ),
    expected_output=(
        "A structured compliance monitoring log in the following format:\n\n"
        "EXECUTIVE MONITORING SUMMARY\n"
        "  Total Tasks          : <N>\n"
        "  Green (>30 days)     : <N>\n"
        "  Amber (8–30 days)    : <N>\n"
        "  Red (≤7 days/overdue): <N>\n"
        "  Portfolio Risk Level : <Critical | Elevated | Managed>\n\n"
        "TASK MONITORING LOG\n\n"
        "[REGINTEL-<date>-AP001]\n"
        "  Title              : <task title>\n"
        "  Department         : <owning department>\n"
        "  Due Date           : <YYYY-MM-DD>\n"
        "  Days Remaining     : <integer>\n"
        "  RAG Status         : <Red | Amber | Green>\n"
        "  Completion Status  : Not Started\n"
        "  Escalation Required: <true | false>\n"
        "  Alert Message      : <plain-English risk alert or 'None'>\n\n"
        "[REGINTEL-<date>-AP002]\n"
        "  ..."
    ),
    agent=compliance_monitoring_agent,
    context=[task_distribution_task],
)

# ---------------------------------------------------------------------------
# Task 6 — Completion Validation
# ---------------------------------------------------------------------------

completion_validation_task: Task = Task(
    description=(
        "Act as a senior regulatory auditor. Review the full compliance monitoring "
        "log and, for each task, define the precise evidence checklist that must "
        "be satisfied before the task can be marked as 'Validated Complete'.\n\n"
        "For each task in the monitoring log:\n"
        "  1. List the specific evidence items required for validation. Evidence "
        "     types include (but are not limited to):\n"
        "       - Updated policy/procedure document (version-controlled, "
        "         board-approved where required).\n"
        "       - System screenshot or penetration test report confirming "
        "         technical implementation.\n"
        "       - Training completion records with attendance registers.\n"
        "       - Board or management committee meeting minutes approving the change.\n"
        "       - Signed-off internal audit report confirming the control is operating.\n"
        "       - External legal opinion (for complex regulatory interpretations).\n"
        "  2. Specify the minimum standard each evidence item must meet to be "
        "     accepted (e.g., 'Policy document must reference the specific RBI "
        "     circular clause and carry the CISO signature').\n"
        "  3. State the validation outcome criteria: what constitutes a PASS "
        "     (fully compliant), a CONDITIONAL PASS (minor gaps with an agreed "
        "     remediation timeline), and a FAIL (material non-compliance).\n"
        "  4. Note any regulatory look-back period — how far back evidence must "
        "     be dated to be considered valid for this obligation.\n\n"
        "Finally, produce a Validation Charter: a concise statement of the "
        "validation process, independence requirements (who may not validate "
        "their own team's work), and escalation path for contested outcomes."
    ),
    expected_output=(
        "A formal Compliance Completion Validation Report in the following format:\n\n"
        "VALIDATION CHARTER\n"
        "  Process Owner        : CompletionValidationAgent\n"
        "  Independence Rule    : No department may self-validate its own tasks. "
        "Validation must be performed by Legal & Compliance or Internal Audit.\n"
        "  Escalation Path      : Contested outcomes escalate to Chief Compliance "
        "Officer within 5 business days.\n"
        "  Validity Look-back   : Evidence must be dated no more than 6 months "
        "before the regulatory effective date unless otherwise specified.\n\n"
        "TASK VALIDATION CHECKLISTS\n\n"
        "[REGINTEL-<date>-AP001]\n"
        "  Title              : <task title>\n"
        "  Source Obligation  : <OBL-XXX>\n"
        "  Evidence Required  :\n"
        "    [ ] 1. <Evidence item 1> — Standard: <minimum acceptance standard>\n"
        "    [ ] 2. <Evidence item 2> — Standard: <minimum acceptance standard>\n"
        "    [ ] 3. ...\n"
        "  PASS Criteria      : All evidence items checked and meet minimum "
        "standard; no material gaps identified.\n"
        "  CONDITIONAL PASS   : Minor gaps present with a documented remediation "
        "plan approved by the CCO; full compliance within 30 days.\n"
        "  FAIL Criteria      : Any mandatory evidence item missing, incomplete, "
        "or failing minimum standard without an approved remediation plan.\n"
        "  Look-back Period   : <duration, e.g., '6 months' or 'Not applicable'>\n\n"
        "[REGINTEL-<date>-AP002]\n"
        "  ...\n\n"
        "VALIDATION SUMMARY\n"
        "  Total Tasks Reviewed          : <N>\n"
        "  Pass (all evidence ready)     : <N>\n"
        "  Conditional Pass              : <N>\n"
        "  Fail / Evidence Gap           : <N>\n"
        "  Overall Validation Status     : <COMPLIANT | PARTIALLY COMPLIANT | "
        "NON-COMPLIANT>"
    ),
    agent=completion_validation_agent,
    context=[compliance_monitoring_task],
)

# ---------------------------------------------------------------------------
# Convenience export — all six tasks in pipeline execution order
# ---------------------------------------------------------------------------

ALL_TASKS: List[Task] = [
    regulation_analysis_task,
    action_point_generation_task,
    department_mapping_task,
    task_distribution_task,
    compliance_monitoring_task,
    completion_validation_task,
]

logger.info(
    "All %d CrewAI compliance tasks defined and ready for crew assembly.",
    len(ALL_TASKS),
)

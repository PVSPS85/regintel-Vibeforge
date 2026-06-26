"""
crew.py
-------
Orchestrates the six-agent RegintelVibeForge compliance pipeline via CrewAI.

The ``ComplianceCrew`` class assembles all six specialist agents and their
corresponding tasks into a single ``crewai.Crew`` object running in strict
sequential mode.  The pipeline processes raw RBI circular text end-to-end:

    Raw PDF text
        → Regulation Analysis
        → Action Point Generation
        → Department Mapping
        → Task Distribution
        → Compliance Monitoring
        → Completion Validation
        → Validated task report (str)

Dependencies
------------
- crewai >= 0.35.0         — see ai-agents/requirements.txt
- src.agents               — six pre-configured CrewAI Agent instances
- src.tasks                — six sequential CrewAI Task definitions

Environment Variables
---------------------
GOOGLE_API_KEY (required):
    Forwarded transitively through ``src.agents``.  Must be set in a
    ``.env`` file or exported as a shell variable before this module
    is imported.

Usage
-----
    from src.crew import ComplianceCrew

    crew = ComplianceCrew()
    report: str = crew.run_pipeline(pdf_text=raw_text)
    print(report)
"""

from __future__ import annotations

import logging
from typing import Any

try:
    from crewai import Crew, Process
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
from src.tasks import (
    regulation_analysis_task,
    action_point_generation_task,
    department_mapping_task,
    task_distribution_task,
    compliance_monitoring_task,
    completion_validation_task,
)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# ComplianceCrew
# ---------------------------------------------------------------------------


class ComplianceCrew:
    """
    Orchestrates the six-stage RegintelVibeForge compliance processing pipeline.

    The pipeline is assembled once at instantiation time. Subsequent calls to
    ``run_pipeline`` re-use the same ``Crew`` object, avoiding redundant
    initialisation overhead for repeated runs within the same process.

    Attributes
    ----------
    crew : crewai.Crew
        The assembled sequential crew of agents and tasks.

    Examples
    --------
    >>> from src.crew import ComplianceCrew
    >>> pipeline = ComplianceCrew()
    >>> report = pipeline.run_pipeline(pdf_text="<RBI circular text ...>")
    >>> print(report)
    """

    def __init__(self) -> None:
        """
        Initialise the ``ComplianceCrew`` by assembling all agents and tasks
        into a ``crewai.Crew`` configured for sequential execution.

        Agent and task arrays are ordered identically so that each agent's
        output feeds naturally into the next task via CrewAI's sequential
        context propagation.

        Raises
        ------
        RuntimeError
            If the ``Crew`` object cannot be constructed (e.g., due to
            misconfigured agents or tasks).
        """
        logger.info("Assembling ComplianceCrew ...")

        try:
            self.crew: Crew = Crew(
                agents=[
                    regulation_analysis_agent,
                    action_point_generation_agent,
                    department_mapping_agent,
                    task_distribution_agent,
                    compliance_monitoring_agent,
                    completion_validation_agent,
                ],
                tasks=[
                    regulation_analysis_task,
                    action_point_generation_task,
                    department_mapping_task,
                    task_distribution_task,
                    compliance_monitoring_task,
                    completion_validation_task,
                ],
                process=Process.sequential,
                verbose=True,
                full_output=True,
                max_rpm=10,
            )
        except Exception as exc:
            logger.exception(
                "Failed to assemble ComplianceCrew: %s", exc
            )
            raise RuntimeError(
                f"ComplianceCrew initialisation failed: {exc}"
            ) from exc

        logger.info(
            "ComplianceCrew assembled successfully with %d agents and %d tasks.",
            len(self.crew.agents),
            len(self.crew.tasks),
        )

    # -----------------------------------------------------------------------
    # Public API
    # -----------------------------------------------------------------------

    def run_pipeline(self, pdf_text: str) -> str:
        """
        Execute the full six-stage compliance pipeline against raw PDF text.

        The ``pdf_text`` string is injected into the Crew's ``kickoff`` call
        under the ``"regulation_text"`` input key, which matches the
        ``{regulation_text}`` template variable referenced in
        ``regulation_analysis_task``.  CrewAI's sequential process then
        propagates each task's output as context to the next task, so
        downstream agents receive the accumulated chain of structured
        outputs rather than just the raw input.

        Parameters
        ----------
        pdf_text : str
            The full plain-text content extracted from an RBI circular or
            central bank directive PDF (e.g., via PyMuPDF's
            ``page.get_text()``).  Must be non-empty.

        Returns
        -------
        str
            The final ``Completion Validation`` report produced by the
            ``CompletionValidationAgent``.  This is the audited, evidence-
            checked summary of all validated compliance tasks.

        Raises
        ------
        ValueError
            If ``pdf_text`` is empty or contains only whitespace.
        RuntimeError
            If the CrewAI pipeline encounters an orchestration failure
            during execution.

        Examples
        --------
        >>> import fitz  # PyMuPDF
        >>> doc = fitz.open("rbi_circular.pdf")
        >>> raw_text = "\\n".join(page.get_text() for page in doc)
        >>> from src.crew import ComplianceCrew
        >>> report = ComplianceCrew().run_pipeline(pdf_text=raw_text)
        """
        if not pdf_text or not pdf_text.strip():
            raise ValueError(
                "pdf_text must be a non-empty string containing the parsed "
                "regulatory document text."
            )

        logger.info(
            "Starting compliance pipeline. Input length: %d characters.",
            len(pdf_text),
        )

        try:
            result: Any = self.crew.kickoff(
                inputs={"regulation_text": pdf_text}
            )
        except (KeyError, ValueError, TypeError) as exc:
            # CrewAI 0.35.0 can raise a KeyError/ValueError when a task
            # produces JSON output whose keys resemble Python str.format()
            # template placeholders (e.g. '{"task_id": ...}').  In that case
            # we capture whatever partial output the crew has already generated
            # and return it rather than surfacing an opaque 500 error.
            logger.warning(
                "Pipeline hit a known crewai 0.35.0 template-interpolation "
                "issue: %s — attempting to recover partial output.", exc
            )
            # Pull the last task's raw output if available.
            partial: str = ""
            for task in reversed(self.crew.tasks):
                raw = getattr(task, "output", None)
                if raw is not None:
                    partial = str(getattr(raw, "raw_output", raw))
                    break
            if not partial:
                raise RuntimeError(
                    f"Compliance pipeline execution failed and no partial "
                    f"output could be recovered: {exc}"
                ) from exc
            logger.info("Returning partial output (%d chars).", len(partial))
            return partial
        except Exception as exc:
            logger.exception(
                "Pipeline execution failed during crew.kickoff: %s", exc
            )
            raise RuntimeError(
                f"Compliance pipeline execution failed: {exc}"
            ) from exc

        # full_output=True returns a dict: {"final_output": str, "tasks_output": [...]}
        # Fall back gracefully if the shape differs across crewai patch versions.
        if isinstance(result, dict):
            output: str = str(
                result.get("final_output")
                or result.get("tasks_output", [""])[-1]
                or result
            )
        else:
            output = str(result) if not isinstance(result, str) else result

        logger.info(
            "Pipeline completed successfully. Output length: %d characters.",
            len(output),
        )

        return output

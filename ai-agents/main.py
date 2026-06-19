"""
main.py
-------
FastAPI entry point for the RegintelVibeForge compliance AI pipeline.

Exposes the six-stage CrewAI orchestration pipeline as a versioned REST API.
The server accepts either a local PDF file path or a pre-parsed regulation text
string, runs it through the full compliance agent chain, and returns a
structured JSON response containing the validated task report.

Endpoints
---------
GET  /
    Health check — confirms the API process is alive.

POST /api/v1/process-regulation
    Main pipeline endpoint. Accepts a JSON body with either ``file_path``
    (path to a local PDF) or ``raw_text`` (pre-extracted regulation text),
    runs the CrewAI pipeline, and returns the validated compliance report.

Dependencies
------------
- fastapi==0.111.0          — see ai-agents/requirements.txt
- uvicorn==0.30.1           — see ai-agents/requirements.txt
- pydantic==2.7.4           — see ai-agents/requirements.txt
- src.crew.ComplianceCrew   — six-agent sequential CrewAI pipeline
- src.rag.parser.PDFProcessor — PyMuPDF-based PDF text extractor

Environment Variables
---------------------
GOOGLE_API_KEY (required):
    Consumed transitively by ``src.agents`` via ``python-dotenv``.
    Set it in a ``.env`` file at the project root or export it in the shell
    before starting the server.

Usage
-----
    # Start the dev server from the ai-agents/ directory:
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload

    # Or run directly:
    python main.py
"""

from __future__ import annotations

import logging
import time
from typing import Optional

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator

from src.crew import ComplianceCrew
from src.rag.parser import PDFProcessor

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------

app: FastAPI = FastAPI(
    title="RegintelVibeForge — Compliance AI Pipeline",
    description=(
        "A multi-agent AI system that ingests RBI circulars and central bank "
        "directives, extracts mandatory compliance obligations, maps them to "
        "internal bank departments, and produces auditable, evidence-backed "
        "task registers — all powered by a six-stage sequential CrewAI pipeline "
        "running on Gemini 1.5 Pro."
    ),
    version="1.0.0",
    contact={
        "name": "RegintelVibeForge Engineering",
        "url": "https://github.com/regintel-vibeforge",
    },
    license_info={
        "name": "Proprietary",
    },
)

# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------


class RegulationRequest(BaseModel):
    """
    Request payload for the ``/api/v1/process-regulation`` endpoint.

    Exactly one of ``file_path`` or ``raw_text`` must be supplied.
    Providing both, or neither, raises a ``422 Unprocessable Entity`` error
    before the request reaches the endpoint handler.

    Attributes
    ----------
    file_path : str or None
        Absolute or relative path to a PDF file on the server's local
        filesystem (e.g., ``"/data/circulars/rbi_2024_001.pdf"``).
        The server uses ``PDFProcessor.extract_text`` to parse it.
    raw_text : str or None
        Pre-extracted plain text of the regulatory document.  Use this when
        the caller has already performed PDF parsing upstream (e.g., via a
        separate ingestion microservice) and only needs the AI analysis.

    Examples
    --------
    Using a file path::

        {
            "file_path": "/data/rbi_circular_2024_001.pdf"
        }

    Using pre-extracted text::

        {
            "raw_text": "RBI/2024/001 — Reserve Bank of India ..."
        }
    """

    file_path: Optional[str] = Field(
        default=None,
        description=(
            "Absolute or relative path to a local PDF file. "
            "The server extracts text using PyMuPDF. "
            "Mutually exclusive with 'raw_text'."
        ),
        examples=["/data/circulars/rbi_2024_001.pdf"],
    )
    raw_text: Optional[str] = Field(
        default=None,
        description=(
            "Pre-extracted plain text of the regulatory document. "
            "Mutually exclusive with 'file_path'."
        ),
        examples=["RBI/2024/001 — Reserve Bank of India ..."],
    )

    @field_validator("raw_text", mode="after")
    @classmethod
    def validate_exactly_one_source(
        cls, raw_text: Optional[str], info: object
    ) -> Optional[str]:
        """Ensure exactly one of file_path or raw_text is provided."""
        # info.data contains already-validated fields
        file_path: Optional[str] = getattr(info, "data", {}).get("file_path")
        both_provided = file_path is not None and raw_text is not None
        neither_provided = file_path is None and raw_text is None

        if both_provided:
            raise ValueError(
                "Provide either 'file_path' or 'raw_text', not both."
            )
        if neither_provided:
            raise ValueError(
                "At least one of 'file_path' or 'raw_text' must be provided."
            )
        return raw_text


class RegulationResponse(BaseModel):
    """
    Successful response payload from ``/api/v1/process-regulation``.

    Attributes
    ----------
    status : str
        Human-readable pipeline status string.  Always ``"success"`` on a
        200 response.
    source : str
        Indicates whether the input came from a PDF file (``"file"``) or
        from directly supplied text (``"raw_text"``).
    input_characters : int
        Character count of the regulation text that was fed into the pipeline.
        Useful for debugging and auditing.
    processing_time_seconds : float
        Wall-clock time in seconds from the moment the endpoint received the
        request to when the pipeline returned.
    report : str
        The full Compliance Completion Validation Report produced by the
        ``CompletionValidationAgent`` — the final, audited output of the
        six-stage CrewAI pipeline.
    """

    status: str = Field(
        description="Pipeline execution status.  'success' on HTTP 200.",
        examples=["success"],
    )
    source: str = Field(
        description="Origin of the input text: 'file' or 'raw_text'.",
        examples=["file"],
    )
    input_characters: int = Field(
        description="Number of characters in the input regulation text.",
        examples=[14328],
    )
    processing_time_seconds: float = Field(
        description="End-to-end pipeline wall-clock time in seconds.",
        examples=[47.3],
    )
    report: str = Field(
        description="Full compliance validation report from the AI pipeline.",
    )


class HealthResponse(BaseModel):
    """Response schema for the ``GET /`` health check endpoint."""

    status: str = Field(
        description="Operational status of the API.",
        examples=["AI Agent Pipeline is Active"],
    )
    version: str = Field(
        description="API version string.",
        examples=["1.0.0"],
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get(
    "/",
    response_model=HealthResponse,
    summary="Health Check",
    description=(
        "Returns a simple liveness probe confirming the FastAPI process is "
        "running and the application module has loaded without errors."
    ),
    tags=["Health"],
)
def health_check() -> HealthResponse:
    """
    Liveness probe for load balancers and orchestration platforms.

    Returns
    -------
    HealthResponse
        JSON object with ``status`` and ``version`` fields.
    """
    logger.info("Health check requested.")
    return HealthResponse(
        status="AI Agent Pipeline is Active",
        version=app.version,
    )


@app.post(
    "/api/v1/process-regulation",
    response_model=RegulationResponse,
    summary="Process Regulatory Document",
    description=(
        "Accepts an RBI circular or central bank directive — either as a local "
        "PDF file path or as pre-extracted plain text — and runs it through the "
        "full six-stage CrewAI compliance pipeline. Returns a structured "
        "Compliance Completion Validation Report."
    ),
    tags=["Pipeline"],
    responses={
        200: {"description": "Pipeline completed successfully."},
        422: {"description": "Validation error — missing or conflicting input fields."},
        500: {"description": "Internal pipeline or AI orchestration failure."},
    },
)
def process_regulation(payload: RegulationRequest) -> RegulationResponse:
    """
    Execute the full six-stage compliance AI pipeline on a regulatory document.

    **Input resolution order:**

    1. If ``file_path`` is provided, the server loads the PDF from disk using
       :class:`~src.rag.parser.PDFProcessor` and extracts the full text via
       PyMuPDF.
    2. If ``raw_text`` is provided, it is used directly as the pipeline input
       without any additional parsing.

    **Pipeline stages (sequential):**

    1. Regulation Analysis
    2. Action Point Generation
    3. Department Mapping
    4. Task Distribution
    5. Compliance Monitoring
    6. Completion Validation

    Parameters
    ----------
    payload : RegulationRequest
        Validated request body.  Exactly one of ``file_path`` or ``raw_text``
        must be set.

    Returns
    -------
    RegulationResponse
        JSON response containing the full compliance validation report,
        execution metadata, and source provenance.

    Raises
    ------
    HTTPException (400)
        If a ``file_path`` is given but the file does not exist or cannot
        be parsed as a valid PDF.
    HTTPException (500)
        If any stage of the CrewAI pipeline raises an unexpected error.
    """
    start_time: float = time.perf_counter()

    # ------------------------------------------------------------------
    # Step 1 — Resolve input text
    # ------------------------------------------------------------------
    regulation_text: str
    source: str

    if payload.file_path is not None:
        logger.info("PDF input received. Extracting text from: %s", payload.file_path)
        source = "file"
        processor = PDFProcessor()

        try:
            regulation_text = processor.extract_text(payload.file_path)
        except FileNotFoundError as exc:
            logger.error("PDF file not found: %s", payload.file_path)
            raise HTTPException(
                status_code=400,
                detail=f"PDF file not found at path: '{payload.file_path}'. "
                       "Ensure the path is accessible from the server's filesystem.",
            ) from exc
        except ValueError as exc:
            logger.error("PDF parsing error for '%s': %s", payload.file_path, exc)
            raise HTTPException(
                status_code=400,
                detail=f"Unable to parse PDF at '{payload.file_path}': {exc}",
            ) from exc
        except RuntimeError as exc:
            logger.error(
                "Unexpected error while extracting PDF text from '%s': %s",
                payload.file_path,
                exc,
            )
            raise HTTPException(
                status_code=500,
                detail=f"PDF text extraction failed unexpectedly: {exc}",
            ) from exc

        if not regulation_text.strip():
            raise HTTPException(
                status_code=400,
                detail=(
                    f"The PDF at '{payload.file_path}' produced no extractable text. "
                    "The file may be image-only or have restricted content permissions."
                ),
            )

        logger.info(
            "PDF text extraction complete. Characters extracted: %d",
            len(regulation_text),
        )

    else:
        # payload.raw_text is guaranteed non-None at this point by the validator.
        source = "raw_text"
        regulation_text = payload.raw_text  # type: ignore[assignment]
        logger.info(
            "Raw text input received. Characters: %d", len(regulation_text)
        )

    # ------------------------------------------------------------------
    # Step 2 — Instantiate and run the CrewAI pipeline
    # ------------------------------------------------------------------
    logger.info("Instantiating ComplianceCrew ...")

    try:
        crew_instance = ComplianceCrew()
    except RuntimeError as exc:
        logger.exception("ComplianceCrew could not be assembled: %s", exc)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initialise the AI agent pipeline: {exc}",
        ) from exc

    logger.info("Running compliance pipeline ...")

    try:
        report: str = crew_instance.run_pipeline(pdf_text=regulation_text)
    except ValueError as exc:
        # run_pipeline raises ValueError for empty text — shouldn't happen here
        # because we guard above, but include for defence in depth.
        logger.error("Pipeline rejected input text: %s", exc)
        raise HTTPException(
            status_code=400,
            detail=f"Pipeline rejected the input: {exc}",
        ) from exc
    except RuntimeError as exc:
        logger.exception("Pipeline execution failure: %s", exc)
        raise HTTPException(
            status_code=500,
            detail=f"AI orchestration pipeline failed during execution: {exc}",
        ) from exc
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unexpected error during pipeline execution: %s", exc)
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred in the AI pipeline: {exc}",
        ) from exc

    # ------------------------------------------------------------------
    # Step 3 — Build and return the response
    # ------------------------------------------------------------------
    elapsed: float = round(time.perf_counter() - start_time, 3)
    logger.info(
        "Pipeline completed in %.3fs. Report length: %d characters.",
        elapsed,
        len(report),
    )

    return RegulationResponse(
        status="success",
        source=source,
        input_characters=len(regulation_text),
        processing_time_seconds=elapsed,
        report=report,
    )


# ---------------------------------------------------------------------------
# Server entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info",
    )

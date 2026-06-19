"""
embedder.py
-----------
Gemini-based text embedding utilities for the RegintelVibeForge RAG pipeline.

Wraps LangChain's ``GoogleGenerativeAIEmbeddings`` to produce dense vector
representations of text chunks, ready for insertion into ChromaDB.

Classes:
    EmbeddingManager: Initialises the Gemini embedding model and exposes
                      single-text and batch embedding methods.

Dependencies:
    - langchain-google-genai==0.0.11   — see ai-agents/requirements.txt
    - python-dotenv >= 1.0.1           — see ai-agents/requirements.txt

Environment Variables:
    GOOGLE_API_KEY (required):
        A valid Google AI Studio / Vertex AI API key with access to the
        Generative AI embedding endpoints.  Load it via a ``.env`` file in
        the project root or export it directly in the shell before running.
"""

from __future__ import annotations

import logging
import os
from typing import List

from dotenv import load_dotenv

try:
    from langchain_google_genai import GoogleGenerativeAIEmbeddings
except ImportError as exc:  # pragma: no cover
    raise ImportError(
        "langchain-google-genai is required. "
        "Install it with: pip install langchain-google-genai"
    ) from exc

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Module-level constants
# ---------------------------------------------------------------------------

#: Default Gemini embedding model used when none is specified at construction.
DEFAULT_EMBEDDING_MODEL: str = "models/embedding-001"


class EmbeddingManager:
    """Manages Gemini text embeddings via LangChain's Google GenAI wrapper.

    On construction the manager:

    * Loads environment variables from a ``.env`` file (if present) using
      ``python-dotenv`` so callers do not need to set variables manually
      before importing this module.
    * Validates that ``GOOGLE_API_KEY`` is present in the environment.
    * Instantiates a :class:`GoogleGenerativeAIEmbeddings` client that is
      reused across all subsequent calls, avoiding repeated authentication
      overhead.

    Parameters
    ----------
    model:
        The Gemini embedding model identifier to use.
        Defaults to :data:`DEFAULT_EMBEDDING_MODEL`
        (``"models/embedding-001"``).
    dotenv_path:
        Optional explicit path to a ``.env`` file.  When ``None`` (default),
        :func:`dotenv.load_dotenv` searches upward from the current working
        directory using its standard discovery logic.

    Raises
    ------
    EnvironmentError
        If ``GOOGLE_API_KEY`` is absent from the environment after attempting
        to load the ``.env`` file.

    Example
    -------
    >>> manager = EmbeddingManager()
    >>> vector = manager.get_embedding("What is RAG?")
    >>> print(len(vector))   # typically 768 for embedding-001
    768
    >>> batch = manager.get_embeddings_batch(["chunk one", "chunk two"])
    >>> print(len(batch))
    2
    """

    def __init__(
        self,
        model: str = DEFAULT_EMBEDDING_MODEL,
        dotenv_path: str | None = None,
    ) -> None:
        # Load .env file credentials before any API call.
        load_dotenv(dotenv_path=dotenv_path, override=False)

        api_key: str | None = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise EnvironmentError(
                "GOOGLE_API_KEY is not set. "
                "Add it to your .env file or export it as a shell variable "
                "before using EmbeddingManager."
            )

        self._model: str = model
        logger.info("Initialising EmbeddingManager with model '%s'.", self._model)

        self._client: GoogleGenerativeAIEmbeddings = GoogleGenerativeAIEmbeddings(
            model=self._model,
            google_api_key=api_key,
        )
        logger.info("EmbeddingManager ready.")

    # ------------------------------------------------------------------
    # Properties
    # ------------------------------------------------------------------

    @property
    def model(self) -> str:
        """The Gemini embedding model identifier in use (read-only)."""
        return self._model

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get_embedding(self, text: str) -> List[float]:
        """Generate a vector embedding for a single text string.

        Parameters
        ----------
        text:
            The input string to embed.  Should be a non-empty, meaningful
            piece of text (e.g., a document chunk produced by
            :class:`~rag.parser.PDFProcessor`).

        Returns
        -------
        list[float]
            A dense float vector of fixed dimensionality (768 for
            ``models/embedding-001``).

        Raises
        ------
        TypeError
            If ``text`` is not a :class:`str`.
        ValueError
            If ``text`` is empty or contains only whitespace.
        RuntimeError
            If the Gemini API returns an error (e.g., quota exceeded,
            invalid key, network failure).  The original exception is
            chained for full traceback visibility.

        Example
        -------
        >>> manager = EmbeddingManager()
        >>> vec = manager.get_embedding("Regulatory intelligence overview")
        >>> isinstance(vec, list) and isinstance(vec[0], float)
        True
        """
        self._validate_text(text, param_name="text")

        logger.debug("Embedding single text (%d chars).", len(text))
        try:
            vector: List[float] = self._client.embed_query(text)
        except Exception as exc:
            raise RuntimeError(
                f"Failed to generate embedding for the provided text. "
                f"Cause: {exc}"
            ) from exc

        logger.debug("Single embedding generated. Dimension: %d.", len(vector))
        return vector

    # ------------------------------------------------------------------

    def get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate vector embeddings for a batch of text strings.

        Delegates to LangChain's ``embed_documents`` method, which handles
        batching and retry logic internally.  This is more efficient than
        calling :meth:`get_embedding` in a loop because it minimises the
        number of API round-trips.

        Parameters
        ----------
        texts:
            A non-empty list of strings to embed.  Each string must itself
            be non-empty.  The returned list preserves input order — i.e.,
            ``result[i]`` is the embedding of ``texts[i]``.

        Returns
        -------
        list[list[float]]
            A list of dense float vectors, one per input string.

        Raises
        ------
        TypeError
            If ``texts`` is not a list, or if any element is not a
            :class:`str`.
        ValueError
            If ``texts`` is empty, or if any element is an empty /
            whitespace-only string.
        RuntimeError
            If the Gemini API returns an error for any item in the batch.
            The original exception is chained for full traceback visibility.

        Example
        -------
        >>> manager = EmbeddingManager()
        >>> chunks = ["First paragraph text.", "Second paragraph text."]
        >>> vectors = manager.get_embeddings_batch(chunks)
        >>> len(vectors) == len(chunks)
        True
        """
        if not isinstance(texts, list):
            raise TypeError(
                f"'texts' must be a list, got {type(texts).__name__!r}."
            )

        if not texts:
            raise ValueError("'texts' must not be empty.")

        for idx, item in enumerate(texts):
            self._validate_text(item, param_name=f"texts[{idx}]")

        logger.debug("Embedding batch of %d text(s).", len(texts))
        try:
            vectors: List[List[float]] = self._client.embed_documents(texts)
        except Exception as exc:
            raise RuntimeError(
                f"Failed to generate batch embeddings for {len(texts)} text(s). "
                f"Cause: {exc}"
            ) from exc

        if len(vectors) != len(texts):
            raise RuntimeError(
                f"Embedding count mismatch: expected {len(texts)}, "
                f"got {len(vectors)} from the API."
            )

        logger.debug(
            "Batch embedding complete. %d vector(s) returned, dimension: %d.",
            len(vectors),
            len(vectors[0]) if vectors else 0,
        )
        return vectors

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _validate_text(text: str, param_name: str = "text") -> None:
        """Raise a descriptive error if *text* is not a non-empty string.

        Parameters
        ----------
        text:
            Value to validate.
        param_name:
            Name used in error messages to identify the offending parameter.

        Raises
        ------
        TypeError
            If ``text`` is not a :class:`str`.
        ValueError
            If ``text`` is empty or whitespace-only.
        """
        if not isinstance(text, str):
            raise TypeError(
                f"'{param_name}' must be a str, got {type(text).__name__!r}."
            )
        if not text.strip():
            raise ValueError(
                f"'{param_name}' must not be empty or whitespace-only."
            )

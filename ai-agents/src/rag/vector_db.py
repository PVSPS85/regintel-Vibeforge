"""
vector_db.py
------------
ChromaDB management utilities for the RegintelVibeForge RAG pipeline.

Provides a high-level interface for persisting, indexing, and retrieving
vectorised regulation chunks using a local ChromaDB instance.

Classes:
    ChromaManager: Wraps a persistent ChromaDB collection with add, upsert,
                   and similarity-query operations.

Dependencies:
    - chromadb==0.4.24    — see ai-agents/requirements.txt

Usage
-----
    from rag.vector_db import ChromaManager

    db = ChromaManager(persist_directory="./chroma_data")
    db.add_chunks(chunks, embeddings)
    results = db.query_similar(query_embedding, top_k=5)
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, cast

try:
    import chromadb
except ImportError as exc:  # pragma: no cover
    raise ImportError(
        "chromadb is required. Install it with: pip install chromadb"
    ) from exc

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Module-level constants
# ---------------------------------------------------------------------------

#: Default directory used for ChromaDB on-disk persistence.
DEFAULT_PERSIST_DIR: str = "./chroma_data"

#: Name of the ChromaDB collection that stores regulation chunks.
COLLECTION_NAME: str = "regintel_regulations"

#: Distance metric used when the collection is first created.
#: "cosine" normalises vectors before computing distance, making it
#: scale-invariant — the correct choice for embedding similarity tasks.
DISTANCE_METRIC: str = "cosine"


class ChromaManager:
    """Persistent ChromaDB client for regulation chunk storage and retrieval.

    On construction:

    * Creates (or re-opens) a persistent ChromaDB database at
      ``persist_directory`` on the local filesystem.
    * Gets or creates the ``regintel_regulations`` collection using cosine
      distance as the similarity metric.

    All public methods include try-except blocks that surface database locking
    or I/O errors as :class:`RuntimeError`, preserving the original cause via
    exception chaining.

    Parameters
    ----------
    persist_directory:
        Path to the local directory where ChromaDB stores its on-disk
        segment files.  The directory is created automatically if it does
        not exist.  Defaults to :data:`DEFAULT_PERSIST_DIR`.

    Raises
    ------
    RuntimeError
        If ChromaDB cannot initialise the persistent client (e.g., the
        directory is locked by another process or a permissions error
        prevents creation).

    Example
    -------
    >>> db = ChromaManager(persist_directory="./chroma_data")
    >>> db.add_chunks(chunks, embeddings)
    >>> results = db.query_similar(query_vec, top_k=3)
    """

    def __init__(self, persist_directory: str = DEFAULT_PERSIST_DIR) -> None:
        self._persist_directory: str = os.path.abspath(persist_directory)
        logger.info(
            "Initialising ChromaDB client at '%s'.", self._persist_directory
        )

        try:
            # chromadb.ClientAPI is not a public top-level symbol in 0.4.x;
            # use Any for the annotation to stay version-agnostic.
            self._client: Any = chromadb.PersistentClient(
                path=self._persist_directory,
            )
        except Exception as exc:
            raise RuntimeError(
                f"Failed to initialise ChromaDB at '{self._persist_directory}'. "
                f"Cause: {exc}"
            ) from exc

        try:
            self._collection: chromadb.Collection = (
                self._client.get_or_create_collection(
                    name=COLLECTION_NAME,
                    metadata={"hnsw:space": DISTANCE_METRIC},
                )
            )
            logger.info(
                "Collection '%s' ready (metric: %s). Current count: %d.",
                COLLECTION_NAME,
                DISTANCE_METRIC,
                self._collection.count(),
            )
        except Exception as exc:
            raise RuntimeError(
                f"Failed to get or create collection '{COLLECTION_NAME}'. "
                f"Cause: {exc}"
            ) from exc

    # ------------------------------------------------------------------
    # Properties
    # ------------------------------------------------------------------

    @property
    def persist_directory(self) -> str:
        """Absolute path to the ChromaDB persistence directory (read-only)."""
        return self._persist_directory

    @property
    def collection_name(self) -> str:
        """Name of the active ChromaDB collection (read-only)."""
        return self._collection.name

    @property
    def count(self) -> int:
        """Number of documents currently stored in the collection."""
        return self._collection.count()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def add_chunks(
        self,
        chunks: List[Dict[str, Any]],
        embeddings: List[List[float]],
    ) -> None:
        """Upsert text chunks and their pre-computed embeddings into ChromaDB.

        Extracts ``chunk_id``, ``content``, and ``metadata`` from each chunk
        dictionary, then calls ChromaDB's ``upsert`` method so that
        re-ingesting the same document is idempotent — existing records with
        the same ``chunk_id`` are updated rather than duplicated.

        Parameters
        ----------
        chunks:
            An ordered list of chunk dictionaries as produced by
            :meth:`~rag.parser.PDFProcessor.chunk_text`.  Each dict **must**
            contain:

            * ``"chunk_id"`` (:class:`str`) — unique identifier for the chunk.
            * ``"content"``  (:class:`str`) — raw text of the chunk.
            * ``"metadata"`` (:class:`dict`) — provenance markers; values must
              be ChromaDB-compatible scalar types (``str``, ``int``,
              ``float``, or ``bool``).

        embeddings:
            A 2-D list of floats where ``embeddings[i]`` is the vector for
            ``chunks[i]``.  Must have the same length as ``chunks``.

        Raises
        ------
        TypeError
            If ``chunks`` or ``embeddings`` are not lists, or if any chunk
            entry is not a dict.
        ValueError
            If ``chunks`` is empty, or if ``len(chunks) != len(embeddings)``,
            or if any chunk dict is missing a required key.
        RuntimeError
            If ChromaDB raises an I/O, locking, or serialisation error during
            the upsert operation.

        Example
        -------
        >>> db = ChromaManager()
        >>> db.add_chunks(chunks, embeddings)
        >>> print(db.count)
        42
        """
        self._validate_chunks_and_embeddings(chunks, embeddings)

        ids: List[str] = []
        documents: List[str] = []
        metadatas: List[Dict[str, Any]] = []

        for idx, chunk in enumerate(chunks):
            for key in ("chunk_id", "content", "metadata"):
                if key not in chunk:
                    raise ValueError(
                        f"chunks[{idx}] is missing required key '{key}'."
                    )

            ids.append(str(chunk["chunk_id"]))
            documents.append(chunk["content"])
            # Flatten metadata values to ChromaDB-safe scalar types.
            metadatas.append(self._sanitise_metadata(chunk["metadata"], idx))

        logger.info(
            "Upserting %d chunk(s) into collection '%s'.", len(ids), COLLECTION_NAME
        )

        try:
            self._collection.upsert(
                ids=ids,
                documents=documents,
                embeddings=cast(Any, embeddings),
                metadatas=cast(Any, metadatas),
            )
            logger.info(
                "Upsert complete. Collection now holds %d document(s).",
                self._collection.count(),
            )
        except Exception as exc:
            raise RuntimeError(
                f"ChromaDB upsert failed for {len(ids)} chunk(s). "
                f"Cause: {exc}"
            ) from exc

    # ------------------------------------------------------------------

    def query_similar(
        self,
        query_embedding: List[float],
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """Retrieve the top-k most similar chunks for a query vector.

        Submits ``query_embedding`` to ChromaDB's ANN index and returns a
        structured list of result dictionaries.  Results are ordered by
        ascending cosine distance (i.e., the most similar chunk is first).

        Parameters
        ----------
        query_embedding:
            A 1-D list of floats representing the query vector.  Must be the
            same dimensionality as the vectors stored in the collection.
        top_k:
            Number of nearest neighbours to retrieve.  Defaults to ``5``.
            Capped internally at the current collection size to avoid
            ChromaDB errors on small collections.

        Returns
        -------
        list[dict]
            An ordered list (closest first) of result dictionaries, each
            containing:

            ``id`` : str
                The ``chunk_id`` of the matching chunk.
            ``content`` : str
                The raw text of the matching chunk.
            ``metadata`` : dict
                The provenance metadata stored alongside the chunk.
            ``distance`` : float
                The cosine distance between the query vector and this chunk's
                vector.  Lower is more similar (0.0 = identical).

        Raises
        ------
        TypeError
            If ``query_embedding`` is not a list of floats.
        ValueError
            If ``query_embedding`` is empty or ``top_k`` is not a positive
            integer.
        RuntimeError
            If ChromaDB raises an error during the query (e.g., index
            corruption, I/O failure).

        Example
        -------
        >>> results = db.query_similar(query_vec, top_k=3)
        >>> for r in results:
        ...     print(r["id"], r["distance"], r["content"][:60])
        """
        self._validate_query_embedding(query_embedding)

        if not isinstance(top_k, int) or top_k < 1:
            raise ValueError(
                f"'top_k' must be a positive integer, got {top_k!r}."
            )

        # Clamp top_k to the actual collection size to prevent ChromaDB errors.
        current_count = self._collection.count()
        effective_k = min(top_k, current_count)

        if effective_k == 0:
            logger.warning(
                "query_similar called on an empty collection; returning []."
            )
            return []

        if effective_k < top_k:
            logger.warning(
                "top_k=%d exceeds collection size (%d); clamping to %d.",
                top_k,
                current_count,
                effective_k,
            )

        logger.debug(
            "Querying collection '%s' for top-%d neighbours.",
            COLLECTION_NAME,
            effective_k,
        )

        try:
            raw: Dict[str, Any] = cast(
                Dict[str, Any],
                self._collection.query(
                    query_embeddings=cast(Any, [query_embedding]),
                    n_results=effective_k,
                    include=["documents", "metadatas", "distances"],
                ),
            )
        except Exception as exc:
            raise RuntimeError(
                f"ChromaDB query failed. Cause: {exc}"
            ) from exc

        # Unpack the nested lists that ChromaDB returns for batch queries.
        # We submitted a single query embedding, so index [0] gives our results.
        result_ids: List[str] = raw.get("ids", [[]])[0]
        result_docs: List[str] = raw.get("documents", [[]])[0]
        result_metas: List[Dict[str, Any]] = raw.get("metadatas", [[]])[0]
        result_dists: List[float] = raw.get("distances", [[]])[0]

        results: List[Dict[str, Any]] = [
            {
                "id": result_ids[i],
                "content": result_docs[i],
                "metadata": result_metas[i] if i < len(result_metas) else {},
                "distance": result_dists[i] if i < len(result_dists) else None,
            }
            for i in range(len(result_ids))
        ]

        logger.debug("Query returned %d result(s).", len(results))
        return results

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _validate_chunks_and_embeddings(
        chunks: List[Dict[str, Any]],
        embeddings: List[List[float]],
    ) -> None:
        """Validate that chunks and embeddings are non-empty, parallel lists.

        Parameters
        ----------
        chunks:
            The chunks list to validate.
        embeddings:
            The embeddings list to validate.

        Raises
        ------
        TypeError
            If either argument is not a list, or any chunk is not a dict.
        ValueError
            If either list is empty or their lengths differ.
        """
        if not isinstance(chunks, list):
            raise TypeError(
                f"'chunks' must be a list, got {type(chunks).__name__!r}."
            )
        if not isinstance(embeddings, list):
            raise TypeError(
                f"'embeddings' must be a list, got {type(embeddings).__name__!r}."
            )
        if not chunks:
            raise ValueError("'chunks' must not be empty.")
        if not embeddings:
            raise ValueError("'embeddings' must not be empty.")
        if len(chunks) != len(embeddings):
            raise ValueError(
                f"'chunks' and 'embeddings' must have the same length. "
                f"Got {len(chunks)} chunk(s) and {len(embeddings)} embedding(s)."
            )
        for idx, chunk in enumerate(chunks):
            if not isinstance(chunk, dict):
                raise TypeError(
                    f"chunks[{idx}] must be a dict, "
                    f"got {type(chunk).__name__!r}."
                )

    @staticmethod
    def _validate_query_embedding(query_embedding: List[float]) -> None:
        """Validate that query_embedding is a non-empty list of numbers.

        Parameters
        ----------
        query_embedding:
            The vector to validate.

        Raises
        ------
        TypeError
            If ``query_embedding`` is not a list, or contains non-numeric values.
        ValueError
            If ``query_embedding`` is empty.
        """
        if not isinstance(query_embedding, list):
            raise TypeError(
                f"'query_embedding' must be a list, "
                f"got {type(query_embedding).__name__!r}."
            )
        if not query_embedding:
            raise ValueError("'query_embedding' must not be empty.")
        if not all(isinstance(v, (int, float)) for v in query_embedding):
            raise TypeError(
                "'query_embedding' must contain only numeric (int/float) values."
            )

    @staticmethod
    def _sanitise_metadata(
        metadata: Dict[str, Any],
        chunk_index: int,
    ) -> Dict[str, Any]:
        """Convert metadata values to ChromaDB-safe scalar types.

        ChromaDB only accepts ``str``, ``int``, ``float``, or ``bool`` as
        metadata values.  Any other type is serialised to its string
        representation so that no metadata is silently dropped.

        Parameters
        ----------
        metadata:
            Raw metadata dict from a chunk.
        chunk_index:
            The position of the chunk in the input list, used only for
            warning messages.

        Returns
        -------
        dict
            A shallow copy of ``metadata`` with all values coerced to
            ChromaDB-compatible scalar types.
        """
        safe: Dict[str, Any] = {}
        for key, value in metadata.items():
            if isinstance(value, (str, int, float, bool)):
                safe[key] = value
            else:
                logger.warning(
                    "chunks[%d].metadata[%r] has unsupported type %r; "
                    "coercing to str.",
                    chunk_index,
                    key,
                    type(value).__name__,
                )
                safe[key] = str(value)
        return safe

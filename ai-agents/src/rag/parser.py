"""
parser.py
---------
PDF text extraction and semantic chunking utilities for the RegintelVibeForge
RAG pipeline.

Classes:
    PDFProcessor: Handles PDF loading, text extraction, and windowed chunking.

Dependencies:
    - PyMuPDF (fitz) >= 1.24.5  — see ai-agents/requirements.txt
"""

from __future__ import annotations

import hashlib
import logging
import os
from typing import List, Dict, Any

try:
    import fitz  # PyMuPDF
except ImportError as exc:  # pragma: no cover
    raise ImportError(
        "PyMuPDF is required. Install it with: pip install pymupdf"
    ) from exc

logger = logging.getLogger(__name__)


class PDFProcessor:
    """Utility class for extracting and chunking text from PDF documents.

    This class provides two core capabilities used by the RAG ingestion
    pipeline:

    1.  ``extract_text`` – reads every page of a PDF via PyMuPDF and
        concatenates the content into a single, clean string.
    2.  ``chunk_text`` – splits that string into overlapping fixed-size
        windows, returning each window as a structured dictionary that
        downstream embedding and retrieval stages can consume directly.

    Example
    -------
    >>> processor = PDFProcessor()
    >>> raw_text = processor.extract_text("docs/sample.pdf")
    >>> chunks   = processor.chunk_text(raw_text, chunk_size=500, chunk_overlap=50)
    >>> for chunk in chunks[:3]:
    ...     print(chunk["chunk_id"], chunk["metadata"]["char_start"])
    """

    # ------------------------------------------------------------------
    # Public helpers
    # ------------------------------------------------------------------

    def extract_text(self, file_path: str) -> str:
        """Extract the full text content from a PDF file.

        Iterates over every page in the document using PyMuPDF's ``get_text``
        method (plain-text mode) and joins the pages with a single newline
        separator.

        Parameters
        ----------
        file_path:
            Absolute or relative path to the target ``.pdf`` file.

        Returns
        -------
        str
            The concatenated plain-text content of all pages.  Empty pages
            contribute an empty string (no extra blank lines are injected).

        Raises
        ------
        FileNotFoundError
            If ``file_path`` does not point to an existing file.
        ValueError
            If the path exists but PyMuPDF cannot open it as a valid PDF
            (e.g., the file is corrupt or password-protected).
        RuntimeError
            For any unexpected low-level error during page iteration.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(
                f"PDF file not found: '{file_path}'"
            )

        if not os.path.isfile(file_path):
            raise ValueError(
                f"Path is not a regular file: '{file_path}'"
            )

        logger.info("Opening PDF: %s", file_path)

        try:
            document: fitz.Document = fitz.open(file_path)
        except fitz.FileDataError as exc:
            raise ValueError(
                f"Unable to open '{file_path}' as a PDF. "
                "The file may be corrupt or password-protected."
            ) from exc
        except Exception as exc:
            raise RuntimeError(
                f"Unexpected error while opening '{file_path}': {exc}"
            ) from exc

        page_texts: List[str] = []

        try:
            total_pages = len(document)
            logger.info("Extracting text from %d page(s).", total_pages)

            for page_index in range(total_pages):
                try:
                    page: fitz.Page = document.load_page(page_index)
                    page_text: str = page.get_text("text")  # plain-text mode
                    page_texts.append(page_text)
                except Exception as exc:  # noqa: BLE001
                    logger.warning(
                        "Skipping page %d due to error: %s", page_index, exc
                    )
                    page_texts.append("")  # keep page count consistent
        finally:
            document.close()

        full_text: str = "\n".join(page_texts).strip()
        if len(full_text.split()) == 0:
            raise ValueError(
                f"Extracted 0 words from PDF '{file_path}'. The document appears to be image-only, empty, or unreadable."
            )

        logger.info(
            "Extraction complete. Total characters: %d", len(full_text)
        )
        return full_text

    # ------------------------------------------------------------------

    def chunk_text(
        self,
        text: str,
        chunk_size: int = 500,
        chunk_overlap: int = 50,
    ) -> List[Dict[str, Any]]:
        """Split a text string into overlapping fixed-size word windows.

        Uses a sliding-window approach over the token (word) list.  Each
        window advances by ``chunk_size - chunk_overlap`` words, so
        consecutive chunks share the trailing ``chunk_overlap`` words of the
        previous chunk.  This preserves cross-boundary context for embedding
        and retrieval.

        Parameters
        ----------
        text:
            The raw text string to be chunked (typically the output of
            :meth:`extract_text`).
        chunk_size:
            Maximum number of words per chunk.  Defaults to ``500``.
        chunk_overlap:
            Number of words from the end of each chunk to repeat at the
            beginning of the next chunk.  Must be strictly less than
            ``chunk_size``.  Defaults to ``50``.

        Returns
        -------
        list[dict]
            An ordered list of chunk dictionaries.  Each dictionary has the
            following keys:

            ``chunk_id`` : str
                A stable SHA-256 hex digest of the chunk content, prefixed
                with the zero-padded sequential index (e.g.
                ``"0000_a3f9..."``) .  Combining index and content hash makes
                the ID both ordered and collision-resistant.
            ``content`` : str
                The raw text of the chunk (words joined by a single space).
            ``metadata`` : dict
                Provenance markers:

                * ``char_start`` (int) - character offset of the first word's
                  start in the original ``text`` string.
                * ``char_end``   (int) - character offset one past the last
                  character of the chunk in the original ``text`` string.
                * ``word_start`` (int) - index of the first word in the
                  global word list.
                * ``word_end``   (int) - exclusive index of the last word in
                  the global word list.
                * ``word_count`` (int) - number of words in this chunk.

        Raises
        ------
        ValueError
            If ``chunk_overlap`` is greater than or equal to ``chunk_size``,
            which would cause an infinite loop.
        TypeError
            If ``text`` is not a string.
        """
        if not isinstance(text, str):
            raise TypeError(
                f"'text' must be a str, got {type(text).__name__!r}."
            )

        if chunk_overlap >= chunk_size:
            raise ValueError(
                f"'chunk_overlap' ({chunk_overlap}) must be strictly less "
                f"than 'chunk_size' ({chunk_size})."
            )

        if not text.strip():
            logger.warning("chunk_text received an empty or whitespace-only string.")
            return []

        # Tokenise on whitespace while tracking original character positions.
        words: List[str] = []
        char_offsets: List[int] = []  # start offset in `text` for each word

        cursor = 0
        for token in text.split(" "):
            # split(" ") may produce empty strings from multiple spaces.
            if token == "":
                cursor += 1  # account for the space itself
                continue
            # Handle embedded newlines: keep the token as-is but record offset.
            char_offsets.append(cursor)
            words.append(token)
            cursor += len(token) + 1  # +1 for the space delimiter

        total_words = len(words)
        if total_words == 0:
            return []

        stride = chunk_size - chunk_overlap
        chunks: List[Dict[str, Any]] = []
        chunk_index = 0
        word_pos = 0

        while word_pos < total_words:
            word_end = min(word_pos + chunk_size, total_words)
            chunk_words = words[word_pos:word_end]
            content = " ".join(chunk_words)

            # Character-level boundary tracking.
            char_start: int = char_offsets[word_pos]
            last_word_idx = word_end - 1
            char_end: int = char_offsets[last_word_idx] + len(words[last_word_idx])

            # Stable, collision-resistant identifier.
            content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
            chunk_id = f"{chunk_index:04d}_{content_hash}"

            chunks.append(
                {
                    "chunk_id": chunk_id,
                    "content": content,
                    "metadata": {
                        "char_start": char_start,
                        "char_end": char_end,
                        "word_start": word_pos,
                        "word_end": word_end,
                        "word_count": len(chunk_words),
                    },
                }
            )

            chunk_index += 1
            word_pos += stride

        logger.info(
            "Chunking complete. Produced %d chunk(s) "
            "(chunk_size=%d, chunk_overlap=%d).",
            len(chunks),
            chunk_size,
            chunk_overlap,
        )
        return chunks

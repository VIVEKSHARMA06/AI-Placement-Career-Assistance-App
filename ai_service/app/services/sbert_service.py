"""Reusable SBERT embedding and similarity core service.

Designed for reuse by Member 1 (Job Recommendation) and Member 2
(Higher-Education Recommendation). Uses sentence-transformers
(all-MiniLM-L6-v2) with L2-normalized embeddings for fast cosine similarity.

Public API:
    - encode_texts(texts: list[str]) -> np.ndarray
    - encode_single(text: str) -> np.ndarray
    - compute_similarity(query_embedding: np.ndarray, corpus_embeddings: np.ndarray) -> np.ndarray
    - rank_items(query_text: str, items: list[dict], corpus_embeddings: np.ndarray, top_k: int) -> list[dict]
    - profile_to_query_string(profile: CandidateProfile | dict) -> str
"""
from __future__ import annotations

import logging
from functools import lru_cache
from typing import TYPE_CHECKING, Any

import numpy as np
from sentence_transformers import SentenceTransformer

if TYPE_CHECKING:
    from app.schemas.candidate_profile import CandidateProfile

logger = logging.getLogger(__name__)

DEFAULT_SBERT_MODEL = "all-MiniLM-L6-v2"


@lru_cache(maxsize=1)
def get_sbert_model(model_name: str = DEFAULT_SBERT_MODEL) -> SentenceTransformer:
    """Load and cache the SBERT SentenceTransformer model instance."""
    logger.info("Initializing SBERT model '%s'...", model_name)
    return SentenceTransformer(model_name)


def encode_texts(
    texts: list[str],
    model_name: str = DEFAULT_SBERT_MODEL,
    batch_size: int = 32,
) -> np.ndarray:
    """Encode a list of text strings into L2-normalized embeddings.

    Args:
        texts: List of text strings to embed.
        model_name: Model identifier (default: all-MiniLM-L6-v2).
        batch_size: Batch size for encoding.

    Returns:
        np.ndarray of shape [len(texts), D], dtype float32, L2-normalized.
    """
    if not texts:
        return np.empty((0, 384), dtype=np.float32)

    model = get_sbert_model(model_name)
    embeddings = model.encode(
        texts,
        batch_size=batch_size,
        show_progress_bar=False,
        normalize_embeddings=True,
    )
    return np.asarray(embeddings, dtype=np.float32)


def encode_single(
    text: str,
    model_name: str = DEFAULT_SBERT_MODEL,
) -> np.ndarray:
    """Encode a single text string into an L2-normalized 1D vector.

    Args:
        text: Text string to embed.
        model_name: Model identifier.

    Returns:
        np.ndarray of shape [D], dtype float32, L2-normalized.
    """
    return encode_texts([text], model_name=model_name)[0]


def compute_similarity(
    query_embedding: np.ndarray,
    corpus_embeddings: np.ndarray,
) -> np.ndarray:
    """Compute cosine similarities between a query embedding and corpus embeddings.

    Because embeddings are L2-normalized, cosine similarity equals the dot product.

    Args:
        query_embedding: 1D array of shape [D] or 2D array of shape [1, D].
        corpus_embeddings: 2D array of shape [N, D].

    Returns:
        1D array of shape [N] with cosine similarities in [-1, 1].
    """
    if corpus_embeddings.size == 0:
        return np.empty(0, dtype=np.float32)

    q = np.asarray(query_embedding, dtype=np.float32).ravel()
    corpus = np.asarray(corpus_embeddings, dtype=np.float32)

    # Dot product of unit vectors = cosine similarity
    similarities = np.dot(corpus, q)
    return np.clip(similarities, -1.0, 1.0)


def rank_items(
    query_text: str,
    items: list[dict[str, Any]],
    corpus_embeddings: np.ndarray,
    top_k: int = 10,
    model_name: str = DEFAULT_SBERT_MODEL,
) -> list[dict[str, Any]]:
    """Rank a list of items against a query text by semantic similarity.

    Args:
        query_text: Free-text candidate query or resume text.
        items: List of dictionary records (must correspond 1:1 with corpus_embeddings rows).
        corpus_embeddings: Precomputed 2D array of shape [len(items), D].
        top_k: Number of highest-ranking items to return.
        model_name: Model identifier.

    Returns:
        List of dicts: each containing the original item fields plus 'similarityScore' (float in [-1, 1]),
        sorted by similarityScore in descending order.
    """
    if len(items) != len(corpus_embeddings):
        raise ValueError(
            f"Items count ({len(items)}) must match corpus embeddings rows ({len(corpus_embeddings)})."
        )

    if not items or top_k <= 0:
        return []

    query_vec = encode_single(query_text, model_name=model_name)
    similarities = compute_similarity(query_vec, corpus_embeddings)

    k = min(top_k, len(items))
    top_indices = np.argsort(similarities)[::-1][:k]

    results = []
    for idx in top_indices:
        item_copy = dict(items[idx])
        item_copy["similarityScore"] = float(similarities[idx])
        results.append(item_copy)

    return results


def profile_to_query_string(profile: Any) -> str:
    """Convert a CandidateProfile (or dict) into a rich semantic query string.

    Prioritizes skills, experience, projects, summary, and education
    to yield optimal semantic retrieval from SBERT.

    Args:
        profile: CandidateProfile instance or equivalent dictionary.

    Returns:
        Consolidated query string for semantic embedding.
    """
    if profile is None:
        return ""

    # Support both Pydantic models and plain dicts
    if hasattr(profile, "model_dump"):
        data = profile.model_dump()
    elif hasattr(profile, "dict"):
        data = profile.dict()
    elif isinstance(profile, dict):
        data = profile
    else:
        return str(profile)

    parts: list[str] = []

    # 1. Summary
    summary = data.get("summary")
    if summary and isinstance(summary, str) and summary.strip():
        parts.append(summary.strip())

    # 2. Skills (weighted heavily in text)
    skills = data.get("skills") or []
    if isinstance(skills, list) and skills:
        clean_skills = [str(s).strip() for s in skills if str(s).strip()]
        if clean_skills:
            parts.append("Technical Skills: " + ", ".join(clean_skills))

    # 3. Experience
    experience = data.get("experience") or []
    if isinstance(experience, list):
        for exp in experience:
            if isinstance(exp, dict):
                role = exp.get("role", "")
                company = exp.get("company", "")
                desc = exp.get("description", "")
                tech = exp.get("technologies") or []
                exp_line = f"Experience: {role} at {company}. {desc}".strip()
                if tech:
                    exp_line += " Technologies used: " + ", ".join(str(t) for t in tech)
                if exp_line.strip():
                    parts.append(exp_line)

    # 4. Projects
    projects = data.get("projects") or []
    if isinstance(projects, list):
        for proj in projects:
            if isinstance(proj, dict):
                title = proj.get("title", "")
                desc = proj.get("description", "")
                tech = proj.get("technologies") or []
                proj_line = f"Project: {title}. {desc}".strip()
                if tech:
                    proj_line += " Tools: " + ", ".join(str(t) for t in tech)
                if proj_line.strip():
                    parts.append(proj_line)

    # 5. Education
    education = data.get("education") or []
    if isinstance(education, list):
        for edu in education:
            if isinstance(edu, dict):
                degree = edu.get("degree", "")
                field = edu.get("field", "")
                inst = edu.get("institution", "")
                edu_line = f"Education: {degree} in {field} from {inst}.".strip()
                if edu_line.strip():
                    parts.append(edu_line)

    # 6. Certifications
    certs = data.get("certifications") or []
    if isinstance(certs, list) and certs:
        clean_certs = [str(c).strip() for c in certs if str(c).strip()]
        if clean_certs:
            parts.append("Certifications: " + ", ".join(clean_certs))

    return "\n\n".join(parts)

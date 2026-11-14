"""Job Recommendation Engine using SBERT semantic matching.

Matches candidate resume text (or structured profile) against 75 realistic
job roles from job_roles.json using SBERT cosine similarities. Computes
matched skills, missing skills (skill gap analysis), and grounded explanations.
"""
from __future__ import annotations

import json
import logging
import re
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np

from app.services.sbert_service import compute_similarity, encode_single

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATASETS_DIR = BASE_DIR / "datasets"
JOB_ROLES_PATH = DATASETS_DIR / "job_roles.json"
EMBEDDINGS_PATH = DATASETS_DIR / "job_embeddings.npy"


@lru_cache(maxsize=1)
def load_job_dataset() -> tuple[list[dict[str, Any]], np.ndarray]:
    """Load job roles and their corresponding SBERT embeddings into memory.

    Auto-generates job_embeddings.npy if missing.
    """
    if not JOB_ROLES_PATH.exists():
        raise FileNotFoundError(f"Job roles dataset missing at {JOB_ROLES_PATH}")

    with JOB_ROLES_PATH.open("r", encoding="utf-8") as f:
        job_roles = json.load(f)

    if not isinstance(job_roles, list) or len(job_roles) == 0:
        raise ValueError("job_roles.json is empty or invalid.")

    if not EMBEDDINGS_PATH.exists():
        logger.warning("job_embeddings.npy not found. Generating now...")
        from prepare_job_embeddings import prepare_job_embeddings

        embeddings = prepare_job_embeddings(JOB_ROLES_PATH, EMBEDDINGS_PATH)
    else:
        embeddings = np.load(str(EMBEDDINGS_PATH))

    if len(job_roles) != len(embeddings):
        logger.warning(
            "Dataset length (%d) mismatch with embeddings (%d). Rebuilding...",
            len(job_roles),
            len(embeddings),
        )
        from prepare_job_embeddings import prepare_job_embeddings

        embeddings = prepare_job_embeddings(JOB_ROLES_PATH, EMBEDDINGS_PATH, force_rebuild=True)

    return job_roles, embeddings


def _normalize_skill(skill: str) -> str:
    """Normalize skill string for case-insensitive keyword matching."""
    s = skill.lower().strip()
    s = re.sub(r"[^\w\s\+\#\.\-]", "", s)
    return s


def extract_matched_and_missing_skills(
    candidate_text: str,
    required_skills: list[str],
    preferred_skills: list[str] | None = None,
) -> tuple[list[str], list[str]]:
    """Determine matched and missing skills between candidate text and role requirements.

    Args:
        candidate_text: English resume text or profile string.
        required_skills: List of required skill strings from the role.
        preferred_skills: Optional list of preferred skills.

    Returns:
        tuple of (matched_skills, missing_skills).
    """
    lower_text = candidate_text.lower()
    matched: list[str] = []
    missing: list[str] = []

    all_role_skills = list(required_skills)
    if preferred_skills:
        all_role_skills.extend(preferred_skills)

    for skill in all_role_skills:
        clean = _normalize_skill(skill)
        if not clean:
            continue
        # Check boundary or substring
        pattern = r"(?:^|\W)" + re.escape(clean) + r"(?:$|\W)"
        if re.search(pattern, lower_text):
            if skill not in matched:
                matched.append(skill)
        else:
            if skill in required_skills and skill not in missing:
                missing.append(skill)

    return matched, missing


def generate_explanation(
    title: str,
    similarity_score_pct: float,
    matched_skills: list[str],
    missing_skills: list[str],
) -> str:
    """Generate a concise, grounded explanation for why this role fits the candidate."""
    parts: list[str] = [
        f"Strong semantic alignment with {title} ({similarity_score_pct:.1f}% match)."
    ]
    if matched_skills:
        highlight = matched_skills[:4]
        parts.append(f"Demonstrated core skills: {', '.join(highlight)}.")
    if missing_skills:
        gap = missing_skills[:3]
        parts.append(f"Growth opportunity: developing {', '.join(gap)} would enhance candidate fit.")
    else:
        parts.append("Candidate profile meets the key skill requirements for this position.")

    return " ".join(parts)


def recommend_jobs(
    resume_text: str,
    top_k: int = 10,
) -> list[dict[str, Any]]:
    """Recommend top-K job roles based on semantic similarity to candidate resume text.

    Args:
        resume_text: Clean English resume text or structured profile query string.
        top_k: Number of recommendations to return (default: 10, max: 50).

    Returns:
        List of recommendation records containing:
            roleId, title, category, experienceLevel, similarityScore,
            matchedSkills, missingSkills, explanation.
    """
    if not resume_text or not resume_text.strip():
        raise ValueError("Resume text is required for job recommendations.")

    job_roles, corpus_embeddings = load_job_dataset()

    # Compute query embedding and similarities
    query_vec = encode_single(resume_text.strip())
    raw_similarities = compute_similarity(query_vec, corpus_embeddings)

    k = min(max(1, top_k), len(job_roles))
    top_indices = np.argsort(raw_similarities)[::-1][:k]

    recommendations: list[dict[str, Any]] = []

    for idx in top_indices:
        role = job_roles[idx]
        raw_sim = float(raw_similarities[idx])

        # Convert cosine similarity (-1 to 1) to a normalized 0-100 percentage score
        # Cosine similarity for semantic texts typically ranges between 0.1 to 0.9
        score_pct = round(max(0.0, min(100.0, ((raw_sim + 1.0) / 2.0) * 100.0)), 2)

        matched, missing = extract_matched_and_missing_skills(
            candidate_text=resume_text,
            required_skills=role.get("requiredSkills", []),
            preferred_skills=role.get("preferredSkills", []),
        )

        explanation = generate_explanation(
            title=role.get("title", "Role"),
            similarity_score_pct=score_pct,
            matched_skills=matched,
            missing_skills=missing,
        )

        recommendations.append({
            "roleId": role.get("roleId"),
            "title": role.get("title"),
            "category": role.get("category"),
            "experienceLevel": role.get("experienceLevel"),
            "similarityScore": score_pct,
            "matchedSkills": matched,
            "missingSkills": missing,
            "explanation": explanation,
        })

    return recommendations

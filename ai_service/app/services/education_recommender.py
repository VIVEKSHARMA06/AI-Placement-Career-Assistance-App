"""SBERT-based recommendations from the education program catalog."""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np

from app.services.sbert_service import compute_similarity, encode_texts, encode_single

CATALOG_PATH = Path(__file__).resolve().parents[2] / "datasets" / "education_programs.json"


@lru_cache(maxsize=1)
def load_education_programs() -> tuple[dict[str, Any], ...]:
    if not CATALOG_PATH.is_file():
        raise FileNotFoundError(f"Education program catalog missing: {CATALOG_PATH}")
    with CATALOG_PATH.open("r", encoding="utf-8") as catalog_file:
        programs = json.load(catalog_file)
    if not isinstance(programs, list) or not programs:
        raise ValueError("Education program catalog must be a non-empty JSON list.")
    if any(not isinstance(program, dict) for program in programs):
        raise ValueError("Every education catalog entry must be an object.")
    return tuple(programs)


def _program_text(program: dict[str, Any]) -> str:
    skills = program.get("relevantSkills", [])
    return " ".join(
        str(value)
        for value in (
            program.get("program"),
            program.get("field"),
            program.get("description"),
            program.get("eligibility"),
            " ".join(skills) if isinstance(skills, list) else skills,
        )
        if value
    )


@lru_cache(maxsize=1)
def _catalog_embeddings() -> np.ndarray:
    programs = load_education_programs()
    return encode_texts([_program_text(program) for program in programs])


def recommend_education(resume_text: str, top_k: int = 10) -> list[dict[str, Any]]:
    """Rank study pathways against resume text with Member 1's cached SBERT model."""
    if not resume_text or not resume_text.strip():
        raise ValueError("Resume text is required for education recommendations.")
    if top_k < 1:
        raise ValueError("top_k must be at least 1.")

    programs = load_education_programs()
    similarities = compute_similarity(encode_single(resume_text.strip()), _catalog_embeddings())
    indices = np.argsort(similarities)[::-1][: min(top_k, len(programs))]
    results: list[dict[str, Any]] = []
    for index in indices:
        program = dict(programs[int(index)])
        score = round(float(np.clip((float(similarities[index]) + 1.0) * 50.0, 0.0, 100.0)), 2)
        program["matchScore"] = score
        program["similarityScore"] = score
        results.append(program)
    return results
"""Deterministic text features shared by model training and inference."""
from __future__ import annotations

import json
import re
from collections.abc import Iterable

import numpy as np

FEATURE_NAMES = (
    "resume_token_count",
    "job_token_count",
    "resume_unique_token_count",
    "job_unique_token_count",
    "shared_token_count",
    "job_token_coverage",
    "resume_token_coverage",
    "token_jaccard",
    "resume_length_chars",
    "job_length_chars",
)

_TOKEN_PATTERN = re.compile(r"[a-z0-9][a-z0-9+#.\-]*", re.IGNORECASE)
_STOP_WORDS = frozenset(
    "a an and are as at be by for from in into is it of on or that the to with".split()
)


def _as_text(value: object) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, Iterable) and not isinstance(value, (bytes, dict)):
        return " ".join(str(item) for item in value if item is not None)
    return str(value)


def tokenize(text: str) -> list[str]:
    """Normalize text to useful lowercase terms."""
    return [
        token
        for token in _TOKEN_PATTERN.findall(text.casefold())
        if len(token) > 1 and token not in _STOP_WORDS
    ]


def build_feature_map(
    resume_text: object,
    job_text: object,
    resume_skills: object = None,
    required_skills: object = None,
) -> dict[str, float]:
    """Build named lexical and length features from resume/job text."""
    resume = _as_text(resume_text)
    job = _as_text(job_text)
    resume_skill_text = _as_text(resume_skills)
    required_skill_text = _as_text(required_skills)

    resume_terms = tokenize(f"{resume} {resume_skill_text}")
    job_terms = tokenize(f"{job} {required_skill_text}")
    resume_unique = set(resume_terms)
    job_unique = set(job_terms)
    shared = resume_unique & job_unique
    union = resume_unique | job_unique

    return {
        "resume_token_count": float(len(resume_terms)),
        "job_token_count": float(len(job_terms)),
        "resume_unique_token_count": float(len(resume_unique)),
        "job_unique_token_count": float(len(job_unique)),
        "shared_token_count": float(len(shared)),
        "job_token_coverage": len(shared) / len(job_unique) if job_unique else 0.0,
        "resume_token_coverage": len(shared) / len(resume_unique) if resume_unique else 0.0,
        "token_jaccard": len(shared) / len(union) if union else 0.0,
        "resume_length_chars": float(len(resume)),
        "job_length_chars": float(len(job)),
    }


def build_feature_vector(
    resume_text: object,
    job_text: object,
    resume_skills: object = None,
    required_skills: object = None,
) -> np.ndarray:
    """Return features in the stable order declared by ``FEATURE_NAMES``."""
    values = build_feature_map(resume_text, job_text, resume_skills, required_skills)
    return np.asarray([values[name] for name in FEATURE_NAMES], dtype=np.float64)


def parse_skill_list(value: object) -> list[str]:
    """Normalize comma-separated or JSON-encoded skill values from the CSV."""
    if isinstance(value, list):
        parts = value
    elif isinstance(value, str):
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            parsed = None
        parts = parsed if isinstance(parsed, list) else re.split(r"[,;|\n]+", value)
    else:
        parts = []

    return [str(part).strip() for part in parts if str(part).strip()]
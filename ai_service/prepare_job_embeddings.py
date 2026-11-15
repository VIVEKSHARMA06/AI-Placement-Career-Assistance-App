"""Embedding generation script for job roles dataset.

Generates L2-normalized embeddings for job_roles.json using SBERT
and saves them to datasets/job_embeddings.npy aligned 1:1 with job_roles.json.
Can be executed as a standalone script or invoked dynamically on startup.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

import numpy as np

from app.services.sbert_service import encode_texts

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
DATASETS_DIR = BASE_DIR / "datasets"
JOB_ROLES_FILE = DATASETS_DIR / "job_roles.json"
EMBEDDINGS_FILE = DATASETS_DIR / "job_embeddings.npy"


def format_role_for_embedding(role: dict[str, Any]) -> str:
    """Format a job role record into a descriptive text block for semantic embedding."""
    title = role.get("title", "")
    category = role.get("category", "")
    exp_level = role.get("experienceLevel", "")
    desc = role.get("description", "")
    req_skills = ", ".join(role.get("requiredSkills", []))
    pref_skills = ", ".join(role.get("preferredSkills", []))

    return (
        f"Job Title: {title}\n"
        f"Category: {category}\n"
        f"Experience Level: {exp_level}\n"
        f"Overview: {desc}\n"
        f"Required Core Skills: {req_skills}\n"
        f"Preferred Additional Skills: {pref_skills}"
    )


def prepare_job_embeddings(
    roles_path: Path = JOB_ROLES_FILE,
    output_path: Path = EMBEDDINGS_FILE,
    force_rebuild: bool = False,
) -> np.ndarray:
    """Read job_roles.json, compute SBERT embeddings, and save to job_embeddings.npy.

    Args:
        roles_path: Path to job_roles.json.
        output_path: Destination path for job_embeddings.npy.
        force_rebuild: If False and output file exists with matching shape, skip rebuild.

    Returns:
        np.ndarray of shape [N, D] with L2-normalized embeddings.
    """
    if not roles_path.exists():
        raise FileNotFoundError(f"Job roles dataset not found at {roles_path}")

    with roles_path.open("r", encoding="utf-8") as f:
        job_roles = json.load(f)

    if not isinstance(job_roles, list) or len(job_roles) == 0:
        raise ValueError(f"Job roles file {roles_path} is empty or not a valid list.")

    # Check if pre-existing embeddings match
    if not force_rebuild and output_path.exists():
        try:
            existing = np.load(str(output_path))
            if existing.shape[0] == len(job_roles) and existing.shape[1] == 384:
                logger.info(
                    "Job embeddings already exist and match role count (%d, %d). Reusing %s.",
                    existing.shape[0],
                    existing.shape[1],
                    output_path.name,
                )
                return existing
        except Exception as exc:
            logger.warning("Could not load existing embeddings (%s). Rebuilding...", exc)

    logger.info("Computing SBERT embeddings for %d job roles...", len(job_roles))
    texts = [format_role_for_embedding(r) for r in job_roles]
    embeddings = encode_texts(texts)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    np.save(str(output_path), embeddings)
    logger.info("Saved job embeddings to %s with shape %s.", output_path, embeddings.shape)
    return embeddings


if __name__ == "__main__":
    prepare_job_embeddings(force_rebuild=True)

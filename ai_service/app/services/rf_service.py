"""Cached inference interface for the trained Random Forest match model."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
import pickle
from typing import Any

import numpy as np

from app.services.feature_builder import FEATURE_NAMES, build_feature_map, build_feature_vector

MODEL_PATH = Path(__file__).resolve().parents[2] / "models" / "random_forest_model.pkl"


@lru_cache(maxsize=1)
def load_model_bundle() -> dict[str, Any]:
    """Load and validate the model artifact once per process."""
    if not MODEL_PATH.is_file():
        raise FileNotFoundError(
            f"Suitability model is missing at {MODEL_PATH}. Run `python ml_training/train_rf.py`."
        )

    with MODEL_PATH.open("rb") as model_file:
        bundle = pickle.load(model_file)
    if not isinstance(bundle, dict) or bundle.get("feature_names") != list(FEATURE_NAMES):
        raise ValueError("Suitability model features do not match the current feature builder.")
    if "model" not in bundle or "training_features" not in bundle:
        raise ValueError("Suitability model artifact is incomplete.")
    return bundle


def get_feature_values(
    resume_text: str,
    job_description: str,
    resume_skills: object = None,
    required_skills: object = None,
) -> dict[str, float]:
    return build_feature_map(resume_text, job_description, resume_skills, required_skills)


def predict_match_score(
    resume_text: str,
    job_description: str,
    resume_skills: object = None,
    required_skills: object = None,
) -> tuple[float, np.ndarray]:
    """Return a clamped 0-1 estimate and the exact feature vector used."""
    bundle = load_model_bundle()
    vector = build_feature_vector(
        resume_text,
        job_description,
        resume_skills,
        required_skills,
    )
    score = float(bundle["model"].predict(vector.reshape(1, -1))[0])
    return float(np.clip(score, 0.0, 1.0)), vector
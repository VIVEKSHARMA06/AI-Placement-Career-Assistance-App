"""Train and persist the resume/job match-score Random Forest model."""
from __future__ import annotations

import csv
import logging
from pathlib import Path
import pickle
import sys

import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.services.feature_builder import (
    FEATURE_NAMES,
    build_feature_vector,
    parse_skill_list,
)

logger = logging.getLogger(__name__)
DATASET_PATH = BASE_DIR / "datasets" / "recruiter_hiring_dataset.csv"
MODEL_PATH = BASE_DIR / "models" / "random_forest_model.pkl"
TARGET_COLUMN = "ai_match_score"


def load_training_data(dataset_path: Path = DATASET_PATH) -> tuple[np.ndarray, np.ndarray]:
    """Load stable features and the normalized AI match-score target."""
    if not dataset_path.is_file():
        raise FileNotFoundError(f"Recruiter dataset not found: {dataset_path}")

    features: list[np.ndarray] = []
    targets: list[float] = []
    with dataset_path.open("r", encoding="utf-8-sig", newline="") as dataset_file:
        reader = csv.DictReader(dataset_file)
        required_columns = {
            "resume_text",
            "job_text",
            "job_required_skills",
            "resume_skill_list",
            TARGET_COLUMN,
        }
        missing_columns = required_columns.difference(reader.fieldnames or [])
        if missing_columns:
            raise ValueError(
                "Dataset is missing required columns: " + ", ".join(sorted(missing_columns))
            )

        for row in reader:
            try:
                target = float(row[TARGET_COLUMN]) / 100.0
            except (TypeError, ValueError):
                continue
            if not np.isfinite(target):
                continue

            features.append(
                build_feature_vector(
                    row.get("resume_text", ""),
                    row.get("job_text", ""),
                    parse_skill_list(row.get("resume_skill_list")),
                    parse_skill_list(row.get("job_required_skills")),
                )
            )
            targets.append(float(np.clip(target, 0.0, 1.0)))

    if len(features) < 10:
        raise ValueError(f"At least 10 valid training rows are required; found {len(features)}.")

    return np.vstack(features), np.asarray(targets, dtype=np.float64)


def train_model(
    dataset_path: Path = DATASET_PATH,
    model_path: Path = MODEL_PATH,
) -> dict[str, float]:
    """Fit, evaluate, and save a model that estimates the dataset's match score."""
    x_values, y_values = load_training_data(dataset_path)
    x_train, x_test, y_train, y_test = train_test_split(
        x_values,
        y_values,
        test_size=0.2,
        random_state=42,
    )

    model = RandomForestRegressor(
        n_estimators=300,
        min_samples_leaf=3,
        max_features=0.9,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(x_train, y_train)
    predictions = np.clip(model.predict(x_test), 0.0, 1.0)
    metrics = {
        "mae_points": float(mean_absolute_error(y_test, predictions) * 100.0),
        "rmse_points": float(np.sqrt(mean_squared_error(y_test, predictions)) * 100.0),
        "r2": float(r2_score(y_test, predictions)),
    }

    model_path.parent.mkdir(parents=True, exist_ok=True)
    artifact = {
        "model": model,
        "feature_names": list(FEATURE_NAMES),
        "training_features": x_train,
        "evaluation": metrics,
        "target": "ai_match_score normalized to 0-1; not a hiring outcome probability",
        "row_count": int(len(y_values)),
    }
    with model_path.open("wb") as model_file:
        pickle.dump(artifact, model_file, protocol=pickle.HIGHEST_PROTOCOL)

    logger.info(
        "Trained Random Forest on %d rows; test MAE %.2f points, RMSE %.2f points, R2 %.3f.",
        len(y_values),
        metrics["mae_points"],
        metrics["rmse_points"],
        metrics["r2"],
    )
    logger.info("Saved model to %s", model_path)
    return metrics


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    train_model()
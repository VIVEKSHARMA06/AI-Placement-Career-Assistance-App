"""Local LIME explanations for the Random Forest match-score estimate."""
from __future__ import annotations

from app.services.feature_builder import FEATURE_NAMES
from app.services.rf_service import load_model_bundle


def explain_prediction(feature_vector: object, num_features: int = 8) -> list[dict[str, object]]:
    """Explain how local feature perturbations affect one model score."""
    from lime.lime_tabular import LimeTabularExplainer

    bundle = load_model_bundle()
    model = bundle["model"]
    explainer = LimeTabularExplainer(
        training_data=bundle["training_features"],
        feature_names=list(FEATURE_NAMES),
        mode="regression",
        discretize_continuous=True,
        random_state=42,
    )
    explanation = explainer.explain_instance(
        feature_vector,
        model.predict,
        num_features=min(max(1, num_features), len(FEATURE_NAMES)),
        num_samples=600,
    )
    return [
        {
            "feature": feature,
            "weight": float(weight),
            "impact": "positive" if weight >= 0 else "negative",
        }
        for feature, weight in explanation.as_list()
    ]
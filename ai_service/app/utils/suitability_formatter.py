"""Shape suitability results for the existing Node and React clients."""
from __future__ import annotations

from typing import Any


def format_suitability_response(
    score: float,
    lime_explanation: list[dict[str, Any]],
    gemini_suggestions: list[str],
) -> dict[str, Any]:
    """Return the API contract expected by the existing suitability controller."""
    bounded_score = min(1.0, max(0.0, float(score)))
    if bounded_score >= 0.7:
        label = "Strong match-score estimate"
    elif bounded_score >= 0.4:
        label = "Moderate match-score estimate"
    else:
        label = "Low match-score estimate"

    return {
        "suitabilityScore": round(bounded_score, 4),
        "predictionLabel": label,
        "limeExplanation": lime_explanation,
        "geminiSuggestions": gemini_suggestions,
        "scoreBasis": "Estimated resume-to-job match score; not a hiring probability.",
    }
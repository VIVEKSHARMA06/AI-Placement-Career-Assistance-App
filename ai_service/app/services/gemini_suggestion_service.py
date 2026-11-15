"""Gemini-generated, resume-grounded improvement suggestions."""
from __future__ import annotations

import json
import logging
from typing import Any

from google import genai
from google.genai import types

from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiSuggestionError(RuntimeError):
    """Raised when personalized suggestions cannot be generated."""


class GeminiSuggestionNotConfiguredError(GeminiSuggestionError):
    """Raised when the Gemini API key is missing."""


def generate_suggestions(
    resume_text: str,
    job_description: str,
    score: float,
    lime_explanation: list[dict[str, Any]],
) -> list[str]:
    """Generate concise next steps grounded in the supplied resume and job text."""
    api_key = settings.gemini_api_key
    if not api_key or not api_key.strip():
        raise GeminiSuggestionNotConfiguredError(
            "GEMINI_API_KEY is not configured. Set it in ai_service/.env."
        )

    prompt = {
        "task": "Return 3 to 5 specific, realistic ways to improve this resume for this job.",
        "rules": [
            "Use only facts present in the resume and job description.",
            "Do not invent experience, credentials, metrics, or skills.",
            "Suggest adding measurable evidence only when the candidate can verify it.",
            "Return JSON only with a suggestions array of short strings.",
        ],
        "match_score_estimate": round(score * 100, 1),
        "score_notice": "This is an AI match-score estimate, not a hiring probability.",
        "resume_text": resume_text[:8000],
        "job_description": job_description[:8000],
        "local_explanation": lime_explanation[:8],
    }

    try:
        with genai.Client(api_key=api_key.strip()) as client:
            response = client.models.generate_content(
                model=settings.gemini_model,
                contents=json.dumps(prompt, ensure_ascii=True),
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.3,
                ),
            )
    except Exception as exc:
        logger.warning("Gemini suggestion request failed (%s).", type(exc).__name__)
        raise GeminiSuggestionError(
            f"Gemini suggestion request failed: {type(exc).__name__}"
        ) from exc

    try:
        payload = json.loads(response.text or "")
        suggestions = payload.get("suggestions", []) if isinstance(payload, dict) else payload
        if not isinstance(suggestions, list):
            raise ValueError("Gemini response does not contain a suggestions list.")
        return [
            item.strip()[:400]
            for item in suggestions
            if isinstance(item, str) and item.strip()
        ][:5]
    except (AttributeError, json.JSONDecodeError, TypeError, ValueError) as exc:
        raise GeminiSuggestionError("Gemini returned an invalid suggestion response.") from exc
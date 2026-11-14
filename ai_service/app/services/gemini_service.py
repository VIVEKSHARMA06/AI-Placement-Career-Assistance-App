"""Gemini structured resume extraction service.

Extracts candidate profile facts from English resume text into a validated
CandidateProfile model using Gemini structured JSON outputs.
Strictly extracts only facts explicitly stated in the resume.
"""
from __future__ import annotations

import json
import logging
import re

from google import genai
from google.genai import types

from app.core.config import settings
from app.schemas.candidate_profile import (
    CandidateProfile,
    Education,
    Experience,
    PersonalInfo,
    Project,
)

logger = logging.getLogger(__name__)

GEMINI_MODEL = settings.gemini_model

EXTRACTION_SYSTEM_PROMPT = """You are a precise, factual resume parsing engine.
Your task is to extract structured candidate information from the provided resume text into the exact requested JSON schema.

STRICT ANTI-HALLUCINATION RULES:
1. Extract ONLY information that is explicitly stated in the resume text.
2. NEVER guess, assume, infer, extrapolate, or invent any details.
3. If a field is not explicitly present in the resume text, set it to null (for strings) or an empty list [] (for arrays).
4. For skills, include only technical skills, soft skills, programming languages, tools, and frameworks explicitly mentioned in the text.
5. For experience and education dates, preserve the original representation (e.g. "2021 - 2024", "May 2023", "Present").
6. Output must strictly conform to the required JSON schema without any conversational markdown or preamble.
"""


class GeminiServiceError(RuntimeError):
    """Base error for Gemini resume extraction failures."""


class GeminiNotConfiguredError(GeminiServiceError):
    """Raised when GEMINI_API_KEY is not configured in settings."""


def _as_text(value: object) -> str | None:
    if isinstance(value, str):
        return value.strip() or None
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return str(value)
    return None


def _as_text_list(value: object) -> list[str]:
    if isinstance(value, str):
        return [item.strip() for item in re.split(r"[,;\n]", value) if item.strip()]
    if isinstance(value, list):
        return [text for item in value if (text := _as_text(item)) is not None]
    return []


def _as_record(value: object, fields: tuple[str, ...]) -> dict[str, object]:
    if not isinstance(value, dict):
        return {}
    return {field: _as_text(value.get(field)) for field in fields}


def _sanitize_profile(value: object) -> CandidateProfile:
    """Coerce imperfect model output into the public CandidateProfile schema."""
    if isinstance(value, CandidateProfile):
        value = value.model_dump()
    if not isinstance(value, dict):
        return CandidateProfile()

    personal_fields = ("name", "email", "phone", "location", "linkedin", "github", "portfolio")
    education_fields = ("institution", "degree", "field", "startDate", "endDate", "gpa")
    experience_fields = ("company", "role", "startDate", "endDate", "description")
    project_fields = ("title", "description", "link")

    def records(field, model, text_fields, list_fields=()):
        raw_records = value.get(field)
        if not isinstance(raw_records, list):
            return []
        result = []
        for raw in raw_records:
            if not isinstance(raw, dict):
                continue
            normalized = _as_record(raw, text_fields)
            normalized.update({name: _as_text_list(raw.get(name)) for name in list_fields})
            result.append(model(**normalized))
        return result

    return CandidateProfile(
        personalInfo=PersonalInfo(**_as_record(value.get("personalInfo"), personal_fields)),
        summary=_as_text(value.get("summary")),
        skills=_as_text_list(value.get("skills")),
        education=records("education", Education, education_fields),
        experience=records(
            "experience", Experience, experience_fields, ("technologies",)
        ),
        projects=records("projects", Project, project_fields, ("technologies",)),
        certifications=_as_text_list(value.get("certifications")),
        languages=_as_text_list(value.get("languages")),
    )


def _get_gemini_api_key() -> str:
    api_key = settings.gemini_api_key
    if not api_key or not api_key.strip():
        raise GeminiNotConfiguredError(
            "GEMINI_API_KEY is not configured. Set GEMINI_API_KEY in .env."
        )
    return api_key.strip()


def extract_candidate_profile(resume_text: str) -> CandidateProfile:
    """Extract structured CandidateProfile from English resume text using Gemini.

    Args:
        resume_text: Clean English resume text.

    Returns:
        Validated CandidateProfile instance.

    Raises:
        ValueError: If resume_text is empty or whitespace-only.
        GeminiNotConfiguredError: If GEMINI_API_KEY is not set.
        GeminiServiceError: If Gemini API fails or response cannot be parsed.
    """
    if not resume_text or not resume_text.strip():
        raise ValueError("Resume text is empty and cannot be extracted.")

    api_key = _get_gemini_api_key()

    prompt = (
        f"{EXTRACTION_SYSTEM_PROMPT}\n\n"
        f"--- RESUME TEXT START ---\n"
        f"{resume_text.strip()}\n"
        f"--- RESUME TEXT END ---"
    )

    try:
        with genai.Client(api_key=api_key) as client:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=CandidateProfile,
                    temperature=0.0,
                ),
            )
    except GeminiNotConfiguredError:
        raise
    except Exception as exc:
        logger.error(
            "Gemini API request failed: %s: %s; cause=%r",
            type(exc).__name__,
            str(exc),
            exc.__cause__,
        )
        raise GeminiServiceError(
            f"Gemini resume extraction request failed: {type(exc).__name__}"
        ) from exc

    try:
        raw_text = getattr(response, "text", None)
        if not raw_text or not raw_text.strip():
            # In some response formats, parsed might be directly accessible
            if hasattr(response, "parsed") and response.parsed:
                return _sanitize_profile(response.parsed)
            logger.warning(
                "Gemini returned an empty structured response; using an empty profile."
            )
            return CandidateProfile()

        try:
            parsed_json = json.loads(raw_text)
        except json.JSONDecodeError:
            # Be tolerant of surrounding prose or punctuation from the model.
            object_match = re.search(r"\{[\s\S]*\}", raw_text)
            if not object_match:
                logger.warning(
                    "Gemini response contained no JSON object; using an empty profile."
                )
                return CandidateProfile()
            parsed_json = json.loads(object_match.group(0))
        return _sanitize_profile(parsed_json)
    except Exception as exc:
        logger.error(
            "Failed to parse Gemini structured response: %s",
            type(exc).__name__,
        )
        return CandidateProfile()

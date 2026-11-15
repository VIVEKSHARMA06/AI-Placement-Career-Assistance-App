"""Suitability score, local explanation, and optional personalized advice API."""
from __future__ import annotations

import base64
import binascii
from io import BytesIO
import logging

from fastapi import APIRouter, HTTPException

from app.schemas.suitability_schema import SuitabilityRequest, SuitabilityResponse
from app.services.gemini_suggestion_service import generate_suggestions
from app.services.lime_service import explain_prediction
from app.services.rf_service import get_feature_values, predict_match_score
from app.utils.suitability_formatter import format_suitability_response

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/suitability", tags=["suitability"])
MAX_JOB_FILE_BYTES = 5 * 1024 * 1024
MAX_JOB_TEXT_CHARACTERS = 30_000


def _job_description_from_file(request: SuitabilityRequest) -> str:
    upload = request.job_description_file
    if upload is None:
        return ""
    if len(upload.content_base64) > ((MAX_JOB_FILE_BYTES + 2) // 3) * 4 + 8:
        raise HTTPException(status_code=413, detail="Job description file exceeds 5 MB.")
    try:
        content = base64.b64decode(upload.content_base64, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise HTTPException(status_code=400, detail="Job description file is not valid base64.") from exc
    if len(content) > MAX_JOB_FILE_BYTES:
        raise HTTPException(status_code=413, detail="Job description file exceeds 5 MB.")

    filename = upload.original_name.lower()
    if filename.endswith(".txt") or upload.mime_type == "text/plain":
        try:
            return content.decode("utf-8-sig").strip()
        except UnicodeDecodeError as exc:
            raise HTTPException(status_code=422, detail="TXT job description must use UTF-8 encoding.") from exc
    if filename.endswith(".pdf") or upload.mime_type == "application/pdf":
        try:
            from pypdf import PdfReader

            reader = PdfReader(BytesIO(content))
            return "\n".join(page.extract_text() or "" for page in reader.pages).strip()
        except ImportError as exc:
            raise HTTPException(status_code=503, detail="PDF support is unavailable; install pypdf.") from exc
        except Exception as exc:
            raise HTTPException(status_code=422, detail="Unable to extract text from the PDF.") from exc
    raise HTTPException(status_code=415, detail="Job description file must be a PDF or TXT.")


@router.post(
    "/predict",
    response_model=SuitabilityResponse,
    response_model_by_alias=True,
)
def predict_suitability(request: SuitabilityRequest) -> SuitabilityResponse:
    job_description = request.job_description.strip()
    if not job_description:
        job_description = _job_description_from_file(request)
    if not job_description:
        raise HTTPException(status_code=400, detail="A non-empty job description is required.")

    resume_text = request.candidate_profile.get("resumeText")
    if not isinstance(resume_text, str) or not resume_text.strip():
        raise HTTPException(
            status_code=400,
            detail="candidateProfile.resumeText must contain resume text.",
        )

    resume_text = resume_text.strip()[:MAX_JOB_TEXT_CHARACTERS]
    job_description = job_description[:MAX_JOB_TEXT_CHARACTERS]
    resume_skills = request.candidate_profile.get("skills", [])
    try:
        score, feature_vector = predict_match_score(
            resume_text,
            job_description,
            resume_skills=resume_skills,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Suitability model prediction failed.")
        raise HTTPException(
            status_code=500,
            detail=f"Suitability prediction failed: {type(exc).__name__}",
        ) from exc

    lime_explanation = []
    try:
        lime_explanation = explain_prediction(feature_vector)
    except Exception as exc:
        logger.warning("LIME explanation unavailable (%s).", type(exc).__name__)

    gemini_suggestions = []
    try:
        feature_values = get_feature_values(
            resume_text,
            job_description,
            resume_skills=resume_skills,
        )
        gemini_suggestions = generate_suggestions(
            resume_text,
            job_description,
            score,
            lime_explanation or [
                {"feature": name, "weight": 0.0, "value": value}
                for name, value in feature_values.items()
            ],
        )
    except Exception as exc:
        logger.info("Gemini suggestions unavailable (%s).", type(exc).__name__)

    formatted = format_suitability_response(score, lime_explanation, gemini_suggestions)
    return SuitabilityResponse(resumeId=request.resume_id, **formatted)
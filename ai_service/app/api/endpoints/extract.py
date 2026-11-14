"""FastAPI endpoint for structured resume extraction."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.extraction_schemas import (
    ResumeExtractionRequest,
    ResumeExtractionResponse,
)
from app.services.gemini_service import (
    GeminiNotConfiguredError,
    GeminiServiceError,
    extract_candidate_profile,
)

router = APIRouter(prefix="/resume", tags=["resume"])


@router.post(
    "/extract",
    response_model=ResumeExtractionResponse,
    response_model_by_alias=True,
)
def extract_resume_endpoint(
    request: ResumeExtractionRequest,
) -> ResumeExtractionResponse:
    """Extract structured CandidateProfile from English resume text using Gemini."""
    try:
        profile = extract_candidate_profile(request.resume_text)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except GeminiNotConfiguredError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except GeminiServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return ResumeExtractionResponse(
        resume_id=request.resume_id,
        profile=profile,
    )

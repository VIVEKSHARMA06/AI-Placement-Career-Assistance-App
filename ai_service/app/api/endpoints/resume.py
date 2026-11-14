"""Resume text-processing endpoints."""

from fastapi import APIRouter, HTTPException

from app.schemas.resume_processing import (
    ResumeProcessingRequest,
    ResumeProcessingResponse,
)
from app.services.language_processing import (
    AzureTranslatorConfigurationError,
    EmptyResumeTextError,
    LanguageDetectionError,
    ResumeTranslationError,
    UnsupportedResumeLanguageError,
    process_resume_text,
)

router = APIRouter(prefix="/resume", tags=["resume"])


@router.post("/process", response_model=ResumeProcessingResponse, response_model_by_alias=True)
def process_resume(request: ResumeProcessingRequest) -> ResumeProcessingResponse:
    """Detect resume language and translate non-English text to English."""
    try:
        processed = process_resume_text(request.resume_text)
    except EmptyResumeTextError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except LanguageDetectionError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except AzureTranslatorConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except UnsupportedResumeLanguageError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except ResumeTranslationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return ResumeProcessingResponse(
        resume_id=request.resume_id,
        **processed,
    )

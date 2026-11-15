"""Higher-education recommendations endpoint using shared SBERT embeddings."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.services.education_recommender import recommend_education

router = APIRouter(prefix="/recommend", tags=["education recommendations"])


class EducationRecommendationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    resume_id: str | None = Field(default=None, alias="resumeId")
    resume_text: str = Field(alias="resumeText")
    top_k: int = Field(default=10, alias="topK", ge=1, le=50)


class EducationRecommendationResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    resume_id: str | None = Field(default=None, alias="resumeId")
    recommendations: list[dict[str, Any]]
    total: int


@router.post(
    "/education",
    response_model=EducationRecommendationResponse,
    response_model_by_alias=True,
)
def get_education_recommendations(
    request: EducationRecommendationRequest,
) -> EducationRecommendationResponse:
    if not request.resume_text.strip():
        raise HTTPException(status_code=400, detail="resumeText must not be empty.")
    try:
        recommendations = recommend_education(request.resume_text, request.top_k)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Education recommendation engine failed: {type(exc).__name__}",
        ) from exc

    return EducationRecommendationResponse(
        resumeId=request.resume_id,
        recommendations=recommendations,
        total=len(recommendations),
    )
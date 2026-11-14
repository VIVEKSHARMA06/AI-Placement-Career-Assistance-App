"""FastAPI endpoints for AI recommendations."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.services.job_recommender import recommend_jobs

router = APIRouter(prefix="/recommend", tags=["recommendations"])


class JobRecommendationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    resume_id: str | None = Field(default=None, alias="resumeId")
    resume_text: str = Field(alias="resumeText")
    top_k: int = Field(default=10, alias="topK", ge=1, le=50)


class JobRecommendationItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    role_id: str = Field(alias="roleId")
    title: str
    category: str
    experience_level: str = Field(alias="experienceLevel")
    similarity_score: float = Field(alias="similarityScore")
    matched_skills: list[str] = Field(default_factory=list, alias="matchedSkills")
    missing_skills: list[str] = Field(default_factory=list, alias="missingSkills")
    explanation: str


class JobRecommendationResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    resume_id: str | None = Field(default=None, alias="resumeId")
    recommendations: list[JobRecommendationItem]
    total: int


@router.post(
    "/jobs",
    response_model=JobRecommendationResponse,
    response_model_by_alias=True,
)
def get_job_recommendations_endpoint(
    request: JobRecommendationRequest,
) -> JobRecommendationResponse:
    """Return top SBERT-ranked job role recommendations for candidate resume text."""
    if not request.resume_text or not request.resume_text.strip():
        raise HTTPException(
            status_code=400,
            detail="resumeText must not be empty.",
        )

    try:
        results = recommend_jobs(
            resume_text=request.resume_text,
            top_k=request.top_k,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Job recommendation engine failed: {type(exc).__name__}",
        ) from exc

    items = [JobRecommendationItem(**r) for r in results]
    return JobRecommendationResponse(
        resume_id=request.resume_id,
        recommendations=items,
        total=len(items),
    )

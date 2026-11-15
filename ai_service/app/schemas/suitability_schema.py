"""Request and response models for candidate suitability predictions."""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class JobDescriptionFile(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    original_name: str = Field(alias="originalName")
    mime_type: str = Field(default="", alias="mimeType")
    content_base64: str = Field(alias="contentBase64")


class SuitabilityRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    resume_id: str | None = Field(default=None, alias="resumeId")
    job_description: str = Field(default="", alias="jobDescription")
    job_description_file: JobDescriptionFile | None = Field(
        default=None, alias="jobDescriptionFile"
    )
    candidate_profile: dict[str, Any] = Field(alias="candidateProfile")


class LimeExplanation(BaseModel):
    feature: str
    weight: float
    impact: str


class SuitabilityResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    resume_id: str | None = Field(default=None, alias="resumeId")
    suitability_score: float = Field(alias="suitabilityScore")
    prediction_label: str = Field(alias="predictionLabel")
    lime_explanation: list[LimeExplanation] = Field(alias="limeExplanation")
    gemini_suggestions: list[str] = Field(alias="geminiSuggestions")
    score_basis: str = Field(alias="scoreBasis")
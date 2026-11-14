"""Request and response schemas for structured resume extraction."""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.candidate_profile import CandidateProfile


class ResumeExtractionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    resume_id: str | None = Field(default=None, alias="resumeId")
    resume_text: str = Field(alias="resumeText")


class ResumeExtractionResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    resume_id: str | None = Field(default=None, alias="resumeId")
    profile: CandidateProfile

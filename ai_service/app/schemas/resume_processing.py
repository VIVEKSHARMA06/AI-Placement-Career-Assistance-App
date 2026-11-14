"""Request and response models for multilingual resume processing."""

from pydantic import BaseModel, ConfigDict, Field


class ResumeProcessingRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    resume_id: str | None = Field(default=None, alias="resumeId")
    resume_text: str = Field(alias="resumeText")


class ResumeProcessingResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    resume_id: str | None = Field(default=None, alias="resumeId")
    detected_language: str = Field(alias="detectedLanguage")
    is_english: bool = Field(alias="isEnglish")
    translation_applied: bool = Field(alias="translationApplied")
    original_text: str = Field(alias="originalText")
    translated_text: str = Field(alias="translatedText")

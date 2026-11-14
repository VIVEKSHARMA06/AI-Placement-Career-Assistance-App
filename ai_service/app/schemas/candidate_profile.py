"""Pydantic v2 schema for structured CandidateProfile data.

Used by Gemini extraction, SBERT embedding, job recommendation,
and higher-education recommendation modules.
"""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class PersonalInfo(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    linkedin: str | None = None
    github: str | None = None
    portfolio: str | None = None


class Education(BaseModel):
    institution: str | None = None
    degree: str | None = None
    field: str | None = None
    startDate: str | None = None
    endDate: str | None = None
    gpa: str | None = None


class Experience(BaseModel):
    company: str | None = None
    role: str | None = None
    startDate: str | None = None
    endDate: str | None = None
    description: str | None = None
    technologies: list[str] = []


class Project(BaseModel):
    title: str | None = None
    description: str | None = None
    technologies: list[str] = []
    link: str | None = None


class CandidateProfile(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    personalInfo: PersonalInfo = PersonalInfo()
    summary: str | None = None
    skills: list[str] = []
    education: list[Education] = []
    experience: list[Experience] = []
    projects: list[Project] = []
    certifications: list[str] = []
    languages: list[str] = []

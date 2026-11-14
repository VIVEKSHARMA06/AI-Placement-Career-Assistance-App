"""FastAPI application entry point for the AI service."""

import uvicorn
from fastapi import FastAPI

from app.api.endpoints.health import router as health_router
from app.api.endpoints.resume import router as resume_router
from app.core.config import settings

app = FastAPI(title=settings.app_name)
app.include_router(health_router)
app.include_router(resume_router)


if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.host, port=settings.port)

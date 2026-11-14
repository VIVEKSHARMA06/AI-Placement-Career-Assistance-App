"""Environment-based settings for the AI service."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Career and Placement Assistant Service"
    host: str = "0.0.0.0"
    port: int = 8000
    azure_translator_key: str | None = None
    azure_translator_endpoint: str | None = None
    azure_translator_region: str | None = None
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-3.5-flash-lite"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

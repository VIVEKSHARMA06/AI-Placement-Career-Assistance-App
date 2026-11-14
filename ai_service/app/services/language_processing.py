"""Language detection and Azure-based English translation for resume text."""

import time
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

import httpx
from langdetect import DetectorFactory, detect

from app.core.config import settings

DetectorFactory.seed = 0

AZURE_TRANSLATE_API_VERSION = "3.0"
MAX_TRANSLATION_ATTEMPTS = 3
BASE_RETRY_DELAY_SECONDS = 0.5
MAX_RETRY_AFTER_SECONDS = 30.0


class EmptyResumeTextError(ValueError):
    """Raised when no resume text was supplied for processing."""


class LanguageDetectionError(ValueError):
    """Raised when langdetect cannot determine the text's language."""


class ResumeTranslationError(RuntimeError):
    """Raised when a non-English resume cannot be translated."""


class UnsupportedResumeLanguageError(ResumeTranslationError):
    """Raised when Azure Translator rejects the detected source language."""


class AzureTranslatorConfigurationError(RuntimeError):
    """Raised when Azure Translator credentials or endpoint are missing."""


def _retry_after_seconds(value: str | None) -> float | None:
    """Parse Retry-After as seconds or an HTTP date, if supplied."""
    if not value:
        return None

    try:
        return max(0.0, float(value))
    except ValueError:
        try:
            retry_at = parsedate_to_datetime(value)
            if retry_at.tzinfo is None:
                retry_at = retry_at.replace(tzinfo=timezone.utc)
            return max(0.0, (retry_at - datetime.now(timezone.utc)).total_seconds())
        except (TypeError, ValueError, OverflowError):
            return None


def _translate_to_english(text: str, source_language: str) -> str:
    """Call Azure Translator Text API and retry transient responses."""
    key = settings.azure_translator_key
    endpoint = settings.azure_translator_endpoint
    region = settings.azure_translator_region
    if not all(value and value.strip() for value in (key, endpoint, region)):
        raise AzureTranslatorConfigurationError(
            "Azure Translator is not configured. Set AZURE_TRANSLATOR_KEY, "
            "AZURE_TRANSLATOR_ENDPOINT, and AZURE_TRANSLATOR_REGION."
        )

    url = f"{endpoint.rstrip('/')}/translate"
    headers = {
        "Ocp-Apim-Subscription-Key": key,
        "Ocp-Apim-Subscription-Region": region,
        "Content-Type": "application/json",
    }
    params = {
        "api-version": AZURE_TRANSLATE_API_VERSION,
        "from": source_language,
        "to": "en",
    }
    payload = [{"text": text}]

    try:
        with httpx.Client(timeout=20.0) as client:
            for attempt in range(MAX_TRANSLATION_ATTEMPTS):
                response = client.post(
                    url,
                    params=params,
                    headers=headers,
                    json=payload,
                )

                is_transient = (
                    response.status_code == 429 or response.status_code >= 500
                )
                if is_transient:
                    if attempt + 1 == MAX_TRANSLATION_ATTEMPTS:
                        raise ResumeTranslationError(
                            "Azure Translator remained unavailable after retries."
                        )

                    retry_after = _retry_after_seconds(
                        response.headers.get("Retry-After")
                    )
                    if retry_after is not None:
                        if retry_after > MAX_RETRY_AFTER_SECONDS:
                            raise ResumeTranslationError(
                                "Azure Translator requested a retry delay that "
                                "exceeds the service limit. Try again later."
                            )
                        delay = retry_after
                    else:
                        delay = BASE_RETRY_DELAY_SECONDS * (2**attempt)

                    time.sleep(delay)
                    continue

                if response.is_error:
                    if response.status_code == 400:
                        try:
                            error_code = str(response.json()["error"]["code"])
                        except (ValueError, KeyError, TypeError):
                            error_code = ""
                        if error_code == "400035":
                            raise UnsupportedResumeLanguageError(
                                "Azure Translator does not support the detected "
                                "resume language."
                            )
                    raise ResumeTranslationError(
                        f"Azure Translator rejected the request "
                        f"(HTTP {response.status_code})."
                    )

                try:
                    result = response.json()
                    translated_text = result[0]["translations"][0]["text"]
                except (ValueError, KeyError, IndexError, TypeError) as exc:
                    raise ResumeTranslationError(
                        "Azure Translator returned an invalid response."
                    ) from exc

                if (
                    not isinstance(translated_text, str)
                    or not translated_text.strip()
                ):
                    raise ResumeTranslationError(
                        "Azure Translator returned no translated text."
                    )
                try:
                    translated_language = detect(translated_text)
                except Exception as exc:
                    raise ResumeTranslationError(
                        "Azure Translator returned text that could not be "
                        "verified as English."
                    ) from exc
                if translated_language != "en":
                    raise ResumeTranslationError(
                        "Azure Translator returned text that could not be "
                        "verified as English."
                    )
                return translated_text
    except ResumeTranslationError:
        raise
    except httpx.HTTPError as exc:
        raise ResumeTranslationError(
            "Unable to reach Azure Translator."
        ) from exc

    raise ResumeTranslationError("Azure Translator did not return a translation.")


def process_resume_text(resume_text: str) -> dict[str, str | bool]:
    """Detect a resume's language and translate it to English when needed."""
    if not resume_text.strip():
        raise EmptyResumeTextError("resumeText must not be empty.")

    try:
        detected_language = detect(resume_text)
    except Exception as exc:
        raise LanguageDetectionError(
            "Unable to detect the language of resumeText."
        ) from exc

    is_english = detected_language == "en"
    if is_english:
        translated_text = resume_text
        translation_applied = False
    else:
        try:
            translated_text = _translate_to_english(
                resume_text,
                detected_language,
            )
        except (AzureTranslatorConfigurationError, UnsupportedResumeLanguageError):
            raise
        except Exception as exc:
            raise ResumeTranslationError(
                "Unable to translate resumeText into English."
            ) from exc
        translation_applied = True

    return {
        "detected_language": detected_language,
        "is_english": is_english,
        "translation_applied": translation_applied,
        "original_text": resume_text,
        "translated_text": translated_text,
    }

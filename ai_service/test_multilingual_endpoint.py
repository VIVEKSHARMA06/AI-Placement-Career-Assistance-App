"""Live regression checks for multilingual resume processing.

Run with the FastAPI service already running:
    python -m unittest -v test_multilingual_endpoint
"""

import os
import unittest
from unittest.mock import patch

import httpx
from fastapi import HTTPException
from langdetect import DetectorFactory, detect

from app.api.endpoints.resume import process_resume
from app.core.config import settings
from app.schemas.resume_processing import ResumeProcessingRequest

DetectorFactory.seed = 0
BASE_URL = os.getenv("AI_SERVICE_URL", "http://127.0.0.1:8000")

RESUMES = {
    "es": (
        "María García es ingeniera de software con una licenciatura en Ingeniería "
        "Informática de la Universidad de Madrid. Tiene experiencia en Python, "
        "FastAPI, SQL y AWS. Desde 2022 trabaja como desarrolladora backend, "
        "donde diseñó servicios web, automatizó pruebas y colaboró con equipos "
        "de producto."
    ),
    "fr": (
        "Claire Martin est ingénieure logiciel diplômée en informatique de "
        "l'Université de Lyon. Elle maîtrise Python, FastAPI, SQL et AWS. Depuis "
        "2022, elle travaille comme développeuse backend, conçoit des API web, "
        "automatise les tests et collabore avec les équipes produit."
    ),
    "hi": (
        "राहुल शर्मा ने दिल्ली विश्वविद्यालय से कंप्यूटर विज्ञान में स्नातक की डिग्री "
        "प्राप्त की है। उन्हें Python, FastAPI, SQL और AWS का अनुभव है। 2022 से वे "
        "सॉफ्टवेयर इंजीनियर के रूप में काम कर रहे हैं, वेब सेवाएँ बनाते हैं, परीक्षण "
        "स्वचालित करते हैं और उत्पाद टीमों के साथ सहयोग करते हैं।"
    ),
    "ta": (
        "அருண் குமார் சென்னை பல்கலைக்கழகத்தில் கணினி அறிவியலில் இளங்கலை பட்டம் "
        "பெற்றார். Python, FastAPI, SQL மற்றும் AWS ஆகியவற்றில் திறமை பெற்றவர். "
        "2022 முதல் மென்பொருள் பொறியாளராக பணியாற்றி, இணைய சேவைகளை உருவாக்கி, "
        "சோதனைகளை தானியங்குபடுத்தி, தயாரிப்பு குழுக்களுடன் இணைந்து செயல்படுகிறார்."
    ),
    "te": (
        "అనన్య రెడ్డి హైదరాబాద్ విశ్వవిద్యాలయం నుండి కంప్యూటర్ సైన్స్‌లో బ్యాచిలర్ "
        "డిగ్రీ పొందారు. Python, FastAPI, SQL మరియు AWSలో నైపుణ్యం కలిగి ఉన్నారు. "
        "2022 నుండి సాఫ్ట్‌వేర్ ఇంజనీర్‌గా పనిచేస్తూ, వెబ్ సేవలను నిర్మించి, పరీక్షలను "
        "ఆటోమేట్ చేసి, ఉత్పత్తి బృందాలతో కలిసి పనిచేస్తున్నారు."
    ),
    "en": (
        "Jordan Lee is a software engineer with a bachelor's degree in Computer "
        "Science from the University of Seattle. Skilled in Python, FastAPI, SQL, "
        "and AWS, Jordan has worked as a backend engineer since 2022, building "
        "web services, automating tests, and collaborating with product teams."
    ),
}

MIXED_HINDI_ENGLISH = (
    "राहुल शर्मा एक software engineer हैं, जिनके पास Python, FastAPI, SQL, and "
    "AWS में तीन साल का अनुभव है। उन्होंने दिल्ली विश्वविद्यालय से computer "
    "science में bachelor's degree प्राप्त की है।"
)


class AzureInvalidSourceResponse:
    status_code = 400
    headers = {}
    is_error = True

    @staticmethod
    def json():
        return {"error": {"code": 400035, "message": "The source language is not valid."}}


class MockAzureClient:
    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    @staticmethod
    def post(*_args, **_kwargs):
        return AzureInvalidSourceResponse()


class MultilingualEndpointLiveTests(unittest.TestCase):
    def test_health(self):
        response = httpx.get(f"{BASE_URL}/health", timeout=20)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_language_resumes_through_endpoint(self):
        with httpx.Client(timeout=90) as client:
            for language, resume_text in RESUMES.items():
                with self.subTest(language=language):
                    self.assertEqual(detect(resume_text), language)
                    response = client.post(
                        f"{BASE_URL}/resume/process",
                        json={
                            "resumeId": f"live-test-{language}",
                            "resumeText": resume_text,
                        },
                    )
                    self.assertEqual(response.status_code, 200, response.text)
                    result = response.json()
                    self.assertEqual(result["detectedLanguage"], language)
                    self.assertEqual(result["originalText"], resume_text)
                    self.assertEqual(result["isEnglish"], language == "en")
                    self.assertEqual(result["translationApplied"], language != "en")

                    if language == "en":
                        self.assertEqual(result["translatedText"], resume_text)
                    else:
                        self.assertNotEqual(result["translatedText"], resume_text)
                        self.assertEqual(detect(result["translatedText"]), "en")

    def test_mixed_hindi_english_resume(self):
        response = httpx.post(
            f"{BASE_URL}/resume/process",
            json={"resumeText": MIXED_HINDI_ENGLISH},
            timeout=90,
        )
        self.assertEqual(response.status_code, 200, response.text)
        result = response.json()
        self.assertEqual(result["detectedLanguage"], "hi")
        self.assertTrue(result["translationApplied"])
        self.assertEqual(result["originalText"], MIXED_HINDI_ENGLISH)
        self.assertNotEqual(result["translatedText"], MIXED_HINDI_ENGLISH)
        self.assertEqual(detect(result["translatedText"]), "en")

    def test_empty_text_returns_400(self):
        response = httpx.post(
            f"{BASE_URL}/resume/process",
            json={"resumeText": "   "},
            timeout=20,
        )
        self.assertEqual(response.status_code, 400)

    def test_unsupported_azure_source_returns_422(self):
        request = ResumeProcessingRequest(resumeText="sample resume text")
        with (
            patch("app.services.language_processing.detect", return_value="xx"),
            patch(
                "app.services.language_processing.httpx.Client",
                return_value=MockAzureClient(),
            ),
            patch.object(settings, "azure_translator_key", "test-key"),
            patch.object(
                settings,
                "azure_translator_endpoint",
                "https://translator.example",
            ),
            patch.object(settings, "azure_translator_region", "test-region"),
        ):
            with self.assertRaises(HTTPException) as raised:
                process_resume(request)
        self.assertEqual(raised.exception.status_code, 422)


if __name__ == "__main__":
    unittest.main()

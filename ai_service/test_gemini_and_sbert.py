"""Unit and integration tests for Gemini extraction, SBERT service, and Job Recommendations."""
from __future__ import annotations

import json
import unittest
from unittest.mock import MagicMock, patch

import httpx
import numpy as np

from app.schemas.candidate_profile import (
    CandidateProfile,
    Education,
    Experience,
    PersonalInfo,
    Project,
)
from app.services.gemini_service import (
    GeminiNotConfiguredError,
    GeminiServiceError,
    extract_candidate_profile,
)
from app.services.job_recommender import recommend_jobs
from app.services.sbert_service import (
    compute_similarity,
    encode_single,
    encode_texts,
    profile_to_query_string,
    rank_items,
)


class GeminiExtractionUnitTests(unittest.TestCase):
    def test_empty_resume_text_raises_value_error(self):
        with self.assertRaises(ValueError):
            extract_candidate_profile("")
        with self.assertRaises(ValueError):
            extract_candidate_profile("   ")

    def test_missing_api_key_raises_not_configured(self):
        with patch("app.services.gemini_service.settings.gemini_api_key", None):
            with self.assertRaises(GeminiNotConfiguredError):
                extract_candidate_profile("Valid English resume text here.")

    def test_successful_structured_extraction(self):
        sample_json = {
            "personalInfo": {
                "name": "Jane Doe",
                "email": "jane@example.com",
                "phone": "+1-555-0100",
                "location": "Boston, MA",
                "linkedin": "linkedin.com/in/janedoe",
                "github": "github.com/janedoe",
                "portfolio": None,
            },
            "summary": "Full Stack Developer with 4 years experience.",
            "skills": ["Python", "FastAPI", "React", "TypeScript", "PostgreSQL"],
            "education": [
                {
                    "institution": "MIT",
                    "degree": "B.S.",
                    "field": "Computer Science",
                    "startDate": "2016",
                    "endDate": "2020",
                    "gpa": "3.9",
                }
            ],
            "experience": [
                {
                    "company": "Tech Startup",
                    "role": "Senior Engineer",
                    "startDate": "2020",
                    "endDate": "Present",
                    "description": "Led backend architecture.",
                    "technologies": ["Python", "FastAPI", "Docker"],
                }
            ],
            "projects": [
                {
                    "title": "Career Portal",
                    "description": "Built candidate portal.",
                    "technologies": ["React", "FastAPI"],
                    "link": "https://example.com/demo",
                }
            ],
            "certifications": ["AWS Solutions Architect"],
            "languages": ["English", "Spanish"],
        }

        mock_client = MagicMock()
        mock_client.__enter__.return_value = mock_client
        mock_response = MagicMock()
        mock_response.text = json.dumps(sample_json)
        mock_client.models.generate_content.return_value = mock_response

        with patch("app.services.gemini_service.settings.gemini_api_key", "test-key"):
            with patch("app.services.gemini_service.genai.Client", return_value=mock_client):
                profile = extract_candidate_profile("Sample resume text for Jane Doe.")

        self.assertIsInstance(profile, CandidateProfile)
        self.assertEqual(profile.personalInfo.name, "Jane Doe")
        self.assertEqual(profile.personalInfo.email, "jane@example.com")
        self.assertEqual(len(profile.skills), 5)
        self.assertEqual(profile.education[0].institution, "MIT")
        self.assertEqual(profile.experience[0].role, "Senior Engineer")
        self.assertEqual(profile.projects[0].title, "Career Portal")
        self.assertEqual(profile.certifications, ["AWS Solutions Architect"])

    def test_incomplete_minimal_resume_handles_nulls(self):
        minimal_json = {
            "personalInfo": {"name": "Bob", "email": None},
            "summary": None,
            "skills": ["Python"],
            "education": [],
            "experience": [],
            "projects": [],
            "certifications": [],
            "languages": [],
        }

        mock_client = MagicMock()
        mock_client.__enter__.return_value = mock_client
        mock_response = MagicMock()
        mock_response.text = json.dumps(minimal_json)
        mock_client.models.generate_content.return_value = mock_response

        with patch("app.services.gemini_service.settings.gemini_api_key", "test-key"):
            with patch("app.services.gemini_service.genai.Client", return_value=mock_client):
                profile = extract_candidate_profile("Minimal text: Bob, Python.")

        self.assertEqual(profile.personalInfo.name, "Bob")
        self.assertIsNone(profile.personalInfo.email)
        self.assertEqual(profile.skills, ["Python"])
        self.assertEqual(profile.education, [])


class SbertCoreUnitTests(unittest.TestCase):
    def test_encode_texts_l2_normalized(self):
        texts = [
            "Software engineer building web apps with Python and React.",
            "Data scientist analyzing customer datasets with SQL and Pandas.",
        ]
        embeddings = encode_texts(texts)
        self.assertEqual(embeddings.shape, (2, 384))
        # Check L2 normalization: norm of each vector should be approximately 1.0
        norms = np.linalg.norm(embeddings, axis=1)
        np.testing.assert_allclose(norms, [1.0, 1.0], atol=1e-5)

    def test_encode_single(self):
        vec = encode_single("FastAPI developer with microservices background.")
        self.assertEqual(vec.shape, (384,))
        self.assertAlmostEqual(float(np.linalg.norm(vec)), 1.0, places=5)

    def test_compute_similarity(self):
        texts = [
            "Python backend software engineering with databases.",
            "Python backend developer creating web APIs.",
            "French cuisine chef specializing in pastry baking.",
        ]
        embs = encode_texts(texts)
        q = embs[0]
        sims = compute_similarity(q, embs)
        self.assertEqual(sims.shape, (3,))
        self.assertAlmostEqual(sims[0], 1.0, places=4)
        # Similar tech sentence should have higher cosine similarity than cooking
        self.assertGreater(sims[1], sims[2])

    def test_rank_items(self):
        items = [
            {"id": 1, "title": "Backend Python Developer"},
            {"id": 2, "title": "Pastry Chef"},
            {"id": 3, "title": "Full Stack Software Engineer"},
        ]
        corpus_texts = [f"Job: {it['title']}" for it in items]
        corpus_embs = encode_texts(corpus_texts)

        ranked = rank_items("I want a Python backend coding job", items, corpus_embs, top_k=3)
        self.assertEqual(len(ranked), 3)
        self.assertEqual(ranked[0]["id"], 1)  # Top match must be Backend Python
        self.assertGreater(ranked[0]["similarityScore"], ranked[2]["similarityScore"])

    def test_profile_to_query_string(self):
        profile = CandidateProfile(
            personalInfo=PersonalInfo(name="Alex"),
            summary="Experienced cloud architect.",
            skills=["AWS", "Terraform", "Kubernetes"],
            experience=[
                Experience(role="Cloud Engineer", company="SkyCorp", description="Managed EKS.")
            ],
            projects=[Project(title="Infra as Code", description="Automated clusters.")],
            education=[Education(degree="B.Tech", field="IT", institution="State College")],
            certifications=["AWS CKA"],
        )
        query = profile_to_query_string(profile)
        self.assertIn("Experienced cloud architect.", query)
        self.assertIn("AWS, Terraform, Kubernetes", query)
        self.assertIn("SkyCorp", query)
        self.assertIn("State College", query)


class JobRecommenderUnitTests(unittest.TestCase):
    def test_recommend_jobs_structure_and_types(self):
        resume_sample = (
            "Software engineer with 3 years experience in Python, FastAPI, Docker, "
            "PostgreSQL, React, and Git. Built high-scale REST APIs."
        )
        recs = recommend_jobs(resume_sample, top_k=5)
        self.assertEqual(len(recs), 5)

        for rec in recs:
            self.assertIn("roleId", rec)
            self.assertIn("title", rec)
            self.assertIn("category", rec)
            self.assertIn("experienceLevel", rec)
            self.assertIn("similarityScore", rec)
            self.assertIn("matchedSkills", rec)
            self.assertIn("missingSkills", rec)
            self.assertIn("explanation", rec)
            self.assertIsInstance(rec["similarityScore"], float)
            self.assertTrue(0.0 <= rec["similarityScore"] <= 100.0)
            self.assertIsInstance(rec["matchedSkills"], list)
            self.assertIsInstance(rec["missingSkills"], list)
            self.assertIsInstance(rec["explanation"], str)


class LiveFastApiIntegrationTests(unittest.TestCase):
    BASE_URL = "http://localhost:8000"

    def test_health_live(self):
        res = httpx.get(f"{self.BASE_URL}/health", timeout=10)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"status": "ok"})

    def test_resume_process_english_live(self):
        res = httpx.post(
            f"{self.BASE_URL}/resume/process",
            json={
                "resumeId": "test-en-live",
                "resumeText": "Jane Doe is an experienced software engineer skilled in Python and React.",
            },
            timeout=30,
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["resumeId"], "test-en-live")
        self.assertEqual(data["detectedLanguage"], "en")
        self.assertTrue(data["isEnglish"])
        self.assertFalse(data["translationApplied"])
        self.assertEqual(data["originalText"], data["translatedText"])

    def test_resume_process_hindi_live(self):
        hindi_sample = (
            "राहुल शर्मा दिल्ली विश्वविद्यालय से कंप्यूटर विज्ञान में स्नातक हैं। "
            "उन्हें Python, FastAPI और AWS का अनुभव है।"
        )
        res = httpx.post(
            f"{self.BASE_URL}/resume/process",
            json={
                "resumeId": "test-hi-live",
                "resumeText": hindi_sample,
            },
            timeout=40,
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["resumeId"], "test-hi-live")
        self.assertEqual(data["detectedLanguage"], "hi")
        self.assertFalse(data["isEnglish"])
        self.assertTrue(data["translationApplied"])
        self.assertEqual(data["originalText"], hindi_sample)
        # Translation must be non-empty English text
        self.assertIn("Rahul Sharma", data["translatedText"])

    def test_recommend_jobs_live(self):
        res = httpx.post(
            f"{self.BASE_URL}/recommend/jobs",
            json={
                "resumeId": "test-rec-live",
                "resumeText": "Full Stack developer proficient in Python, React, Node.js, and MongoDB.",
                "topK": 4,
            },
            timeout=30,
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["resumeId"], "test-rec-live")
        self.assertEqual(len(data["recommendations"]), 4)
        self.assertEqual(data["total"], 4)
        top = data["recommendations"][0]
        self.assertTrue(top["similarityScore"] > 50.0)

    def test_resume_extract_unconfigured_live(self):
        # GEMINI_API_KEY is not in .env, so it must return 503
        res = httpx.post(
            f"{self.BASE_URL}/resume/extract",
            json={
                "resumeId": "test-ext-live",
                "resumeText": "John Doe is a developer.",
            },
            timeout=20,
        )
        self.assertEqual(res.status_code, 503)


if __name__ == "__main__":
    unittest.main()

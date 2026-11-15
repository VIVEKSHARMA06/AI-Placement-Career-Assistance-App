"""Focused tests for Member 2's training, recommendation, and API services."""
from __future__ import annotations

import base64
import json
from pathlib import Path
import sys
from types import ModuleType, SimpleNamespace
import unittest
from unittest.mock import patch

import numpy as np

from app.api.endpoints.education_recommendation import (
    EducationRecommendationRequest,
    get_education_recommendations,
)
from app.api.endpoints.suitability import _job_description_from_file, predict_suitability
from app.schemas.suitability_schema import SuitabilityRequest
from app.services.education_recommender import recommend_education
from app.services.feature_builder import FEATURE_NAMES, build_feature_vector, parse_skill_list
from app.services.gemini_suggestion_service import (
    GeminiSuggestionNotConfiguredError,
    generate_suggestions,
)
from app.services.rf_service import predict_match_score
from ml_training.train_rf import load_training_data


BASE_DIR = Path(__file__).resolve().parent


class FeatureBuilderTests(unittest.TestCase):
    def test_feature_vector_is_fixed_order_and_finite(self):
        vector = build_feature_vector(
            "Python engineer with SQL experience",
            "Python role requiring SQL and cloud",
            ["Python", "SQL"],
            ["SQL", "Cloud"],
        )
        self.assertEqual(vector.shape, (len(FEATURE_NAMES),))
        self.assertTrue(np.isfinite(vector).all())
        self.assertGreater(vector[4], 0)
        self.assertGreater(vector[5], 0)

    def test_skill_list_accepts_json_and_delimited_values(self):
        self.assertEqual(parse_skill_list('["Python", "SQL"]'), ["Python", "SQL"])
        self.assertEqual(parse_skill_list("Python; SQL"), ["Python", "SQL"])

    def test_dataset_loads_as_normalized_match_score_target(self):
        features, target = load_training_data()
        self.assertEqual(features.shape, (2385, len(FEATURE_NAMES)))
        self.assertEqual(target.shape, (2385,))
        self.assertTrue(np.isfinite(features).all())
        self.assertGreaterEqual(float(target.min()), 0.0)
        self.assertLessEqual(float(target.max()), 1.0)


class RecommendationTests(unittest.TestCase):
    def test_education_recommender_uses_catalog_embeddings(self):
        programs = json.loads((BASE_DIR / "datasets" / "education_programs.json").read_text())
        corpus = np.zeros((len(programs), 384), dtype=np.float32)
        corpus[:, 0] = np.linspace(0.0, 1.0, len(programs))
        query = np.zeros(384, dtype=np.float32)
        query[0] = 1.0
        with patch("app.services.education_recommender.encode_single", return_value=query):
            with patch("app.services.education_recommender._catalog_embeddings", return_value=corpus):
                recommendations = recommend_education("Software engineer", top_k=3)
        self.assertEqual(len(recommendations), 3)
        self.assertTrue(all("matchScore" in item for item in recommendations))

    def test_education_endpoint_accepts_backend_aliases(self):
        request = EducationRecommendationRequest.model_validate(
            {"resumeId": "resume-1", "resumeText": "Python developer"}
        )
        with patch(
            "app.api.endpoints.education_recommendation.recommend_education",
            return_value=[{"program": "Computer Science", "matchScore": 80}],
        ):
            response = get_education_recommendations(request)
        self.assertEqual(response.resume_id, "resume-1")
        self.assertEqual(response.total, 1)


class LimeAdapterTests(unittest.TestCase):
    def test_lime_output_is_formatted_for_frontend(self):
        lime_module = ModuleType("lime")
        lime_tabular = ModuleType("lime.lime_tabular")

        class FakeExplainer:
            def __init__(self, **kwargs):
                self.feature_names = kwargs["feature_names"]

            def explain_instance(self, feature_vector, predict_fn, **kwargs):
                self.assertion = (len(feature_vector), len(self.feature_names))
                return SimpleNamespace(as_list=lambda: [("shared_token_count > 2", 0.12)])

        lime_tabular.LimeTabularExplainer = FakeExplainer
        model = SimpleNamespace(predict=lambda rows: np.zeros(len(rows)))
        bundle = {"model": model, "training_features": np.zeros((2, len(FEATURE_NAMES)))}
        with patch.dict(sys.modules, {"lime": lime_module, "lime.lime_tabular": lime_tabular}):
            with patch("app.services.lime_service.load_model_bundle", return_value=bundle):
                from app.services.lime_service import explain_prediction

                explanation = explain_prediction(np.zeros(len(FEATURE_NAMES)))
        self.assertEqual(explanation[0]["feature"], "shared_token_count > 2")
        self.assertEqual(explanation[0]["weight"], 0.12)
        self.assertEqual(explanation[0]["impact"], "positive")


class SuitabilityTests(unittest.TestCase):
    def test_trained_model_returns_bounded_score(self):
        score, vector = predict_match_score(
            "Python SQL software engineer",
            "Python developer role requiring SQL",
            ["Python", "SQL"],
        )
        self.assertGreaterEqual(score, 0.0)
        self.assertLessEqual(score, 1.0)
        self.assertEqual(vector.shape, (len(FEATURE_NAMES),))

    def test_text_upload_decodes_utf8(self):
        encoded = base64.b64encode(b"Python backend developer").decode("ascii")
        request = SuitabilityRequest.model_validate(
            {
                "jobDescriptionFile": {
                    "originalName": "role.txt",
                    "mimeType": "text/plain",
                    "contentBase64": encoded,
                },
                "candidateProfile": {"resumeText": "Python developer"},
            }
        )
        self.assertEqual(_job_description_from_file(request), "Python backend developer")

    def test_prediction_response_matches_existing_backend_contract(self):
        request = SuitabilityRequest.model_validate(
            {
                "resumeId": "resume-1",
                "jobDescription": "Python developer role",
                "candidateProfile": {"resumeText": "Python engineer", "skills": ["Python"]},
            }
        )
        explanation = [{"feature": "shared_token_count", "weight": 0.05, "impact": "positive"}]
        suggestions = ["Add a verified example of Python work."]
        with patch(
            "app.api.endpoints.suitability.predict_match_score",
            return_value=(0.65, np.zeros(len(FEATURE_NAMES))),
        ):
            with patch(
                "app.api.endpoints.suitability.explain_prediction",
                return_value=explanation,
            ):
                with patch(
                    "app.api.endpoints.suitability.generate_suggestions",
                    return_value=suggestions,
                ):
                    response = predict_suitability(request)
        self.assertEqual(response.suitability_score, 0.65)
        self.assertTrue(response.prediction_label)
        self.assertEqual(response.lime_explanation[0].feature, "shared_token_count")
        self.assertEqual(response.gemini_suggestions, suggestions)

    def test_missing_gemini_key_is_explicit(self):
        with patch("app.services.gemini_suggestion_service.settings.gemini_api_key", None):
            with self.assertRaises(GeminiSuggestionNotConfiguredError):
                generate_suggestions("resume", "job", 0.5, [])


if __name__ == "__main__":
    unittest.main()
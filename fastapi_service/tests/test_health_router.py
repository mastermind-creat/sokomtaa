"""
Tests for GET /ai/health endpoint.

Verifies:
- Returns 200 with model identifier when NLP model is loaded (Requirements 6.5, 13.2)
- Returns 503 SERVICE_UNAVAILABLE when NLP model is not loaded
"""

import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

import app.services.nlp_service as nlp_service_module
from app.main import app

client = TestClient(app, raise_server_exceptions=False)

HEADERS = {}  # /ai/health is exempt from auth middleware


class TestHealthEndpoint:
    def test_health_model_ready_returns_200(self):
        with patch.object(nlp_service_module, "nlp_model_ready", True):
            response = client.get("/ai/health")
        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "ok"
        assert body["model"] == nlp_service_module.NLP_MODEL_NAME

    def test_health_model_not_ready_returns_503(self):
        with patch.object(nlp_service_module, "nlp_model_ready", False):
            response = client.get("/ai/health")
        assert response.status_code == 503
        body = response.json()
        assert body["code"] == "SERVICE_UNAVAILABLE"

    def test_health_no_auth_required(self):
        """Health endpoint must be accessible without X-Internal-Token."""
        with patch.object(nlp_service_module, "nlp_model_ready", True):
            response = client.get("/ai/health")
        # Must not return 401
        assert response.status_code != 401

    def test_health_response_has_model_key(self):
        with patch.object(nlp_service_module, "nlp_model_ready", True):
            response = client.get("/ai/health")
        assert "model" in response.json()

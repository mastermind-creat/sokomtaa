"""
Tests for POST /ai/parse-recipe and POST /ai/parse-recipe/roundtrip.

Verifies:
- 422 on text shorter than 3 chars (Requirement 5.5)
- 422 PARSE_FAILED on unrecognisable input (Requirement 5.6)
- 503 SERVICE_UNAVAILABLE when NLP model not loaded (Requirement 6.6)
- Correct commodity structure for valid Kenyan meal input (Requirements 5.2, 5.4)
- Round-trip serialisation fidelity (Property 15)
"""

import json
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

import app.services.nlp_service as nlp_service_module
from app.main import app

AUTH = {"X-Internal-Token": "test-internal-token"}
client = TestClient(app, raise_server_exceptions=False)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _post(text: str, user_id: int = 1) -> dict:
    return client.post(
        "/ai/parse-recipe",
        json={"text": text, "user_id": user_id},
        headers=AUTH,
    )


# ---------------------------------------------------------------------------
# Validation errors
# ---------------------------------------------------------------------------

class TestParseRecipeValidation:
    def test_empty_text_returns_422(self):
        resp = _post("")
        assert resp.status_code == 422

    def test_too_short_text_returns_422(self):
        resp = _post("ab")
        assert resp.status_code == 422

    def test_two_char_whitespace_returns_422(self):
        resp = _post("  ")
        assert resp.status_code == 422

    def test_missing_text_field_returns_422(self):
        resp = client.post("/ai/parse-recipe", json={"user_id": 1}, headers=AUTH)
        assert resp.status_code == 422

    def test_missing_user_id_returns_422(self):
        resp = client.post("/ai/parse-recipe", json={"text": "ugali for 4"}, headers=AUTH)
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# NLP model not loaded
# ---------------------------------------------------------------------------

class TestParseRecipeModelNotLoaded:
    def test_returns_503_when_model_not_ready(self):
        with patch.object(nlp_service_module, "nlp_model_ready", False):
            resp = _post("I want ugali for 4 people")
        assert resp.status_code == 503
        assert resp.json()["detail"]["code"] == "SERVICE_UNAVAILABLE"


# ---------------------------------------------------------------------------
# Parse failures
# ---------------------------------------------------------------------------

class TestParseRecipeParseFailures:
    def test_unrecognisable_text_returns_422(self):
        with patch.object(nlp_service_module, "nlp_model_ready", True):
            resp = _post("I want something random to eat")
        # ParseError → 422 PARSE_FAILED
        assert resp.status_code == 422
        detail = resp.json()["detail"]
        assert detail["code"] == "PARSE_FAILED"

    def test_no_headcount_returns_422(self):
        with patch.object(nlp_service_module, "nlp_model_ready", True):
            resp = _post("I want ugali and sukuma wiki")
        assert resp.status_code == 422

    def test_no_meal_returns_422(self):
        with patch.object(nlp_service_module, "nlp_model_ready", True):
            resp = _post("cook something for 5 people")
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Successful parse — commodity structure
# ---------------------------------------------------------------------------

class TestParseRecipeSuccess:
    def _get_commodities(self, text: str) -> list[dict]:
        with patch.object(nlp_service_module, "nlp_model_ready", True):
            with patch("app.routers.recipe_parser._get_redis") as mock_redis:
                mock_redis.return_value = MagicMock()
                resp = _post(text)
        assert resp.status_code == 200, resp.text
        return resp.json()["commodities"]

    def test_ugali_commodities_have_correct_structure(self):
        commodities = self._get_commodities("I want ugali for 4 people")
        assert len(commodities) > 0
        for item in commodities:
            assert item["name"].strip() != "", "name must be non-empty"
            assert item["quantity"] > 0, "quantity must be positive"
            assert item["unit"].strip() != "", "unit must be non-empty"

    def test_sukuma_wiki_parsed(self):
        commodities = self._get_commodities("sukuma wiki for 2 people")
        names = [c["name"].lower() for c in commodities]
        assert any("sukuma" in n for n in names)

    def test_multiple_meals_combined(self):
        commodities = self._get_commodities("ugali and sukuma wiki for 3 people")
        assert len(commodities) > 0

    def test_response_has_session_id(self):
        with patch.object(nlp_service_module, "nlp_model_ready", True):
            with patch("app.routers.recipe_parser._get_redis") as mock_redis:
                mock_redis.return_value = MagicMock()
                resp = _post("rice for 4 people")
        assert resp.status_code == 200
        assert "session_id" in resp.json()
        assert resp.json()["session_id"] != ""

    def test_chai_contains_tea_leaves(self):
        commodities = self._get_commodities("chai for 2 people")
        names = [c["name"].lower() for c in commodities]
        assert any("tea" in n for n in names)

    def test_scaling_doubles_with_headcount(self):
        with patch.object(nlp_service_module, "nlp_model_ready", True):
            with patch("app.routers.recipe_parser._get_redis") as mock_redis:
                mock_redis.return_value = MagicMock()
                resp2 = _post("ugali for 2 people")
                resp4 = _post("ugali for 4 people")
        assert resp2.status_code == 200
        assert resp4.status_code == 200
        qty_map_2 = {c["name"]: c["quantity"] for c in resp2.json()["commodities"]}
        qty_map_4 = {c["name"]: c["quantity"] for c in resp4.json()["commodities"]}
        for name in qty_map_2:
            assert abs(qty_map_4[name] - qty_map_2[name] * 2) < 1e-5

    def test_unauthenticated_request_returns_401(self):
        resp = client.post("/ai/parse-recipe", json={"text": "ugali for 4", "user_id": 1})
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Round-trip endpoint (Property 15)
# ---------------------------------------------------------------------------

class TestRoundTrip:
    def test_roundtrip_preserves_commodity_count(self):
        body = {
            "commodities": [
                {"name": "Maize flour", "quantity": 1.0, "unit": "kg"},
                {"name": "Water", "quantity": 2.0, "unit": "litre"},
            ],
            "session_id": "test-session-123",
        }
        resp = client.post("/ai/parse-recipe/roundtrip", json=body, headers=AUTH)
        assert resp.status_code == 200
        result = resp.json()
        assert len(result["commodities"]) == 2

    def test_roundtrip_byte_for_byte_identical(self):
        """Serialise → deserialise → re-serialise must be identical (Property 15)."""
        body = {
            "commodities": [
                {"name": "Rice", "quantity": 0.5, "unit": "kg"},
                {"name": "Cooking oil", "quantity": 0.04, "unit": "litre"},
            ],
            "session_id": "rt-session-abc",
        }
        resp = client.post("/ai/parse-recipe/roundtrip", json=body, headers=AUTH)
        assert resp.status_code == 200
        result = resp.json()
        # Re-serialise original and returned — commodity data must match
        orig_commodities = sorted(body["commodities"], key=lambda x: x["name"])
        resp_commodities = sorted(result["commodities"], key=lambda x: x["name"])
        assert json.dumps(orig_commodities) == json.dumps(resp_commodities)

    def test_roundtrip_session_id_preserved(self):
        body = {
            "commodities": [{"name": "Tea leaves", "quantity": 0.01, "unit": "kg"}],
            "session_id": "my-session",
        }
        resp = client.post("/ai/parse-recipe/roundtrip", json=body, headers=AUTH)
        assert resp.json()["session_id"] == "my-session"

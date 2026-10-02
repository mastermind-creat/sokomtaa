"""
Tests for POST /ai/pantry-exclusion.

Verifies:
- 404 SESSION_NOT_FOUND when session missing (Requirement 7.5)
- Original list returned unchanged when pantry_items is empty (Requirement 7.6)
- Confirmed pantry items removed from result (Requirement 7.2)
- Empty list returned when all items confirmed (Requirement 7.3)
- No zero-quantity items in output (Requirement 7.7)
"""

import json
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app

AUTH = {"X-Internal-Token": "test-internal-token"}
client = TestClient(app, raise_server_exceptions=False)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_session(commodities: list[dict]) -> MagicMock:
    """Return a mock Redis client pre-loaded with a session."""
    mock_r = MagicMock()
    mock_r.hget.return_value = json.dumps(commodities)
    mock_r.hset.return_value = True
    return mock_r


def _exclude(session_id: str, pantry_items: list[str]) -> dict:
    response = client.post(
        "/ai/pantry-exclusion",
        json={"session_id": session_id, "pantry_items": pantry_items},
        headers=AUTH,
    )
    return response


_SAMPLE_COMMODITIES = [
    {"name": "Maize flour", "quantity": 1.0, "unit": "kg"},
    {"name": "Sukuma wiki (kale)", "quantity": 0.3, "unit": "kg"},
    {"name": "Cooking oil", "quantity": 0.04, "unit": "litre"},
]


# ---------------------------------------------------------------------------
# Session not found
# ---------------------------------------------------------------------------

class TestPantrySessionNotFound:
    def test_missing_session_returns_404(self):
        with patch("app.services.pantry_service._get_redis") as mock_redis:
            mock_r = MagicMock()
            mock_r.hget.return_value = None  # session not found
            mock_redis.return_value = mock_r
            resp = _exclude("nonexistent-session", ["Maize flour"])
        assert resp.status_code == 404
        detail = resp.json()["detail"]
        assert detail["code"] == "SESSION_NOT_FOUND"


# ---------------------------------------------------------------------------
# Empty pantry — original list unchanged
# ---------------------------------------------------------------------------

class TestPantryEmptyPantryItems:
    def test_empty_pantry_returns_original_list(self):
        with patch("app.services.pantry_service._get_redis") as mock_redis:
            mock_redis.return_value = _make_session(_SAMPLE_COMMODITIES)
            resp = _exclude("sess-1", [])
        assert resp.status_code == 200
        commodities = resp.json()["commodities"]
        assert len(commodities) == 3


# ---------------------------------------------------------------------------
# Partial pantry exclusion
# ---------------------------------------------------------------------------

class TestPantryPartialExclusion:
    def test_confirmed_item_removed(self):
        with patch("app.services.pantry_service._get_redis") as mock_redis:
            mock_redis.return_value = _make_session(_SAMPLE_COMMODITIES)
            resp = _exclude("sess-2", ["Maize flour"])
        assert resp.status_code == 200
        names = [c["name"] for c in resp.json()["commodities"]]
        assert "Maize flour" not in names

    def test_non_confirmed_items_preserved(self):
        with patch("app.services.pantry_service._get_redis") as mock_redis:
            mock_redis.return_value = _make_session(_SAMPLE_COMMODITIES)
            resp = _exclude("sess-3", ["Maize flour"])
        names = [c["name"] for c in resp.json()["commodities"]]
        assert "Sukuma wiki (kale)" in names
        assert "Cooking oil" in names

    def test_case_insensitive_matching(self):
        with patch("app.services.pantry_service._get_redis") as mock_redis:
            mock_redis.return_value = _make_session(_SAMPLE_COMMODITIES)
            resp = _exclude("sess-4", ["MAIZE FLOUR"])
        names = [c["name"] for c in resp.json()["commodities"]]
        assert "Maize flour" not in names

    def test_multiple_items_removed(self):
        with patch("app.services.pantry_service._get_redis") as mock_redis:
            mock_redis.return_value = _make_session(_SAMPLE_COMMODITIES)
            resp = _exclude("sess-5", ["Maize flour", "Cooking oil"])
        commodities = resp.json()["commodities"]
        assert len(commodities) == 1
        assert commodities[0]["name"] == "Sukuma wiki (kale)"


# ---------------------------------------------------------------------------
# All items in pantry → empty result
# ---------------------------------------------------------------------------

class TestPantryAllItemsConfirmed:
    def test_all_pantry_items_returns_empty_list(self):
        with patch("app.services.pantry_service._get_redis") as mock_redis:
            mock_redis.return_value = _make_session(_SAMPLE_COMMODITIES)
            resp = _exclude("sess-6", ["Maize flour", "Sukuma wiki (kale)", "Cooking oil"])
        assert resp.status_code == 200
        assert resp.json()["commodities"] == []


# ---------------------------------------------------------------------------
# No zero-quantity items (Requirement 7.7)
# ---------------------------------------------------------------------------

class TestPantryNoZeroQuantity:
    def test_no_zero_quantity_items_in_output(self):
        commodities_with_zero = [
            {"name": "Rice", "quantity": 0.5, "unit": "kg"},
            {"name": "Salt", "quantity": 0.01, "unit": "kg"},
        ]
        with patch("app.services.pantry_service._get_redis") as mock_redis:
            mock_redis.return_value = _make_session(commodities_with_zero)
            resp = _exclude("sess-7", ["Salt"])
        for item in resp.json()["commodities"]:
            assert item["quantity"] > 0, f"Zero-quantity item found: {item}"


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------

class TestPantryAuth:
    def test_unauthenticated_returns_401(self):
        resp = client.post(
            "/ai/pantry-exclusion",
            json={"session_id": "s", "pantry_items": []},
        )
        assert resp.status_code == 401

"""
Property-based tests using Hypothesis.

Properties covered:
- Property 12: Recipe parse produces valid commodity structure
- Property 13: Headcount scaling is linear (metamorphic)
- Property 14: Recipe parse idempotence
- Property 15: RecipeResponse serialisation round-trip
- Property 16: Pantry deduction removes specified items
- Property 17: No zero-quantity items after pantry exclusion
"""

import json
import pytest
from hypothesis import given, settings as hyp_settings, assume, HealthCheck
from hypothesis import strategies as st
from unittest.mock import patch, MagicMock

import app.services.nlp_service as nlp_service_module
from app.models.schemas import CommodityItem, RecipeResponse
from app.services.recipe_scaler import scale_recipe, scale_recipes, _RATIOS
from app.services.pantry_service import exclude_pantry


# ---------------------------------------------------------------------------
# Strategies
# ---------------------------------------------------------------------------

supported_meals = st.sampled_from(list(_RATIOS.keys()))
headcounts = st.integers(min_value=1, max_value=50)

commodity_item_st = st.builds(
    CommodityItem,
    name=st.text(min_size=1, max_size=30).filter(lambda s: s.strip()),
    quantity=st.floats(min_value=0.001, max_value=100.0, allow_nan=False, allow_infinity=False),
    unit=st.sampled_from(["kg", "litre", "piece", "bunch"]),
)

recipe_response_st = st.builds(
    RecipeResponse,
    commodities=st.lists(commodity_item_st, min_size=1, max_size=10),
    session_id=st.uuids().map(str),
)


# ---------------------------------------------------------------------------
# Property 12: Recipe parse produces valid commodity structure
# ---------------------------------------------------------------------------

class TestProperty12RecipeCommodityStructure:
    @given(meal=supported_meals, headcount=headcounts)
    @hyp_settings(max_examples=50, suppress_health_check=[HealthCheck.too_slow])
    def test_every_commodity_has_non_empty_name(self, meal, headcount):
        items = scale_recipe(meal, headcount)
        for item in items:
            assert item.name.strip() != "", f"Empty name in {meal}"

    @given(meal=supported_meals, headcount=headcounts)
    @hyp_settings(max_examples=50, suppress_health_check=[HealthCheck.too_slow])
    def test_every_commodity_has_positive_quantity(self, meal, headcount):
        items = scale_recipe(meal, headcount)
        for item in items:
            assert item.quantity > 0, f"Non-positive quantity for {item.name} in {meal}"

    @given(meal=supported_meals, headcount=headcounts)
    @hyp_settings(max_examples=50, suppress_health_check=[HealthCheck.too_slow])
    def test_every_commodity_has_non_empty_unit(self, meal, headcount):
        items = scale_recipe(meal, headcount)
        for item in items:
            assert item.unit.strip() != "", f"Empty unit for {item.name} in {meal}"


# ---------------------------------------------------------------------------
# Property 13: Headcount scaling is linear (metamorphic)
# ---------------------------------------------------------------------------

class TestProperty13HeadcountScalingLinear:
    @given(meal=supported_meals, headcount=headcounts)
    @hyp_settings(max_examples=50, suppress_health_check=[HealthCheck.too_slow])
    def test_doubling_headcount_doubles_every_quantity(self, meal, headcount):
        items_n = scale_recipe(meal, headcount)
        items_2n = scale_recipe(meal, headcount * 2)
        qty_n = {i.name: i.quantity for i in items_n}
        qty_2n = {i.name: i.quantity for i in items_2n}
        for name in qty_n:
            expected = qty_n[name] * 2
            actual = qty_2n[name]
            assert abs(actual - expected) < 1e-5, (
                f"{meal}/{name}: expected {expected}, got {actual}"
            )


# ---------------------------------------------------------------------------
# Property 14: Recipe parse idempotence
# ---------------------------------------------------------------------------

class TestProperty14RecipeParseIdempotence:
    @given(meal=supported_meals, headcount=headcounts)
    @hyp_settings(max_examples=50, suppress_health_check=[HealthCheck.too_slow])
    def test_parsing_same_input_twice_produces_equivalent_result(self, meal, headcount):
        result_1 = scale_recipe(meal, headcount)
        result_2 = scale_recipe(meal, headcount)
        assert len(result_1) == len(result_2)
        for i1, i2 in zip(result_1, result_2):
            assert i1.name == i2.name
            assert abs(i1.quantity - i2.quantity) < 1e-9
            assert i1.unit == i2.unit


# ---------------------------------------------------------------------------
# Property 15: RecipeResponse serialisation round-trip
# ---------------------------------------------------------------------------

class TestProperty15SerialisationRoundTrip:
    @given(recipe=recipe_response_st)
    @hyp_settings(max_examples=50, suppress_health_check=[HealthCheck.too_slow])
    def test_serialise_deserialise_reserialise_is_identical(self, recipe):
        serialised_1 = json.dumps(
            sorted(
                [c.model_dump() for c in recipe.commodities],
                key=lambda x: x["name"],
            )
        )
        # Roundtrip through Pydantic
        raw = recipe.model_dump()
        restored = RecipeResponse.model_validate(raw)
        serialised_2 = json.dumps(
            sorted(
                [c.model_dump() for c in restored.commodities],
                key=lambda x: x["name"],
            )
        )
        assert serialised_1 == serialised_2

    @given(recipe=recipe_response_st)
    @hyp_settings(max_examples=50, suppress_health_check=[HealthCheck.too_slow])
    def test_commodity_count_preserved_under_roundtrip(self, recipe):
        raw = recipe.model_dump()
        restored = RecipeResponse.model_validate(raw)
        assert len(recipe.commodities) == len(restored.commodities)


# ---------------------------------------------------------------------------
# Property 16: Pantry deduction removes specified items
# ---------------------------------------------------------------------------

def _make_redis_mock(commodities: list[CommodityItem]) -> MagicMock:
    mock_r = MagicMock()
    mock_r.hget.return_value = json.dumps([c.model_dump() for c in commodities])
    mock_r.hset.return_value = True
    return mock_r


class TestProperty16PantryDeductionRemovesItems:
    @given(commodities=st.lists(commodity_item_st, min_size=1, max_size=8, unique_by=lambda c: c.name))
    @hyp_settings(max_examples=50, suppress_health_check=[HealthCheck.too_slow])
    def test_confirmed_pantry_items_absent_from_result(self, commodities):
        assume(len(commodities) >= 1)
        pantry_items = [c.name for c in commodities[:1]]

        with patch("app.services.pantry_service._get_redis") as mock_redis:
            mock_redis.return_value = _make_redis_mock(commodities)
            result = exclude_pantry("test-session", pantry_items)

        result_names = {c.name for c in result}
        for name in pantry_items:
            assert name not in result_names, f"{name} should have been excluded"

    @given(commodities=st.lists(commodity_item_st, min_size=1, max_size=8, unique_by=lambda c: c.name))
    @hyp_settings(max_examples=50, suppress_health_check=[HealthCheck.too_slow])
    def test_all_pantry_items_returns_empty_list(self, commodities):
        pantry_items = [c.name for c in commodities]

        with patch("app.services.pantry_service._get_redis") as mock_redis:
            mock_redis.return_value = _make_redis_mock(commodities)
            result = exclude_pantry("test-session", pantry_items)

        assert result == []

    @given(commodities=st.lists(commodity_item_st, min_size=1, max_size=8, unique_by=lambda c: c.name))
    @hyp_settings(max_examples=50, suppress_health_check=[HealthCheck.too_slow])
    def test_empty_pantry_returns_original_list_unchanged(self, commodities):
        with patch("app.services.pantry_service._get_redis") as mock_redis:
            mock_redis.return_value = _make_redis_mock(commodities)
            result = exclude_pantry("test-session", [])

        assert len(result) == len(commodities)


# ---------------------------------------------------------------------------
# Property 17: No zero-quantity items after pantry exclusion
# ---------------------------------------------------------------------------

class TestProperty17NoZeroQuantityAfterExclusion:
    @given(commodities=st.lists(commodity_item_st, min_size=1, max_size=8, unique_by=lambda c: c.name))
    @hyp_settings(max_examples=50, suppress_health_check=[HealthCheck.too_slow])
    def test_all_remaining_items_have_positive_quantity(self, commodities):
        # Use a random subset as pantry items
        pantry_items = [c.name for c in commodities[:len(commodities) // 2]]

        with patch("app.services.pantry_service._get_redis") as mock_redis:
            mock_redis.return_value = _make_redis_mock(commodities)
            result = exclude_pantry("test-session", pantry_items)

        for item in result:
            assert item.quantity > 0, f"Zero-quantity item found: {item.name}"


# ---------------------------------------------------------------------------
# Property 19: Internal Endpoints Reject Unauthenticated Requests (FastAPI)
# Validates: Requirements 14.2
# ---------------------------------------------------------------------------

from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

_auth_test_client = TestClient(app, raise_server_exceptions=False)


class TestProperty19InternalEndpointAuth:
    """Feature: polyglot-architecture-upgrade, Property 19: Internal Endpoints Reject Unauthenticated Requests (FastAPI)"""

    @given(token=st.text(max_size=50).filter(lambda t: t != settings.internal_token))
    @hyp_settings(max_examples=50, suppress_health_check=[HealthCheck.too_slow])
    def test_invalid_token_returns_401_on_protected_endpoints(self, token):
        endpoints = [
            ("/ai/parse-recipe", {"text": "ugali for 2", "user_id": 1}),
            ("/ai/pantry-exclusion", {"session_id": "test-uuid", "pantry_items": ["salt"]}),
            ("/ai/match-traders", {"session_id": "test-uuid", "resident_lat": -0.0917, "resident_lon": 34.7679}),
        ]
        for path, body in endpoints:
            resp = _auth_test_client.post(path, json=body, headers={"X-Internal-Token": token})
            assert resp.status_code == 401
            assert resp.json().get("code") == "UNAUTHENTICATED"

    def test_missing_token_header_returns_401(self):
        endpoints = [
            ("/ai/parse-recipe", {"text": "ugali for 2", "user_id": 1}),
            ("/ai/pantry-exclusion", {"session_id": "test-uuid", "pantry_items": ["salt"]}),
            ("/ai/match-traders", {"session_id": "test-uuid", "resident_lat": -0.0917, "resident_lon": 34.7679}),
        ]
        for path, body in endpoints:
            resp = _auth_test_client.post(path, json=body)
            assert resp.status_code == 401
            assert resp.json().get("code") == "UNAUTHENTICATED"


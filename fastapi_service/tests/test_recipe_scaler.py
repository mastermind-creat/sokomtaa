"""
Unit tests for recipe_scaler — scaling logic and commodity structure.
"""

import pytest
from app.services.recipe_scaler import scale_recipe, scale_recipes
from app.models.schemas import CommodityItem


class TestScaleRecipe:
    def test_returns_list_of_commodity_items(self):
        items = scale_recipe("ugali", 4)
        assert isinstance(items, list)
        assert all(isinstance(i, CommodityItem) for i in items)

    def test_non_empty_name(self):
        for item in scale_recipe("ugali", 2):
            assert item.name.strip() != ""

    def test_positive_quantity(self):
        for item in scale_recipe("rice", 3):
            assert item.quantity > 0

    def test_non_empty_unit(self):
        for item in scale_recipe("beans", 5):
            assert item.unit.strip() != ""

    def test_linear_scaling(self):
        """Doubling headcount must double every quantity (Property 13)."""
        items_2 = scale_recipe("ugali", 2)
        items_4 = scale_recipe("ugali", 4)
        qty_map_2 = {i.name: i.quantity for i in items_2}
        qty_map_4 = {i.name: i.quantity for i in items_4}
        for name in qty_map_2:
            assert abs(qty_map_4[name] - qty_map_2[name] * 2) < 1e-6, (
                f"{name}: {qty_map_4[name]} != {qty_map_2[name] * 2}"
            )

    def test_all_kenyan_meals_supported(self):
        """All 11 required meals must be in the ratio table."""
        required = [
            "ugali", "sukuma wiki", "eggs", "rice", "beans",
            "chapati", "githeri", "nyama choma", "pilau", "mandazi", "chai",
        ]
        for meal in required:
            items = scale_recipe(meal, 2)
            assert len(items) > 0, f"No ingredients for {meal}"

    def test_headcount_one(self):
        """Scale to 1 person — should match per-person ratios directly."""
        items = scale_recipe("chai", 1)
        assert all(i.quantity > 0 for i in items)

    def test_unknown_meal_raises(self):
        with pytest.raises(KeyError):
            scale_recipe("pizza", 4)


class TestScaleRecipes:
    def test_merges_multiple_meals(self):
        items = scale_recipes(["ugali", "sukuma wiki"], 4)
        names = [i.name for i in items]
        # Both sets of ingredients should be present
        assert any("flour" in n.lower() or "unga" in n.lower() for n in names)
        assert any("sukuma" in n.lower() for n in names)

    def test_deduplicates_shared_ingredients(self):
        """Meals sharing an ingredient must sum quantities, not duplicate entries."""
        items = scale_recipes(["sukuma wiki", "beans"], 4)
        names = [i.name for i in items]
        # Both meals use "Cooking oil" and "Tomatoes" / "Onions"
        onion_entries = [i for i in items if "onion" in i.name.lower()]
        assert len(onion_entries) == 1, "Onions should appear only once"

    def test_unknown_meal_skipped(self):
        """Unknown meals are skipped without raising an error."""
        items = scale_recipes(["ugali", "unknown_meal"], 4)
        assert len(items) > 0

    def test_empty_meals_list(self):
        items = scale_recipes([], 4)
        assert items == []

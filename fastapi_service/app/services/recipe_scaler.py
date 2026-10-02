"""
Recipe scaler: multiplies per-person ingredient ratios by the requested headcount.

Scaling is strictly linear — doubling the headcount doubles every quantity
(Requirements 5.3).
"""

from app.models.schemas import CommodityItem

# ---------------------------------------------------------------------------
# Per-person ingredient ratio table (Requirements 5.7)
# Structure: meal_name → list of (ingredient_name, quantity_per_person, unit)
# ---------------------------------------------------------------------------
_RATIOS: dict[str, list[tuple[str, float, str]]] = {
    "ugali": [
        ("Maize flour (unga wa mahindi)", 0.25, "kg"),
        ("Water", 0.5, "litre"),
    ],
    "sukuma wiki": [
        ("Sukuma wiki (kale)", 0.15, "kg"),
        ("Cooking oil", 0.02, "litre"),
        ("Onions", 0.05, "kg"),
        ("Tomatoes", 0.05, "kg"),
    ],
    "eggs": [
        ("Eggs", 2.0, "piece"),
        ("Cooking oil", 0.01, "litre"),
    ],
    "rice": [
        ("Rice", 0.125, "kg"),
        ("Water", 0.25, "litre"),
        ("Cooking oil", 0.01, "litre"),
        ("Salt", 0.005, "kg"),
    ],
    "beans": [
        ("Beans (maharagwe)", 0.1, "kg"),
        ("Tomatoes", 0.05, "kg"),
        ("Onions", 0.05, "kg"),
        ("Cooking oil", 0.02, "litre"),
    ],
    "chapati": [
        ("Wheat flour (unga wa ngano)", 0.1, "kg"),
        ("Cooking oil", 0.02, "litre"),
        ("Water", 0.05, "litre"),
        ("Salt", 0.002, "kg"),
    ],
    "githeri": [
        ("Maize (mahindi)", 0.1, "kg"),
        ("Beans (maharagwe)", 0.05, "kg"),
        ("Onions", 0.05, "kg"),
        ("Tomatoes", 0.05, "kg"),
        ("Cooking oil", 0.015, "litre"),
    ],
    "nyama choma": [
        ("Meat (nyama)", 0.3, "kg"),
        ("Salt", 0.005, "kg"),
        ("Lemon", 0.5, "piece"),
    ],
    "pilau": [
        ("Rice", 0.125, "kg"),
        ("Meat (nyama)", 0.15, "kg"),
        ("Onions", 0.075, "kg"),
        ("Tomatoes", 0.05, "kg"),
        ("Pilau masala", 0.005, "kg"),
        ("Cooking oil", 0.02, "litre"),
    ],
    "mandazi": [
        ("Wheat flour (unga wa ngano)", 0.1, "kg"),
        ("Coconut milk", 0.05, "litre"),
        ("Sugar", 0.02, "kg"),
        ("Cooking oil (frying)", 0.05, "litre"),
    ],
    "chai": [
        ("Tea leaves", 0.005, "kg"),
        ("Milk", 0.15, "litre"),
        ("Sugar", 0.02, "kg"),
        ("Water", 0.1, "litre"),
    ],
}


def scale_recipe(meal: str, headcount: int) -> list[CommodityItem]:
    """
    Return a list of CommodityItem for *meal* scaled to *headcount* people.

    Scaling is linear: every ingredient quantity equals (per-person ratio × headcount).
    Raises KeyError if *meal* is not in the ratio table.
    """
    ratios = _RATIOS[meal]
    return [
        CommodityItem(
            name=ingredient,
            quantity=round(qty_per_person * headcount, 6),
            unit=unit,
        )
        for ingredient, qty_per_person, unit in ratios
    ]


def scale_recipes(meals: list[str], headcount: int) -> list[CommodityItem]:
    """
    Merge scaled commodities for multiple meals into a single deduplicated list.

    When the same ingredient appears in multiple meals, quantities are summed.
    """
    merged: dict[tuple[str, str], float] = {}
    for meal in meals:
        if meal not in _RATIOS:
            continue
        for item in scale_recipe(meal, headcount):
            key = (item.name, item.unit)
            merged[key] = round(merged.get(key, 0.0) + item.quantity, 6)

    return [CommodityItem(name=name, quantity=qty, unit=unit) for (name, unit), qty in merged.items()]

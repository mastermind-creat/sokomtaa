"""
Trader match router.

POST /ai/match-traders — load session commodities, call Laravel internal endpoint,
present lowest-price and highest-rated options per commodity.
"""

import json
import logging
from typing import Any

import redis as redis_lib
from fastapi import APIRouter, HTTPException

from app.config import settings
from app.models.schemas import CommodityItem, TraderMatchRequest
from app.services.laravel_client import match_traders, ServiceUnavailableError

logger = logging.getLogger(__name__)
router = APIRouter()


def _get_redis() -> redis_lib.Redis:
    return redis_lib.from_url(settings.redis_url, decode_responses=True)


def _best_options(traders: list[dict[str, Any]]) -> dict[str, Any]:
    """
    From a list of trader options for a single commodity, return:
    - lowest_price: the trader with the smallest price
    - highest_rated: the trader with the highest average_rating
    """
    if not traders:
        return {"lowest_price": None, "highest_rated": None}

    lowest = min(traders, key=lambda t: float(t.get("price", 0)))
    highest = max(traders, key=lambda t: float(t.get("average_rating", 0)))
    return {"lowest_price": lowest, "highest_rated": highest}


@router.post("/match-traders")
async def match_traders_route(request: TraderMatchRequest) -> dict[str, Any]:
    """
    Load the session's commodity list from Redis, call Laravel to find matching
    traders, and return best options per commodity.

    Requirements 8.2–8.5:
    - Present lowest-price and highest-rated options per commodity
    - Inform client when no traders stock an item
    - Exclude unavailable items from checkout assembly
    """
    r = _get_redis()
    raw = r.hget(f"ai:session:{request.session_id}", "commodities")
    if raw is None:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "SESSION_NOT_FOUND",
                "message": "Session expired or not found. Please restart the AI pipeline from Step 1.",
            },
        )

    commodities = [CommodityItem(**item) for item in json.loads(raw)]

    try:
        laravel_response = await match_traders(
            commodities=commodities,
            resident_lat=request.resident_lat,
            resident_lon=request.resident_lon,
            radius_km=request.radius_km,
        )
    except ServiceUnavailableError as exc:
        raise HTTPException(
            status_code=503,
            detail={"code": "SERVICE_UNAVAILABLE", "message": "Trader matching service is temporarily unavailable."},
        ) from exc

    # laravel_response expected shape:
    # { "data": { "<commodity_name>": [ { trader fields } ] } }
    commodity_matches: dict[str, list[dict]] = laravel_response.get("data", {})

    results: list[dict[str, Any]] = []
    checkout_items: list[dict[str, Any]] = []

    for commodity in commodities:
        traders_for_item = commodity_matches.get(commodity.name, [])

        if not traders_for_item:
            results.append({
                "commodity": commodity.model_dump(),
                "available": False,
                "message": f"No traders within {request.radius_km} km currently stock {commodity.name}.",
                "options": None,
            })
            continue

        options = _best_options(traders_for_item)
        results.append({
            "commodity": commodity.model_dump(),
            "available": True,
            "options": options,
        })

        # Use lowest-price option as default checkout item
        if options["lowest_price"]:
            checkout_items.append({
                "commodity_name": commodity.name,
                "quantity": commodity.quantity,
                "unit": commodity.unit,
                **options["lowest_price"],
            })

    # Persist checkout assembly in session
    try:
        r.hset(
            f"ai:session:{request.session_id}",
            mapping={
                "checkout_items": json.dumps(checkout_items),
                "step": "fulfilment",
            },
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("Redis session update failed: %s", exc)

    return {
        "session_id": request.session_id,
        "matches": results,
        "checkout_items": checkout_items,
    }

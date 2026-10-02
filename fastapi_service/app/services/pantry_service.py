"""
Pantry exclusion service.

Loads a session from Redis, deducts confirmed pantry items from the commodity
list, and returns the updated list.  Zero-quantity items are removed entirely
(Requirements 7.7).
"""

import json
import logging

import redis as redis_lib
from fastapi import HTTPException

from app.config import settings
from app.models.schemas import CommodityItem

logger = logging.getLogger(__name__)


def _get_redis() -> redis_lib.Redis:
    return redis_lib.from_url(settings.redis_url, decode_responses=True)


def exclude_pantry(session_id: str, pantry_items: list[str]) -> list[CommodityItem]:
    """
    Deduct *pantry_items* from the commodities stored in the Redis session.

    Rules (Requirements 7.1–7.7):
    - If session not found → HTTP 404 SESSION_NOT_FOUND
    - If pantry_items is empty → return original list unchanged (Req 7.6)
    - Confirmed pantry items are removed / have quantity zeroed out (Req 7.2)
    - If all items are in pantry → return empty list (Req 7.3)
    - No item with quantity ≤ 0 may appear in the output (Req 7.7)
    """
    r = _get_redis()
    raw = r.hget(f"ai:session:{session_id}", "commodities")
    if raw is None:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "SESSION_NOT_FOUND",
                "message": "Session expired or not found. Please restart the AI pipeline from Step 1.",
            },
        )

    commodities: list[CommodityItem] = [CommodityItem(**item) for item in json.loads(raw)]

    # Empty pantry list → return original unchanged (Requirement 7.6)
    if not pantry_items:
        return commodities

    # Normalise pantry item names for case-insensitive matching
    pantry_normalised = {item.strip().lower() for item in pantry_items}

    updated: list[CommodityItem] = []
    for commodity in commodities:
        if commodity.name.strip().lower() in pantry_normalised:
            # Item confirmed in pantry — fully deducted; do not add to output
            continue
        updated.append(commodity)

    # Persist updated commodity list back to session
    try:
        r.hset(
            f"ai:session:{session_id}",
            "commodities",
            json.dumps([c.model_dump() for c in updated]),
        )
        r.hset(f"ai:session:{session_id}", "step", "trader_matching")
    except Exception as exc:  # noqa: BLE001
        logger.error("Redis session update failed for session %s: %s", session_id, exc)

    return updated

"""
Recipe parser router.

POST /ai/parse-recipe        — parse natural-language text into a commodity list
POST /ai/parse-recipe/roundtrip — deserialise → re-serialise (Property 15 test hook)
"""

import uuid
import json
import logging

import redis as redis_lib
from fastapi import APIRouter, HTTPException

from app.config import settings
from app.models.schemas import RecipeRequest, RecipeResponse, CommodityItem
from app.services import nlp_service
from app.services.nlp_service import ParseError
from app.services.recipe_scaler import scale_recipes

logger = logging.getLogger(__name__)
router = APIRouter()

SESSION_TTL = 60 * 30  # 30 minutes


def _get_redis() -> redis_lib.Redis:
    return redis_lib.from_url(settings.redis_url, decode_responses=True)


@router.post("/parse-recipe", response_model=RecipeResponse)
async def parse_recipe(request: RecipeRequest) -> RecipeResponse:
    """Parse a natural-language recipe request and return a structured commodity list."""

    # Requirements 6.6 — refuse if NLP model is not loaded
    if not nlp_service.nlp_model_ready:
        raise HTTPException(
            status_code=503,
            detail={"code": "SERVICE_UNAVAILABLE", "message": "AI model is loading. Please try again shortly."},
        )

    # text length already validated by Pydantic validator (≥ 3 chars)

    try:
        meals, headcount = nlp_service.parse(request.text)
    except ParseError as exc:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "PARSE_FAILED",
                "message": f"Could not extract {exc.missing} from your text.",
            },
        ) from exc

    commodities = scale_recipes(meals, headcount)

    session_id = str(uuid.uuid4())
    session_data = {
        "user_id": str(request.user_id),
        "step": "pantry_exclusion",
        "commodities": json.dumps([c.model_dump() for c in commodities]),
        "original_commodities": json.dumps([c.model_dump() for c in commodities]),
        "created_at": str(int(__import__("time").time())),
    }

    try:
        r = _get_redis()
        r.hset(f"ai:session:{session_id}", mapping=session_data)
        r.expire(f"ai:session:{session_id}", SESSION_TTL)
    except Exception as exc:  # noqa: BLE001
        logger.error("Redis session write failed: %s", exc)
        # Non-fatal — return response without persisted session
        # Client will get SESSION_NOT_FOUND on next step; requirement 7.5 handled there.

    return RecipeResponse(commodities=commodities, session_id=session_id)


@router.post("/parse-recipe/roundtrip", response_model=RecipeResponse)
async def parse_recipe_roundtrip(body: RecipeResponse) -> RecipeResponse:
    """
    Accept a RecipeResponse, deserialise it, re-serialise it, and return the result.
    Used by property test Property 15 to verify serialisation round-trip fidelity.
    """
    # Pydantic already deserialised `body`; reconstruct via model_dump → model_validate
    raw = body.model_dump()
    return RecipeResponse.model_validate(raw)

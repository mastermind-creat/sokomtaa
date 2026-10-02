"""
Pantry exclusion router.

POST /ai/pantry-exclusion — deduct pantry items from the session commodity list.
"""

import json
import logging

import redis as redis_lib
from fastapi import APIRouter, HTTPException

from app.config import settings
from app.models.schemas import PantryExclusionRequest, RecipeResponse
from app.services.pantry_service import exclude_pantry

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/pantry-exclusion", response_model=RecipeResponse)
async def pantry_exclusion(request: PantryExclusionRequest) -> RecipeResponse:
    """
    Deduct confirmed pantry items from the session's commodity list.

    Returns an updated RecipeResponse with the remaining items.
    Returns an empty commodities list when all items are confirmed in pantry.
    """
    updated_commodities = exclude_pantry(request.session_id, request.pantry_items)
    return RecipeResponse(commodities=updated_commodities, session_id=request.session_id)

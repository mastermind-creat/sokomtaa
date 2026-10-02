"""
HTTP client for calling Laravel internal endpoints.

Uses httpx.AsyncClient with a 5-second timeout and X-Internal-Token header.
Raises ServiceUnavailableError on timeout or non-2xx responses (Requirements 8.1, 12.7).
"""

import logging
from typing import Any

import httpx

from app.config import settings
from app.models.schemas import CommodityItem

logger = logging.getLogger(__name__)


class ServiceUnavailableError(Exception):
    """Raised when the Laravel service is unreachable or returns a non-2xx status."""


async def match_traders(
    commodities: list[CommodityItem],
    resident_lat: float,
    resident_lon: float,
    radius_km: float,
) -> dict[str, Any]:
    """
    Call POST /internal/ai/match-traders on Laravel and return the JSON response.

    Raises ServiceUnavailableError on timeout or non-2xx response.
    """
    payload = {
        "commodities": [c.model_dump() for c in commodities],
        "resident_lat": resident_lat,
        "resident_lon": resident_lon,
        "radius_km": radius_km,
    }

    try:
        async with httpx.AsyncClient(
            base_url=settings.laravel_url,
            headers={
                "X-Internal-Token": settings.internal_token,
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            timeout=5.0,
        ) as client:
            response = await client.post("/internal/ai/match-traders", json=payload)

        if not response.is_success:
            logger.error(
                "Laravel match-traders returned %s",
                response.status_code,
                extra={"status": response.status_code},
            )
            raise ServiceUnavailableError(
                f"Laravel returned HTTP {response.status_code}"
            )

        return response.json()

    except httpx.TimeoutException as exc:
        logger.error("Laravel match-traders timed out: %s", exc)
        raise ServiceUnavailableError("Laravel request timed out") from exc

    except httpx.RequestError as exc:
        logger.error("Laravel match-traders connection error: %s", exc)
        raise ServiceUnavailableError("Cannot reach Laravel service") from exc

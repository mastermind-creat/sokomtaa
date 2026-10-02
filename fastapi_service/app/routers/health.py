"""
Health check router.

GET /ai/health — returns service health including NLP model status and Redis connectivity.
"""

import logging
from typing import Any

import redis as redis_lib
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.config import settings
from app.services.nlp_service import nlp_model_ready, NLP_MODEL_NAME

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health")
async def health() -> Any:
    """
    Returns HTTP 200 when the NLP model is loaded and Redis is reachable.
    Returns HTTP 503 otherwise (Requirements 6.5, 6.6, 13.2).
    """
    redis_ok = False
    try:
        r = redis_lib.from_url(settings.redis_url, socket_connect_timeout=2)
        r.ping()
        redis_ok = True
    except Exception as exc:  # noqa: BLE001
        logger.warning("Redis health check failed: %s", exc)

    if not nlp_model_ready:
        return JSONResponse(
            status_code=503,
            content={
                "status": "degraded",
                "model": "not_loaded",
                "redis": "ok" if redis_ok else "unavailable",
                "code": "SERVICE_UNAVAILABLE",
                "message": "AI model is loading. Please try again shortly.",
            },
        )

    return JSONResponse(
        status_code=200,
        content={
            "status": "ok",
            "model": NLP_MODEL_NAME,
            "redis": "ok" if redis_ok else "unavailable",
        },
    )

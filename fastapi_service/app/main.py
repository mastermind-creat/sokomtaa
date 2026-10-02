"""
FastAPI application entry point.

Responsibilities:
- Load spaCy model at startup via lifespan context manager
- X-Internal-Token authentication middleware (all routes except /ai/health)
- Structured JSON logging to stdout
- Router registration under /ai prefix
"""

import json
import logging
import sys
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.services import nlp_service
from app.routers import health, recipe_parser, pantry, trader_match

# ---------------------------------------------------------------------------
# Structured JSON logging
# ---------------------------------------------------------------------------

class _JsonFormatter(logging.Formatter):
    SERVICE = "fastapi-ai-service"

    def format(self, record: logging.LogRecord) -> str:  # noqa: A003
        payload = {
            "timestamp": self.formatTime(record, self.datefmt),
            "service": self.SERVICE,
            "level": record.levelname,
            "message": record.getMessage(),
        }
        # Merge any extra fields attached to the record
        for key, val in record.__dict__.items():
            if key not in (
                "args", "asctime", "created", "exc_info", "exc_text", "filename",
                "funcName", "id", "levelname", "levelno", "lineno", "module",
                "msecs", "message", "msg", "name", "pathname", "process",
                "processName", "relativeCreated", "stack_info", "thread", "threadName",
            ):
                payload[key] = val
        return json.dumps(payload)


def _configure_logging() -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(_JsonFormatter())
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(logging.INFO)


_configure_logging()
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan — load NLP model at startup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("FastAPI AI service starting up")
    nlp_service.load_model()
    if nlp_service.nlp_model_ready:
        logger.info("NLP model ready", extra={"model": nlp_service.NLP_MODEL_NAME})
    else:
        logger.error("NLP model failed to load — service degraded")
    yield
    logger.info("FastAPI AI service shutting down")


# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------

app = FastAPI(title="Soko Mtaa AI Service", lifespan=lifespan)


# ---------------------------------------------------------------------------
# X-Internal-Token authentication middleware
# (all routes except GET /ai/health)
# ---------------------------------------------------------------------------

class InternalTokenMiddleware(BaseHTTPMiddleware):
    EXEMPT_PATHS = {"/ai/health"}

    async def dispatch(self, request: Request, call_next):  # type: ignore[override]
        if request.url.path in self.EXEMPT_PATHS:
            return await call_next(request)

        token = request.headers.get("X-Internal-Token", "")
        if not settings.internal_token or token != settings.internal_token:
            return JSONResponse(
                status_code=401,
                content={
                    "success": False,
                    "code": "UNAUTHENTICATED",
                    "message": "Missing or invalid X-Internal-Token header.",
                },
            )
        return await call_next(request)


app.add_middleware(InternalTokenMiddleware)


# ---------------------------------------------------------------------------
# Router registration — all under /ai prefix
# ---------------------------------------------------------------------------

app.include_router(health.router, prefix="/ai", tags=["health"])
app.include_router(recipe_parser.router, prefix="/ai", tags=["recipe"])
app.include_router(pantry.router, prefix="/ai", tags=["pantry"])
app.include_router(trader_match.router, prefix="/ai", tags=["traders"])

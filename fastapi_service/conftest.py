"""
pytest configuration for the FastAPI AI service.

Sets FASTAPI_ENV=testing so that the NLP model load is attempted but raw text
is not logged.  Also patches Redis for unit tests that don't need a live broker.
"""

import os

import pytest

# Ensure we are in testing mode before any app code is imported
os.environ.setdefault("FASTAPI_ENV", "testing")
os.environ.setdefault("FASTAPI_INTERNAL_TOKEN", "test-internal-token")
os.environ.setdefault("FASTAPI_REDIS_URL", "redis://localhost:6379")

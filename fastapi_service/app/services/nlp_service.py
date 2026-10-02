"""
NLP service: extracts meal names and headcount from free-text recipe requests.

In production mode the raw `text` field is never logged.
"""

import os
import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Global state — set by lifespan startup in main.py
# ---------------------------------------------------------------------------
nlp = None
nlp_model_ready: bool = False
NLP_MODEL_NAME = "en_core_web_sm"

# ---------------------------------------------------------------------------
# Supported Kenyan staple meals (Requirements 5.7)
# Keys are canonical names; values are regex patterns (alternations) that
# recognise common Swahili/English variants in a single pass.
# ---------------------------------------------------------------------------
MEAL_PATTERNS: dict[str, str] = {
    "ugali":       r"\bugali\b",
    "sukuma wiki": r"\bsukuma(?:\s+wiki)?\b",
    "eggs":        r"\b(?:eggs?|mayai)\b",
    "rice":        r"\b(?:rice|wali|mchele)\b",
    "beans":       r"\b(?:beans?|maharagwe)\b",
    "chapati":     r"\b(?:chapati|chapatis?)\b",
    "githeri":     r"\bgitheri\b",
    "nyama choma": r"\bnyama(?:\s+choma)?\b",
    "pilau":       r"\bpilau\b",
    "mandazi":     r"\bmandazi\b",
    "chai":        r"\b(?:chai|tea)\b",
}

# Precompile for speed
_MEAL_REGEXES = {meal: re.compile(pat, re.IGNORECASE) for meal, pat in MEAL_PATTERNS.items()}

# Headcount patterns: "for 5", "5 people", "10 visitors", "feeds 8", etc.
_HEADCOUNT_PATTERNS = [
    re.compile(r"\bfor\s+(\d+)\b", re.IGNORECASE),
    re.compile(r"(\d+)\s+(?:people|persons?|visitors?|guests?|family members?|watu|wageni)\b", re.IGNORECASE),
    re.compile(r"\bfeeds?\s+(\d+)\b", re.IGNORECASE),
    re.compile(r"\b(\d+)\s+of\s+us\b", re.IGNORECASE),
    re.compile(r"\bserves?\s+(\d+)\b", re.IGNORECASE),
    re.compile(r"\bwatu\s+(\d+)\b", re.IGNORECASE),
    re.compile(r"\b(\d+)\s+(?:watu|mtu)\b", re.IGNORECASE),
    re.compile(r"\b(\d+)\b"),   # bare number fallback — lowest priority
]


class ParseError(Exception):
    """Raised when meal name or headcount cannot be extracted from input text."""

    def __init__(self, missing: str) -> None:
        self.missing = missing
        super().__init__(f"Could not extract {missing} from text")


def load_model() -> None:
    """Load the spaCy model. Called once during application lifespan startup."""
    global nlp, nlp_model_ready
    try:
        import spacy  # noqa: PLC0415
        nlp = spacy.load(NLP_MODEL_NAME)
        nlp_model_ready = True
        logger.info("NLP model loaded", extra={"model": NLP_MODEL_NAME})
    except Exception as exc:  # noqa: BLE001
        nlp_model_ready = False
        logger.error("Failed to load NLP model: %s", exc, extra={"model": NLP_MODEL_NAME})


def _extract_headcount(text: str) -> Optional[int]:
    """Return the first headcount found in *text*, or None."""
    # Prioritised patterns — stop on first match except the bare-number fallback
    for pattern in _HEADCOUNT_PATTERNS[:-1]:
        m = pattern.search(text)
        if m:
            return int(m.group(1))
    # Bare-number fallback — only if exactly one digit sequence exists
    matches = list(_HEADCOUNT_PATTERNS[-1].finditer(text))
    if len(matches) == 1:
        return int(matches[0].group(1))
    return None


def _extract_meals(text: str) -> list[str]:
    """Return list of canonical meal names detected in *text*."""
    found: list[str] = []
    for meal, regex in _MEAL_REGEXES.items():
        if regex.search(text):
            found.append(meal)
    return found


def parse(text: str) -> tuple[list[str], int]:
    """
    Parse *text* and return (meals, headcount).

    Raises ParseError if either is missing.
    Never logs the raw *text* value in production.
    """
    env = os.getenv("FASTAPI_ENV", "production")
    if env != "production":
        logger.debug("parse() called", extra={"text_length": len(text)})

    meals = _extract_meals(text)
    headcount = _extract_headcount(text)

    missing_parts = []
    if not meals:
        missing_parts.append("meal name")
    if headcount is None:
        missing_parts.append("headcount")

    if missing_parts:
        raise ParseError(" and ".join(missing_parts))

    return meals, headcount

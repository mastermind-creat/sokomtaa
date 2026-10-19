#!/usr/bin/env python3
"""
simulate_riders.py — Soko Mtaa Boda Rider GPS Simulator

Connects demo rider accounts to the Go WebSocket gateway with valid JWT tokens,
then sends randomised GPS pings simulating movement around the demo markets.

Requirements:
    pip install websockets PyJWT

Usage:
    # From your local machine (gateway reachable on localhost:8002 in dev):
    JWT_SECRET=<your_secret> python scripts/simulate_riders.py

    # Against the live server:
    WS_URL=wss://69-169-111-234.sslip.io JWT_SECRET=<secret> python scripts/simulate_riders.py

Environment variables:
    JWT_SECRET          HS256 secret — must match JWT_SECRET in root .env / Go gateway (required)
    WS_URL              WebSocket base URL              (default: ws://localhost:8002)
    RIDER_IDS           Comma-separated rider user IDs  (default: 1,2,3,4,5,6)
    PING_INTERVAL_SEC   Seconds between GPS pings       (default: 3)
"""

import asyncio
import json
import logging
import math
import os
import random
import signal
import time

import jwt          # pip install PyJWT
import websockets   # pip install websockets

# ── Configuration ─────────────────────────────────────────────────────────────

JWT_SECRET      = os.environ.get("JWT_SECRET", "")
WS_BASE_URL     = os.environ.get("WS_URL", "ws://localhost:8002")
RIDER_IDS       = [r.strip() for r in os.environ.get("RIDER_IDS", "1,2,3,4,5,6").split(",")]
PING_INTERVAL   = float(os.environ.get("PING_INTERVAL_SEC", "3"))
JWT_ALGORITHM   = "HS256"
JWT_TTL_SECONDS = 3600  # 1 hour; regenerated on expiry

# Demo market approximate centres (Nairobi + Mombasa + Kisumu)
MARKET_CENTRES = [
    (-1.2836, 36.8340),   # Gikomba, Nairobi
    (-1.2833, 36.8277),   # Muthurwa, Nairobi
    (-4.0435, 39.6682),   # Kongowea, Mombasa
    (-0.0917, 34.7580),   # Kibuye, Kisumu
]

logging.basicConfig(
    level=logging.INFO,
    format='{"time": "%(asctime)s", "level": "%(levelname)s", "msg": "%(message)s"}',
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)
log = logging.getLogger("simulate_riders")


# ── JWT helpers ───────────────────────────────────────────────────────────────

def _make_token(rider_id: str) -> str:
    """Generate a short-lived HS256 JWT matching the Go gateway's expectations."""
    if not JWT_SECRET:
        raise RuntimeError(
            "JWT_SECRET is not set. "
            "Export it: export JWT_SECRET=<value from server root .env>"
        )
    now = int(time.time())
    payload = {
        "sub":  rider_id,
        "role": "rider",
        "iat":  now,
        "exp":  now + JWT_TTL_SECONDS,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


# ── GPS movement ──────────────────────────────────────────────────────────────

def _random_walk(lat: float, lon: float, radius_km: float = 0.5) -> tuple:
    """Return a new position within radius_km of the given point (random-walk step)."""
    # 1 degree latitude ~= 111 km
    delta_lat = random.uniform(-radius_km / 111, radius_km / 111)
    # longitude degrees per km vary with latitude
    cos_lat = math.cos(math.radians(lat))
    delta_lon = random.uniform(-radius_km / (111 * cos_lat), radius_km / (111 * cos_lat))
    new_lat = lat + delta_lat
    new_lon = lon + delta_lon
    # Clamp to valid WGS-84
    return max(-90.0, min(90.0, new_lat)), max(-180.0, min(180.0, new_lon))


# ── Per-rider coroutine ───────────────────────────────────────────────────────

async def _simulate_rider(rider_id: str, centre: tuple) -> None:
    lat, lon = centre
    token = _make_token(rider_id)
    token_generated_at = time.time()

    url = f"{WS_BASE_URL}/ws/rider?rider_id={rider_id}&token={token}"
    log.info(f"Rider {rider_id}: connecting to {WS_BASE_URL}/ws/rider")

    reconnect_delay = 2.0

    while True:
        try:
            async with websockets.connect(url, ping_interval=20, ping_timeout=10) as ws:
                log.info(f"Rider {rider_id}: connected OK")
                reconnect_delay = 2.0  # reset on success

                while True:
                    # Regenerate token before it expires (60s buffer)
                    if time.time() - token_generated_at > JWT_TTL_SECONDS - 60:
                        token = _make_token(rider_id)
                        token_generated_at = time.time()
                        log.info(f"Rider {rider_id}: JWT refreshed")

                    lat, lon = _random_walk(lat, lon)
                    ping = {"lat": lat, "lon": lon}
                    await ws.send(json.dumps(ping))
                    log.info(f"Rider {rider_id}: ping lat={lat:.6f} lon={lon:.6f}")
                    await asyncio.sleep(PING_INTERVAL)

        except websockets.exceptions.ConnectionClosedError as exc:
            log.warning(
                f"Rider {rider_id}: connection closed ({exc}). "
                f"Reconnecting in {reconnect_delay}s ..."
            )
        except Exception as exc:  # noqa: BLE001
            log.error(
                f"Rider {rider_id}: error ({exc}). "
                f"Reconnecting in {reconnect_delay}s ..."
            )

        await asyncio.sleep(reconnect_delay)
        reconnect_delay = min(reconnect_delay * 2, 30)  # exponential back-off, cap 30s

        # Rebuild URL with a fresh token after back-off
        token = _make_token(rider_id)
        token_generated_at = time.time()
        url = f"{WS_BASE_URL}/ws/rider?rider_id={rider_id}&token={token}"


# ── Entry point ───────────────────────────────────────────────────────────────

async def main() -> None:
    if not JWT_SECRET:
        raise SystemExit(
            "\n[ERROR] JWT_SECRET is not set.\n\n"
            "  Step 1 — copy JWT_SECRET off the server (never print it in full):\n"
            "    ssh deploy@69.169.111.234 "
            "\"grep JWT_SECRET ~/soko-mtaa/.env | sha256sum\"  # verify only\n\n"
            "  Step 2 — export it locally:\n"
            "    export JWT_SECRET=<paste the actual value>\n\n"
            "  Step 3 — run against the live server:\n"
            "    WS_URL=wss://69-169-111-234.sslip.io "
            "JWT_SECRET=$JWT_SECRET python scripts/simulate_riders.py\n"
        )

    log.info(f"Starting simulation: {len(RIDER_IDS)} riders -> {WS_BASE_URL}")
    log.info(f"Rider IDs: {RIDER_IDS}  |  Ping interval: {PING_INTERVAL}s")

    tasks = []
    for i, rider_id in enumerate(RIDER_IDS):
        centre = MARKET_CENTRES[i % len(MARKET_CENTRES)]
        tasks.append(asyncio.create_task(_simulate_rider(rider_id, centre)))

    # Graceful shutdown on Ctrl-C / SIGTERM
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, lambda: [t.cancel() for t in tasks])
        except NotImplementedError:
            pass  # Windows -- signal handling limited; Ctrl-C still works

    try:
        await asyncio.gather(*tasks)
    except asyncio.CancelledError:
        log.info("Simulation stopped by signal.")


if __name__ == "__main__":
    asyncio.run(main())

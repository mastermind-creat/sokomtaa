Now can we continue with the task implementation plan
# Implementation Plan: Polyglot Architecture Upgrade

## Overview

Migrate Soko Mtaa from a monolithic Laravel + Next.js + MySQL stack to a polyglot
microservice architecture with PostgreSQL + PostGIS, a Python FastAPI AI service,
a Go WebSocket GPS gateway, and upgraded Next.js map components. All existing business
logic (RBAC, M-Pesa, reservations) is preserved and extended.

Build sequence: database foundation → Laravel extensions → Go gateway → FastAPI AI
service → Next.js map upgrades → cross-service wiring → property tests → deployment config.

---

## Tasks

- [-] 1. Phase 1 — Database Foundation (PostgreSQL + PostGIS)
  - [x] 1.1 Switch Laravel database driver from MySQL to PostgreSQL
    - Update `config/database.php` to use the `pgsql` driver as the default connection
    - Add `DB_CONNECTION=pgsql` and PostgreSQL env vars to `.env.example`
    - Update `backend/composer.json` to require `doctrine/dbal` for migration column changes
    - _Requirements: 1.1_

  - [x] 1.2 Create migration `add_postgis_location_to_stalls`
    - Check for PostGIS extension via `SELECT 1 FROM pg_extension WHERE extname = 'postgis'`; throw `\RuntimeException` with message `POSTGIS_UNAVAILABLE` if missing
    - Add `location GEOGRAPHY(Point, 4326)` column to the stalls table
    - Create GiST spatial index `stalls_location_gist_idx` on the `location` column
    - Implement `down()` to drop the index then drop the column
    - _Requirements: 1.2, 1.3, 1.4, 1.7_

  - [ ]* 1.3 Write property test for stall location write round-trip
    - **Property 1: Stall Location Write Round-Trip**
    - For any valid WGS-84 lon/lat pair, write `ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography` then read back `ST_X` and `ST_Y`; assert values are within float epsilon
    - **Validates: Requirements 1.5**
    - Library: eris

  - [x] 1.4 Create migration `populate_stall_locations_from_pixel_coords`
    - Chunk through all stalls with non-null `map_x`/`map_y` and null `location` (idempotent guard)
    - Convert pixel offsets to WGS-84 using Kolenyo Market reference (lat −0.0917, lon 34.7679, scale 0.00005 deg/px)
    - Log count of migrated and skipped (null coordinate) records
    - Skip and log any record with null `map_x` or `map_y` without halting
    - Seed `active_traders` Redis GEO key with all currently open stalls as a post-migration step
    - _Requirements: 1.5, 1.6, 1.8, 15.1, 15.2, 15.3, 15.4_

  - [ ]* 1.5 Write property test for migration completeness
    - **Property 2: Migration Completeness**
    - For all stalls with non-null `map_x` and `map_y`, after the migration runs the `location` column must be non-null
    - **Validates: Requirements 1.6, 15.1**
    - Library: eris

  - [ ]* 1.6 Write property test for migration idempotence
    - **Property 28: Migration Idempotence**
    - For stalls with `location` already set, running the migration a second time must leave those values unchanged
    - **Validates: Requirements 15.5**
    - Library: eris

  - [x] 1.7 Update the `Stall` Eloquent model for PostGIS
    - Add `location` to `$casts` as `string` (raw WKB)
    - Add `getLatAttribute()` and `getLonAttribute()` accessors using `ST_Y`/`ST_X` raw queries
    - Update stall `saving` observer/event to write `ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography` when lat/lon are present
    - _Requirements: 1.5_

- [-] 2. Phase 2 — Laravel API Extensions

  - [x] 2.1 Create `GeoService` for PostGIS queries and Redis GEO sync
    - Implement `stallsWithinViewport(float $minLon, float $minLat, float $maxLon, float $maxLat): Collection` using `ST_Within` + `ST_MakeEnvelope` and the GiST index
    - Filter out stalls with `status = maintenance` from all public results
    - Check Redis GEO cache key `stall:geo:cache:{bbox_hash}` (5s TTL) before falling back to PostGIS query
    - Implement `addTraderToGeo(int $stallId, float $lon, float $lat): void` executing `GEOADD active_traders`
    - Implement `removeTraderFromGeo(int $stallId): void` executing `ZREM active_traders`
    - _Requirements: 2.2, 2.4, 2.7, 3.1, 3.2_

  - [ ]* 2.2 Write property test for viewport bbox containment
    - **Property 3: Viewport Bbox Containment**
    - For any valid bbox, every stall returned by the GeoService must have a `location` geometrically within the envelope
    - **Validates: Requirements 2.2**
    - Library: eris

  - [ ]* 2.3 Write property test for maintenance stall exclusion
    - **Property 4: Maintenance Stall Exclusion**
    - For any valid bbox query over any stall distribution, no stall with `status = 'maintenance'` should appear in results
    - **Validates: Requirements 2.4**
    - Library: eris

  - [x] 2.4 Create `StallMapController` and register route
    - Add `GET /api/map/stalls` accepting `min_lon`, `min_lat`, `max_lon`, `max_lat` as required numeric parameters
    - Validate WGS-84 ranges (lon −180–180, lat −90–90); return HTTP 422 `VALIDATION_ERROR` on out-of-range or inverted bounds
    - Delegate spatial query to `GeoService`; return stall collection with `id`, `lon`, `lat`, `status`, `trader` partial info
    - Apply `auth:sanctum` + `throttle:60,1` middleware as per design
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 14.4_

  - [x] 2.5 Wire trader open/close events to Redis GEO sync
    - In `TraderProfileController::toggleOpen()`, call `GeoService::addTraderToGeo()` when `is_open` becomes `true` and `GeoService::removeTraderFromGeo()` when it becomes `false`
    - Ensure the Redis write happens within the same request cycle (within 5 seconds)
    - _Requirements: 2.8, 3.1, 3.2_

  - [ ]* 2.6 Write property test for active trader GEO membership
    - **Property 5: Active Trader GEO Membership**
    - For any stall marked `is_open = true`, after the open event is processed the stall's ID must be a member of `active_traders`
    - **Validates: Requirements 3.1**
    - Library: eris

  - [ ]* 2.7 Write property test for stall open/close Redis round-trip
    - **Property 6: Stall Open/Close Redis Round-Trip**
    - Opening then immediately closing a stall must result in the stall's ID being absent from `active_traders`
    - **Validates: Requirements 3.2**
    - Library: eris

  - [x] 2.8 Create `ReconcileGeoCache` artisan command
    - Query all stalls where associated trader `is_open = true` and `location` is not null
    - `GEOADD` each to `active_traders`; retrieve all current GEO members, diff against open stall IDs, `ZREM` stale entries
    - Log count of stale entries removed
    - Register command in the scheduler to run every 5 minutes
    - _Requirements: 3.7_

  - [ ]* 2.9 Write property test for active_traders consistency with database
    - **Property 10: active_traders Consistency with Database**
    - After `ReconcileGeoCache` runs, for all stalls: `is_open = true` implies member of `active_traders`, `is_open = false` implies absent
    - **Validates: Requirements 3.7**
    - Library: eris

  - [x] 2.10 Create `InternalApiAuth` middleware (verify it exists, extend if needed)
    - Confirm `backend/app/Http/Middleware/InternalApiAuth.php` validates `X-Internal-Token` header against `config('services.internal_token')`
    - Return HTTP 401 with `UNAUTHENTICATED` error code on missing or invalid token
    - _Requirements: 8.6, 14.3_

  - [x] 2.11 Create `AiMatchController` and internal route
    - Add `POST /internal/ai/match-traders` protected by `internal.auth` middleware
    - Accept `commodities` array (name, quantity, unit) and `resident_lat`, `resident_lon`, `radius_km`
    - Query active traders stocking each commodity within the radius; rank by price ascending
    - Return per-commodity trader list with `trader_id`, `business_name`, `product_id`, `price`, `average_rating`, `stall_number`
    - _Requirements: 8.1, 8.2, 8.3, 8.6_

  - [ ]* 2.12 Write property test for trader ranking by price ascending
    - **Property 18: Trader Ranking by Price Ascending**
    - For any commodity matched against any set of traders, the returned list must be ordered by `price` ascending with no cheaper option after a more expensive one
    - **Validates: Requirements 8.3**
    - Library: eris

  - [ ]* 2.13 Write property test for internal endpoint authentication
    - **Property 19: Internal Endpoints Reject Unauthenticated Requests (Laravel)**
    - Any request to `POST /internal/ai/match-traders` missing or with incorrect `X-Internal-Token` must return HTTP 401
    - **Validates: Requirements 8.6, 14.3**
    - Library: eris

  - [x] 2.14 Create `AiPipelineService` with circuit-breaker for FastAPI calls
    - Implement `callFastApi(string $endpoint, array $payload): array` using `Http::timeout(5)` with `X-Internal-Token` header
    - On `ConnectionException` or non-2xx response: log to `fastapi` log channel (redacting `text` fields), return `SERVICE_UNAVAILABLE` error
    - _Requirements: 12.7, 13.6, 14.5_

  - [ ]* 2.15 Write property test for circuit-breaker timeout
    - **Property 26: Circuit-Breaker Timeout on FastAPI Unavailability**
    - For any call to a hanging/unreachable FastAPI endpoint, Laravel must return a `SERVICE_UNAVAILABLE` response within 5 seconds
    - **Validates: Requirements 12.7**
    - Library: eris

  - [x] 2.16 Create `MultiCheckoutService` for atomic multi-merchant checkout
    - Implement `checkout(array $payload, User $resident): array` inside `DB::transaction()`
    - Trigger STK Push via `MpesaService::stkPush()`; throw `PaymentFailedException` if `ResponseCode !== '0'` (causes full rollback)
    - On success: create one `Reservation` per item with `status = 'paid'`
    - Dispatch SMS notifications to each involved trader using template T07
    - _Requirements: 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

  - [ ]* 2.17 Write property test for multi-merchant checkout payload completeness
    - **Property 21: Multi-Merchant Checkout Payload Contains All Items**
    - For any selection of N commodity-trader pairs, the assembled payload must contain exactly N line items, each with correct fields
    - **Validates: Requirements 9.3**
    - Library: eris

  - [ ]* 2.18 Write property test for successful payment creates all reservations as paid
    - **Property 22: Successful Payment Creates All Reservations as Paid**
    - For any multi-merchant checkout with N traders, when STK Push succeeds, exactly N reservations with `status = 'paid'` must exist
    - **Validates: Requirements 9.5, 9.7**
    - Library: eris

  - [ ]* 2.19 Write property test for failed payment creates no reservations
    - **Property 23: Failed Payment Creates No Reservations**
    - For any multi-merchant checkout where STK Push fails, zero reservation records should be created; database state must be identical before and after
    - **Validates: Requirements 9.6, 9.7**
    - Library: eris

  - [x] 2.20 Create `MultiCheckoutController` and register route
    - Add `POST /api/checkout/multi` under `auth:sanctum` + `role:resident` middleware
    - Delegate to `MultiCheckoutService::checkout()`; return assembled reservation codes on success
    - _Requirements: 9.4_

  - [x] 2.21 Add `DeliveryFeeCalculator` to `MultiCheckoutService`
    - Calculate delivery fee based on distance between resident location and furthest trader stall
    - Fee must be monotonically non-decreasing as the furthest-stall distance increases
    - Include delivery fee in the STK Push total when `delivery_type = 'rider'`
    - _Requirements: 9.2_

  - [ ]* 2.22 Write property test for delivery fee proportional to max trader distance
    - **Property 20: Delivery Fee Proportional to Max Trader Distance**
    - For any set of trader positions and a resident position, a strictly farther maximum trader must never produce a lower delivery fee
    - **Validates: Requirements 9.2**
    - Library: eris

  - [x] 2.23 Create Laravel `GET /api/health` endpoint
    - Return `{"status": "ok", "db": "ok", "redis": "ok"}` with HTTP 200 when PostgreSQL and Redis are both reachable
    - Return degraded status with appropriate HTTP 503 if either is unreachable
    - Register as an unauthenticated route
    - _Requirements: 13.1_

  - [x] 2.24 Add `AiController` and AI chat entry route
    - Add `POST /api/ai/chat` under `auth:sanctum` + `role:resident` + `throttle:10,1` middleware
    - Proxy the request to `AiPipelineService`; use circuit-breaker from 2.14
    - _Requirements: 14.5_

  - [x] 3. Checkpoint — Laravel layer complete
    - Run `php artisan test` for all Laravel unit and feature tests
    - Verify `GET /api/health` returns all-green
    - Verify `GET /api/map/stalls` returns 422 on out-of-range bbox and correct spatial results on valid bbox
    - Ensure all tests pass; ask the user if questions arise.

- [-] 4. Phase 3 — Go WebSocket GPS Gateway

  - [x] 4.1 Scaffold the Go module and directory structure
    - Initialise `go_gateway/go.mod` with module path `github.com/sokomtaa/go-gateway`
    - Add dependencies: `github.com/gorilla/websocket`, `github.com/redis/go-redis/v9`, `github.com/golang-jwt/jwt/v5`
    - Create directories: `handlers/`, `services/`, `models/`, `config/`
    - _Requirements: 4_

  - [x] 4.2 Implement `config/config.go`
    - Read `REDIS_URL`, `JWT_SECRET`, `LARAVEL_URL`, `PORT` from environment variables
    - Provide typed `Config` struct; fail fast with log.Fatal if required vars are missing
    - _Requirements: 4_

  - [x] 4.3 Implement `services/redis_service.go`
    - Implement `GeoAdd(ctx, key, riderID, lon, lat)` wrapping `GEOADD`
    - Implement `GeoRemove(ctx, kpey, riderID)` wrapping `ZREM`
    - Implement `Publish(ctx, channel, payload)` for Pub/Sub event emission
    - Implement in-memory buffer: on Redis failure, store ping with 30s expiry and retry; log each failure with rider ID, coordinates, and error reason
    - _Requirements: 4.7, 13.7_

  - [x] 4.4 Implement `services/auth_service.go`
    - Validate JWT `token` query parameter using `JWT_SECRET`; return `(riderID string, err error)`
    - Reject missing, expired, or invalid-signature tokens
    - _Requirements: 4.1, 14.1_

  - [ ]* 4.5 Write property test for Go_Gateway rejecting WebSocket without valid JWT
    - **Property 27: Go_Gateway Rejects WebSocket Without Valid JWT**
    - For any WebSocket upgrade request missing a token, carrying an expired token, or an invalid-signature token, the gateway must refuse with HTTP 4xx and not establish a connection
    - **Validates: Requirements 14.1**
    - Library: rapid

  - [x] 4.6 Implement `models/gps_ping.go`
    - Define `GpsPing struct { Lat float64 \`json:"lat"\`; Lon float64 \`json:"lon"\` }`
    - _Requirements: 4.2_

  - [x] 4.7 Implement `handlers/rider_ws.go`
    - Upgrade HTTP to WebSocket at `/ws/rider?rider_id=<id>&token=<jwt>`
    - Validate JWT via `auth_service.ValidateToken()`; reject non-200 with appropriate close
    - Set 30s read deadline on each iteration; send WebSocket ping frame on idle; close if no pong within 10s
    - Loop: `ReadJSON` → validate WGS-84 ranges → `GeoAdd` → `Publish rider.position_updated`
    - On out-of-range coords: close with code 1008 and log error
    - On close: `Publish rider.disconnected` event
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.8, 3.3, 3.4, 3.5_

  - [ ]* 4.8 Write property test for GPS ping position round-trip
    - **Property 7: GPS Ping Position Round-Trip**
    - For any rider ID and valid GPS ping, after `GeoAdd`, `GEOPOS active_riders <riderID>` must return coordinates within ±0.0001 degrees of the input
    - **Validates: Requirements 3.3, 4.2**
    - Library: rapid

  - [ ]* 4.9 Write property test for single GEO entry per rider
    - **Property 8: Single GEO Entry Per Rider**
    - After N GPS pings (N ≥ 1) for any rider, the count of entries in `active_riders` for that rider ID must be exactly 1
    - **Validates: Requirements 3.4**
    - Library: rapid

  - [ ]* 4.10 Write property test for position updated event emitted on each write
    - **Property 11: Position Updated Event Emitted on Each Write**
    - For any successful `GEOADD active_riders`, a `rider.position_updated` event must be published to `rider_events` containing the correct rider ID, latitude, and longitude
    - **Validates: Requirements 4.8**
    - Library: rapid

  - [x] 4.11 Implement `handlers/health.go`
    - Return HTTP 200 `{"status": "ok"}` when Redis ping succeeds
    - Return HTTP 503 when Redis is unreachable
    - _Requirements: 4.6, 13.3_

  - [x] 4.12 Wire `main.go` with HTTP multiplexer
    - Register `/ws/rider` → `HandleRiderSocket`, `/health` → `HandleHealth`
    - Listen on port from config; log startup with service name
    - Emit structured JSON logs to stdout (timestamp, service, level, message) for all events
    - _Requirements: 13.5_

  - [x] 4.13 Create `go_gateway/Dockerfile`
    - Multi-stage build: `golang:1.22-alpine` builder → `alpine:3.19` runtime
    - Copy compiled binary; expose port 8002; set entrypoint
    - _Requirements: deployment_

  - [x] 5. Checkpoint — Go gateway complete
    - Run `go test ./...` in `go_gateway/`
    - Verify `GET /health` returns 200
    - Verify WebSocket connection rejected with missing/invalid JWT
    - Verify GPS pings write to Redis and publish `rider.position_updated`
    - Ensure all tests pass; ask the user if questions arise.

- [-] 6. Phase 4 — Python FastAPI AI Service

  - [x] 6.1 Scaffold the FastAPI service structure
    - Create `fastapi_service/` with `app/main.py`, `app/routers/`, `app/models/schemas.py`, `app/services/`, `app/config.py`
    - Create `requirements.txt` pinning: `fastapi`, `uvicorn[standard]`, `pydantic`, `redis`, `httpx`, `spacy`, `hypothesis` (dev)
    - _Requirements: 5, 6_

  - [x] 6.2 Implement Pydantic schemas in `app/models/schemas.py`
    - Define `CommodityItem(name: str, quantity: float, unit: str)`
    - Define `RecipeRequest(text: str, user_id: int)`
    - Define `RecipeResponse(commodities: list[CommodityItem], session_id: str)`
    - Define `PantryExclusionRequest(session_id: str, pantry_items: list[str])`
    - Define `TraderMatchRequest(session_id: str, resident_lat: float, resident_lon: float, radius_km: float = 5.0)`
    - _Requirements: 5.4, 6.1_

  - [x] 6.3 Implement `app/services/nlp_service.py`
    - Load spaCy `en_core_web_sm` model at startup; set `nlp_model_ready` flag
    - Extract headcount (integer) and meal name(s) from free-text using regex patterns and spaCy NER
    - Support at minimum: ugali, sukuma wiki, eggs, rice, beans, chapati, githeri, nyama choma, pilau, mandazi, chai
    - Raise `ParseError` if no recognisable meal name or headcount found
    - Never log `text` field content in production mode
    - _Requirements: 5.2, 5.6, 5.7, 14.7_

  - [x] 6.4 Implement `app/services/recipe_scaler.py`
    - Define per-person ratio table for each supported Kenyan staple (name → quantity, unit per person)
    - Implement `scale_recipe(meal: str, headcount: int) -> list[CommodityItem]` multiplying ratios by headcount
    - Scaling must be linear: doubling headcount doubles every quantity
    - _Requirements: 5.3_

  - [ ]* 6.5 Write property test for recipe parse producing valid commodity structure
    - **Property 12: Recipe Parse Produces Valid Commodity Structure**
    - For any valid recipe text with recognisable meal and headcount, every element in `commodities` must have non-empty `name`, positive `quantity`, and non-empty `unit`
    - **Validates: Requirements 5.2, 5.4**
    - Library: hypothesis

  - [ ]* 6.6 Write property test for headcount scaling linearity
    - **Property 13: Headcount Scaling is Linear (Metamorphic)**
    - For any valid recipe text, doubling the headcount must double every `quantity` in the result (within floating-point tolerance)
    - **Validates: Requirements 5.3**
    - Library: hypothesis

  - [ ]* 6.7 Write property test for recipe parse idempotence
    - **Property 14: Recipe Parse Idempotence**
    - For any valid recipe text, calling the parser twice must produce an equivalent `commodities` array (same items, quantities, units)
    - **Validates: Requirements 5.8**
    - Library: hypothesis

  - [x] 6.8 Implement `app/routers/recipe_parser.py`
    - `POST /ai/parse-recipe`: validate `text` ≥ 3 chars (HTTP 422 `VALIDATION_ERROR` otherwise)
    - Call `nlp_service` → `recipe_scaler`; return `RecipeResponse` with new `session_id`
    - Persist session to Redis hash `ai:session:{uuid}` with 30-minute TTL
    - If `nlp_model_ready` is false: raise HTTP 503 `SERVICE_UNAVAILABLE`
    - `POST /ai/parse-recipe/roundtrip`: accept `RecipeResponse` body, deserialise, re-serialise, return result (for Property 15 verification)
    - _Requirements: 5.1, 5.2, 5.5, 5.6, 6.1, 6.2, 6.6_

  - [ ]* 6.9 Write property test for RecipeResponse serialisation round-trip
    - **Property 15: RecipeResponse Serialisation Round-Trip**
    - For any valid `RecipeResponse` object, serialising → deserialising → re-serialising must produce a byte-for-byte identical JSON string; commodity count must be preserved
    - **Validates: Requirements 6.3, 6.4**
    - Library: hypothesis

  - [x] 6.10 Implement `app/services/pantry_service.py`
    - `exclude_pantry(session_id: str, pantry_items: list[str]) -> list[CommodityItem]`
    - Load session from Redis; raise HTTP 404 `SESSION_NOT_FOUND` if missing
    - Deduct confirmed pantry items from commodities; remove any item whose quantity reaches zero
    - Return empty array if all items are confirmed in pantry
    - Return original list unchanged when `pantry_items` is empty
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 6.11 Write property test for pantry deduction removes specified items
    - **Property 16: Pantry Deduction Removes Specified Items**
    - For any `Commodity_List` and any non-empty subset of pantry items, after exclusion none of the confirmed pantry items should appear in the result; empty array when all items confirmed; original list when pantry is empty
    - **Validates: Requirements 7.2, 7.3, 7.6**
    - Library: hypothesis

  - [ ]* 6.12 Write property test for no zero-quantity items after pantry exclusion
    - **Property 17: No Zero-Quantity Items After Pantry Exclusion**
    - For any pantry exclusion operation, every `CommodityItem` in the returned list must have `quantity > 0`; items reaching zero quantity must be removed entirely
    - **Validates: Requirements 7.7**
    - Library: hypothesis

  - [x] 6.13 Implement `app/routers/pantry.py`
    - `POST /ai/pantry-exclusion`: accept `PantryExclusionRequest`; delegate to `pantry_service`; return updated `RecipeResponse`
    - _Requirements: 7.1, 7.2_

  - [x] 6.14 Implement `app/services/laravel_client.py`
    - `httpx.AsyncClient` with `X-Internal-Token` header and 5s timeout
    - `match_traders(commodities, resident_lat, resident_lon, radius_km)` → calls `POST /internal/ai/match-traders` on Laravel
    - On timeout or non-2xx: raise `ServiceUnavailableError`
    - _Requirements: 8.1, 12.7_

  - [x] 6.15 Implement `app/routers/trader_match.py`
    - `POST /ai/match-traders`: accept `TraderMatchRequest`; load session from Redis; call `laravel_client.match_traders()`
    - Present lowest-price option and highest-rated option per commodity
    - Inform Resident if no traders stock an item; exclude unavailable items from checkout assembly
    - _Requirements: 8.2, 8.3, 8.4, 8.5_

  - [ ]* 6.16 Write property test for internal endpoint authentication (FastAPI)
    - **Property 19: Internal Endpoints Reject Unauthenticated Requests (FastAPI)**
    - Any request to FastAPI routes without a valid `X-Internal-Token` header must return HTTP 401
    - **Validates: Requirements 14.2**
    - Library: hypothesis

  - [x] 6.17 Implement `app/routers/health.py`
    - `GET /ai/health`: check that `nlp_model_ready` is true and Redis is reachable
    - Return HTTP 200 `{"status": "ok", "model": "<model_identifier>"}` when ready
    - Return HTTP 503 `SERVICE_UNAVAILABLE` when NLP model is not loaded
    - _Requirements: 6.5, 6.6, 13.2_

  - [x] 6.18 Implement `app/main.py` with lifespan, middleware, and router registration
    - Load spaCy model in `lifespan` startup; set `nlp_model_ready` flag; log outcome
    - Add `X-Internal-Token` validation middleware rejecting requests without valid token (except `/ai/health`)
    - Emit structured JSON logs to stdout (timestamp, service, level, message)
    - Register all routers under prefix `/ai`
    - _Requirements: 14.2, 13.5_

  - [x] 6.19 Create `fastapi_service/Dockerfile`
    - Base `python:3.12-slim`; copy `requirements.txt`; run `pip install --no-cache-dir`; run `python -m spacy download en_core_web_sm`
    - Copy `app/`; expose port 8001; entrypoint `uvicorn app.main:app --host 0.0.0.0 --port 8001`
    - _Requirements: deployment_

  - [x] 7. Checkpoint — FastAPI service complete
    - Run `pytest fastapi_service/` with all property and unit tests
    - Verify `GET /ai/health` returns 200 with model identifier
    - Verify `POST /ai/parse-recipe` returns 422 on short text and correct commodities on valid Kenyan meal input
    - Verify `POST /ai/pantry-exclusion` correctly deducts items and never returns zero-quantity entries
    - Ensure all tests pass; ask the user if questions arise.

- [-] 8. Phase 5 — Next.js Map Component Upgrades

  - [x] 8.1 Install MapLibre GL and replace Leaflet on the map page
    - Add `maplibre-gl` and `supercluster` to `frontend/package.json`
    - Remove `leaflet` / `react-leaflet` imports from map components
    - Create `frontend/app/(resident)/map/page.tsx` as the live map page container
    - _Requirements: 10.1_

  - [x] 8.2 Create `frontend/lib/mapUtils.ts`
    - Implement `toGeoJSON(stalls: StallFeature[]): GeoJSON.FeatureCollection` converting API stall response to GeoJSON
    - Implement `getBboxFromBounds(bounds: MapLibreBounds): BboxParams` extracting `min_lon`, `min_lat`, `max_lon`, `max_lat`
    - Implement `hashBbox(bbox: BboxParams): string` for cache key generation
    - _Requirements: 10_

  - [x] 8.3 Create `frontend/hooks/useStallMap.ts`
    - Debounce map bounds state update by exactly 300ms using `useDebouncedCallback` before dispatching `GET /api/map/stalls`
    - Cache last successful response in `localStorage` keyed by bbox hash
    - Set `isOffline: true` and serve cached stalls when network is unavailable
    - Export `{ stalls, isLoading, isOffline }`
    - _Requirements: 10.2, 10.7_

  - [x] 8.4 Create `frontend/hooks/useMapClusters.ts`
    - Apply Supercluster to stall GeoJSON features when map zoom < 15; return individual markers at zoom ≥ 15
    - Expose `{ clusters, supercluster }` for use in the canvas layer
    - _Requirements: 10.3, 10.4_

  - [ ]* 8.5 Write property test for Supercluster applied at zoom below 15
    - **Property 24: Supercluster Applied at Zoom Below 15**
    - For any set of stall GeoJSON features, at zoom < 15 nearby features must be grouped into cluster objects; at zoom ≥ 15 individual markers must be rendered
    - **Validates: Requirements 10.3**
    - Library: fast-check

  - [x] 8.6 Create `frontend/components/map/StallMap.tsx`
    - Render MapLibre GL canvas via `maplibre-gl` (not DOM markers) for 60 FPS performance
    - Use `useStallMap` for data and `useMapClusters` for clustering
    - On cluster tap: zoom to expand cluster
    - On individual stall tap: open `StallBottomSheet`
    - Render stall marker updates within 100ms of new data
    - _Requirements: 10.1, 10.4, 10.5, 10.6_

  - [x] 8.7 Create `frontend/components/map/StallBottomSheet.tsx`
    - Display trader name, category, open/closed status, rating, and "View Profile" button
    - Disable "View Profile" button and show tooltip when `isOffline = true`
    - _Requirements: 10.5, 10.7_

  - [x] 8.8 Create `frontend/components/map/ClusterLayer.tsx`
    - Render cluster circles with member count badge on the MapLibre GL canvas layer
    - _Requirements: 10.3_

  - [x] 8.9 Create `frontend/hooks/useRiderTracking.ts`
    - Open WebSocket to Go_Gateway at `/ws/rider?rider_id={riderId}&token={jwt}`
    - On position message: update `position: [lon, lat]` state within 500ms
    - On disconnect: implement exponential backoff `delay(N) = min(2^(N-1) * 1000ms, 30000ms)`, starting at 1s, capped at 30s
    - After 3 consecutive failed reconnect attempts: set `isTrackingUnavailable: true`
    - Export `{ position, isConnected, isTrackingUnavailable }`
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [ ]* 8.10 Write property test for exponential backoff stays within bounds
    - **Property 25: Exponential Backoff Stays Within Bounds**
    - For any sequence of reconnect attempts N, `delay(N) = min(2^(N-1) * 1000ms, 30000ms)`; delay must never fall below previous attempt, never exceed 30s, and must start at 1s
    - **Validates: Requirements 11.3**
    - Library: fast-check

  - [x] 8.11 Create `frontend/components/map/RiderMarker.tsx`
    - Render Boda rider icon layer on the MapLibre GL canvas, visually distinct from stall markers (different icon and colour)
    - Update marker position from `useRiderTracking.position` within 500ms
    - _Requirements: 11.2, 11.5_

  - [x] 8.12 Add tracking unavailability and offline banners to the map page
    - Show non-blocking banner when `isTrackingUnavailable = true`: "Live tracking temporarily unavailable"
    - Show `OfflineBanner` with offline indicator when `isOffline = true`; hide "View Profile" button
    - _Requirements: 10.7, 11.4, 13.4_

  - [x] 9. Checkpoint — Next.js map upgrades complete
    - Run `vitest --run` in `frontend/`
    - Verify `useStallMap` debounces correctly (fires once after 300ms, not on each intermediate event)
    - Verify offline banner renders when `navigator.onLine = false`
    - Verify exponential backoff sequence: 1s, 2s, 4s, 8s, …, 30s cap
    - Ensure all tests pass; ask the user if questions arise.

- [x] 10. Phase 6 — Cross-Service Wiring and Integration

  - [x] 10.1 Add Laravel Redis Pub/Sub subscriber for `rider_events`
    - Create a Laravel artisan command or queue worker that subscribes to `rider_events` channel
    - On `rider.disconnected` event: call `GeoService::removeTraderFromGeo()` for the rider's ID from `active_riders`
    - Log the removal with rider ID
    - _Requirements: 3.5, 3.6_

  - [ ]* 10.2 Write property test for rider disconnect cleaning GEO state
    - **Property 9: Rider Disconnect Cleans GEO State**
    - For any rider whose WebSocket closes, after the `rider.disconnected` Pub/Sub event is processed, the rider's ID must not be present in `active_riders`
    - **Validates: Requirements 3.5, 3.6**
    - Library: eris

  - [x] 10.3 Wire Next.js `useRiderTracking` to active delivery context
    - In the resident reservation detail page, detect active `Boda_Rider` delivery status
    - Only open the WebSocket when an active delivery is in progress; close on delivery completion
    - Pass the assigned rider ID from the reservation record
    - _Requirements: 11.1_

  - [x] 10.4 Add service degradation banner to Next.js app shell
    - Poll all three health endpoints (`/api/health`, `/ai/health`, `/go/health`) every 30 seconds
    - Display a non-blocking degradation banner if any returns non-200 for more than 30 seconds
    - _Requirements: 13.4_

  - [x] 10.5 Verify all communication contracts are enforced
    - Confirm Next.js → Laravel uses only REST/HTTPS with Sanctum token
    - Confirm Next.js → Go uses only WebSocket (`wss://`)
    - Confirm Laravel → FastAPI uses REST with `X-Internal-Token` header
    - Confirm Laravel → Go uses only Redis Pub/Sub on `rider_events`
    - Confirm all services connect to Redis via native client
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 10.6 Add `throttle:60,1` to `GET /api/map/stalls` and `throttle:10,1` to `POST /api/ai/chat`
    - Confirm middleware is applied as per design; write a Laravel unit test verifying 429 after limit breach
    - _Requirements: 14.4, 14.5_

  - [x] 10.7 Add structured JSON logging to all services
    - Laravel: configure a structured `fastapi` log channel in `config/logging.php`; verify PII redaction in `AiPipelineService`
    - FastAPI: configure Python `logging` to emit JSON with timestamp, service name, level, message
    - Go: verify `main.go` emits JSON structured logs to stdout
    - _Requirements: 13.5, 13.6, 13.7_

  - [x] 11. Checkpoint — Integration complete
    - Start all services via Docker Compose and run smoke tests across the full AI pipeline:
      - Parse recipe → pantry exclusion → trader matching → checkout assembly
    - Verify rider GPS pings flow: Go gateway GEOADD → Redis Pub/Sub → Laravel removes on disconnect
    - Verify circuit-breaker fires within 5s when FastAPI is stopped
    - Ensure all tests pass; ask the user if questions arise.

- [x] 12. Phase 7 — Deployment Configuration

  - [x] 12.1 Create `docker-compose.yml` at repository root
    - Define services: `postgres` (postgis/postgis:15-3.3-alpine), `redis` (redis:7-alpine with `--requirepass`), `laravel`, `fastapi`, `go_gateway`
    - Set `depends_on` chains: laravel → postgres + redis; fastapi → redis; go_gateway → redis
    - Mount named volumes `pgdata` and `redisdata`
    - Pass all required env vars via `environment` referencing `.env` substitutions
    - _Requirements: deployment_

  - [x] 12.2 Create Nginx reverse proxy configuration
    - Route `/ws/` → Go Gateway (port 8002) with WebSocket upgrade headers (`Upgrade`, `Connection`)
    - Route `/api/` → Laravel (port 8000)
    - Route `/go/health` → Go Gateway `/health` for load balancer probes
    - FastAPI must NOT be exposed publicly — accessible only via Docker internal network from Laravel
    - _Requirements: 12.3, 14.2, deployment_

  - [x] 12.3 Add Laravel `.env` additions and `.env.example` updates
    - Add: `DB_CONNECTION=pgsql`, `FASTAPI_URL`, `FASTAPI_INTERNAL_TOKEN`, `INTERNAL_API_TOKEN`, `REDIS_HOST`, `REDIS_PASSWORD`
    - Add `config/services.php` entries for `fastapi.url` and `fastapi.token`
    - _Requirements: deployment_

  - [x] 12.4 Create `fastapi_service/.env.example` and `go_gateway/.env.example`
    - Document all required environment variables with placeholder values and inline comments
    - _Requirements: deployment_

  - [x] 12.5 Document the deployment sequence in `DEPLOYMENT.md`
    - Steps: provision PostGIS → run Laravel migrations → run coordinate population migration → seed Redis → deploy FastAPI → deploy Go Gateway → deploy Laravel → deploy Next.js → run reconciliation cron
    - Include health check verification commands for each step
    - _Requirements: deployment_

  - [x] 13. Final Checkpoint — Full stack end-to-end
    - Run full test suites for all four services
    - Verify Docker Compose brings up all services and health checks pass
    - Verify Nginx routes correctly: WebSocket to Go, REST to Laravel
    - Verify FastAPI is not accessible from outside the Docker network
    - Ensure all tests pass; ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP build
- Each task references specific requirements from `requirements.md` for traceability
- Property tests are placed immediately after the relevant implementation task to catch errors early
- Checkpoints validate the current phase before starting the next
- The build sequence is strictly ordered: each phase depends on the previous being functional
- Property test libraries: Laravel → eris, Python → hypothesis, Go → rapid, TypeScript → fast-check
- Each property test must include the comment tag: `Feature: polyglot-architecture-upgrade, Property N: <text>`
- The `INTERNAL_API_TOKEN` / `X-Internal-Token` shared secret must be set identically in Laravel and FastAPI env vars
- FastAPI is intentionally not exposed via Nginx — all AI calls are Laravel → FastAPI over Docker internal network

# Requirements Document

## Introduction

Soko Mtaa currently runs on a single-stack architecture: Laravel 11 + Next.js 14 backed by MySQL. This feature upgrades the platform to a polyglot microservice architecture where each runtime is assigned exclusively to the workload it is structurally strongest at.

The upgrade introduces three major capabilities:

1. **Database migration** — MySQL → PostgreSQL + PostGIS, enabling native geospatial queries on trader stalls.
2. **Python FastAPI service** — a dedicated AI/NLP engine for the Conversational AI Shopping Assistant Pipeline, handling recipe parsing, pantry exclusion, and semantic search.
3. **Go WebSocket service** — a high-concurrency GPS ingestion gateway capable of sustaining 100,000+ simultaneous Boda Boda rider connections with Redis GEO writes.

All four services (Next.js, Laravel, FastAPI, Go) communicate over REST, gRPC, WebSocket, and Redis Pub/Sub. The existing Laravel business logic, M-Pesa payment flow, RBAC, and reservation lifecycle are preserved and extended — not replaced.

---

## Glossary

- **Platform**: The Soko Mtaa system as a whole, comprising all services.
- **Laravel_API**: The Laravel 11 + Octane (FrankenPHP) backend service; the authoritative source for business logic, RBAC, order lifecycles, and M-Pesa payments.
- **FastAPI_Service**: The Python FastAPI asynchronous microservice responsible for NLP parsing, recipe scaling, pantry exclusion logic, and semantic vector search.
- **Go_Gateway**: The Go (Gorilla WebSockets) service responsible for high-frequency GPS ingestion and Redis GEO writes.
- **Next_JS_Client**: The Next.js 14 (App Router) frontend delivering SSR pages, the AI chat UI, and the live map component.
- **AI_Pipeline**: The five-step Conversational AI Shopping Assistant workflow spanning FastAPI_Service and Laravel_API.
- **Resident**: A buyer user role within the Platform.
- **Trader**: A seller/stall-owner user role within the Platform.
- **Boda_Rider**: A last-mile delivery rider whose GPS position is tracked by the Go_Gateway.
- **Admin**: A county official user role with oversight capabilities.
- **Redis**: The shared Redis instance used for GEO indexing, caching, and Pub/Sub messaging between services.
- **PostGIS**: The PostgreSQL spatial extension used for geographic queries on stall locations.
- **Viewport_BBox**: The geographic bounding box representing the area currently visible in the map client, defined by min/max longitude and latitude.
- **Recipe_Request**: A natural-language utterance from a Resident describing a meal and headcount (e.g. "I have 10 visitors and want to cook ugali, sukuma wiki, and eggs").
- **Commodity_List**: The structured JSON output of the FastAPI_Service recipe parser listing required ingredients with quantities and units.
- **Pantry_Exclusion**: The conversational step in which the AI_Pipeline deducts items the Resident already owns from the Commodity_List.
- **STK_Push**: The M-Pesa Daraja Express payment flow that sends a PIN prompt directly to the Resident's phone.
- **GEO_Key**: The Redis key `active_riders` used for GEOADD / GEODIST operations on rider positions.
- **Supercluster**: The client-side clustering library applied to map markers at zoom levels below 15.

---

## Requirements

### Requirement 1: Database Migration — MySQL to PostgreSQL + PostGIS

**User Story:** As a Platform operator, I want the relational database migrated from MySQL to PostgreSQL with the PostGIS extension, so that stall locations can be indexed and queried spatially without a separate geocoding layer.

#### Acceptance Criteria

1. THE Laravel_API SHALL connect to a PostgreSQL 15+ database as its primary relational store, replacing the existing MySQL connection.
2. THE Laravel_API SHALL load the PostGIS extension on the target database before running any spatial migration.
3. WHEN the stalls table migration runs, THE Laravel_API SHALL add a `location` column of type `GEOGRAPHY(Point, 4326)` to the stalls table.
4. WHEN the stalls table migration runs, THE Laravel_API SHALL create a GiST spatial index named `stalls_location_gist_idx` on the `location` column.
5. WHEN a stall record is created or updated with latitude and longitude values, THE Laravel_API SHALL write the corresponding `GEOGRAPHY(Point, 4326)` value to the `location` column.
6. THE Laravel_API SHALL populate the `location` column for all existing stall records by deriving values from the stalls table's existing `map_x` and `map_y` coordinate fields during migration.
7. IF the PostGIS extension is not available on the target database, THEN THE Laravel_API SHALL halt the migration and return a descriptive error message identifying the missing extension.
8. THE Laravel_API SHALL preserve all existing relational schema constraints, foreign keys, and indexes after migration to PostgreSQL.

---

### Requirement 2: Viewport Bounding Box Spatial Query API

**User Story:** As a Resident using the live map, I want trader stalls visible in my current map viewport to load within 500ms, so that panning and zooming feel instant rather than laggy.

#### Acceptance Criteria

1. THE Laravel_API SHALL expose a `GET /api/map/stalls` endpoint that accepts `min_lon`, `min_lat`, `max_lon`, and `max_lat` as required numeric query parameters.
2. WHEN a valid Viewport_BBox request is received, THE Laravel_API SHALL query stalls using `ST_Within(location::geometry, ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326))` against the PostGIS index.
3. WHEN a valid Viewport_BBox request is received, THE Laravel_API SHALL respond within 500ms under a load of up to 200 concurrent requests.
4. THE Laravel_API SHALL return only stalls whose `status` is `occupied` or `available` from the bounding box query, excluding stalls with `status = maintenance` from public results.
5. WHEN `min_lon`, `min_lat`, `max_lon`, or `max_lat` values fall outside the valid WGS-84 range (longitude −180 to 180, latitude −90 to 90), THEN THE Laravel_API SHALL return a `VALIDATION_ERROR` response with HTTP 422.
6. WHEN `max_lon` is less than or equal to `min_lon`, or `max_lat` is less than or equal to `min_lat`, THEN THE Laravel_API SHALL return a `VALIDATION_ERROR` response with HTTP 422.
7. THE Laravel_API SHALL check the Redis GEO cache for active stall positions before falling back to the PostGIS query, returning cached results when available.
8. WHEN a stall's `is_open` status changes, THE Laravel_API SHALL update the corresponding Redis GEO entry within 5 seconds of the change event.

---

### Requirement 3: Redis GEO Mirroring for Active Stalls and Riders

**User Story:** As the Platform, I want active trader stalls and Boda Rider positions mirrored into Redis GEO, so that spatial lookups bypass the relational database for sub-millisecond response times.

#### Acceptance Criteria

1. WHEN a Trader's stall is marked as open (`is_open = true`), THE Laravel_API SHALL execute a `GEOADD active_traders <longitude> <latitude> <stall_id>` command on Redis.
2. WHEN a Trader's stall is marked as closed (`is_open = false`), THE Laravel_API SHALL remove the stall's entry from the `active_traders` Redis GEO key.
3. WHEN the Go_Gateway receives a GPS ping from a Boda_Rider, THE Go_Gateway SHALL execute a `GEOADD active_riders <longitude> <latitude> <rider_id>` command on Redis within 100ms of receiving the ping.
4. THE Go_Gateway SHALL overwrite the previous GEO position for a given rider on each new GPS ping rather than creating duplicate entries.
5. WHEN a Boda_Rider's WebSocket connection closes, THE Go_Gateway SHALL publish a `rider.disconnected` event to the Redis Pub/Sub channel `rider_events`, including the rider's ID.
6. WHEN THE Laravel_API receives a `rider.disconnected` event from Redis Pub/Sub, THE Laravel_API SHALL remove the rider's entry from the `active_riders` Redis GEO key.
7. THE Redis GEO key `active_traders` SHALL be consistent with the stalls table `is_open` field at all times, verified by a reconciliation job that runs every 5 minutes.

---

### Requirement 4: Go WebSocket GPS Gateway

**User Story:** As the Platform, I want a dedicated Go service that ingests high-frequency GPS pings from Boda Riders over persistent WebSocket connections, so that the Laravel API is not burdened by the concurrency demands of 100,000+ simultaneous socket connections.

#### Acceptance Criteria

1. THE Go_Gateway SHALL accept WebSocket upgrade requests at the path `/ws/rider` and authenticate each connection using a `rider_id` query parameter validated against a token issued by the Laravel_API.
2. WHEN a Boda_Rider sends a GPS ping over the WebSocket connection, THE Go_Gateway SHALL parse the JSON payload `{"lat": <float>, "lon": <float>}` and write the position to Redis GEO within 100ms.
3. THE Go_Gateway SHALL support at least 100,000 concurrent WebSocket connections without exceeding 2GB of resident memory.
4. WHEN a GPS ping payload is malformed or contains values outside valid WGS-84 ranges, THE Go_Gateway SHALL close the WebSocket connection with close code 1008 (Policy Violation) and log the error.
5. WHEN a WebSocket connection is idle for more than 30 seconds without a ping, THE Go_Gateway SHALL send a WebSocket ping frame and close the connection if no pong is received within 10 seconds.
6. THE Go_Gateway SHALL expose a `GET /health` HTTP endpoint that returns HTTP 200 with `{"status": "ok"}` when the service is running and Redis is reachable.
7. IF the Redis connection is unavailable, THEN THE Go_Gateway SHALL buffer incoming GPS pings in memory for up to 30 seconds and retry the Redis write, logging each failed write attempt.
8. THE Go_Gateway SHALL publish a `rider.position_updated` event to the Redis Pub/Sub channel `rider_events` after each successful GEOADD, including the rider's ID, latitude, and longitude.

---

### Requirement 5: Python FastAPI — Recipe & Commodity Parser

**User Story:** As a Resident, I want to describe a meal and headcount in natural language and receive a structured list of required ingredients with quantities, so that I can shop across multiple traders without manually calculating quantities.

#### Acceptance Criteria

1. THE FastAPI_Service SHALL expose a `POST /ai/parse-recipe` endpoint accepting a JSON body with fields `text` (string, required) and `user_id` (integer, required).
2. WHEN a valid Recipe_Request is received, THE FastAPI_Service SHALL extract the meal names and headcount from the natural language `text` field and return a `commodities` array within 3 seconds.
3. WHEN a valid Recipe_Request is received, THE FastAPI_Service SHALL scale standard per-person ingredient ratios by the extracted headcount to produce the Commodity_List.
4. THE FastAPI_Service SHALL return each commodity item as an object with fields `name` (string), `quantity` (number), and `unit` (string, e.g. "kg", "bunch", "piece").
5. WHEN the `text` field is empty or contains fewer than 3 characters, THEN THE FastAPI_Service SHALL return HTTP 422 with a descriptive validation error.
6. WHEN the `text` field does not contain a recognisable meal name or headcount, THEN THE FastAPI_Service SHALL return HTTP 422 with error code `PARSE_FAILED` and a message describing what information is missing.
7. THE FastAPI_Service SHALL support parsing of at least the following Kenyan staple meal components: ugali, sukuma wiki, eggs, rice, beans, chapati, githeri, nyama choma, pilau, mandazi, chai.
8. FOR ALL valid Recipe_Request inputs that produce a Commodity_List, parsing the same text twice SHALL produce an equivalent Commodity_List (idempotence property).

---

### Requirement 6: Python FastAPI — Recipe Parser Serialisation Round-Trip

**User Story:** As a Platform developer, I want the FastAPI recipe parser and its JSON serialiser to be verifiably correct, so that commodity data is never silently corrupted between the AI service and the Laravel API.

#### Acceptance Criteria

1. THE FastAPI_Service SHALL serialise every Commodity_List response as valid JSON conforming to the `RecipeResponse` Pydantic schema.
2. THE FastAPI_Service SHALL provide a `POST /ai/parse-recipe/roundtrip` test endpoint that accepts a `RecipeResponse` JSON body, deserialises it, re-serialises it, and returns the result.
3. FOR ALL valid RecipeResponse objects, deserialising then re-serialising SHALL produce a byte-for-byte equivalent JSON string (round-trip property).
4. WHEN a `RecipeResponse` object with a `commodities` array of length N is serialised and deserialised, THE FastAPI_Service SHALL return a `commodities` array of the same length N (invariant property).
5. THE FastAPI_Service SHALL expose a `GET /ai/health` endpoint returning HTTP 200 with `{"status": "ok", "model": "<model_identifier>"}` when the NLP model is loaded and ready.
6. IF the NLP model fails to load at startup, THEN THE FastAPI_Service SHALL refuse all requests to `/ai/parse-recipe` with HTTP 503 and a `SERVICE_UNAVAILABLE` error code until the model is loaded.

---

### Requirement 7: Conversational AI Shopping Assistant — Pantry Exclusion

**User Story:** As a Resident, I want the AI assistant to ask me which ingredients I already have at home and remove them from my shopping list, so that I only order what I actually need.

#### Acceptance Criteria

1. WHEN the AI_Pipeline produces a Commodity_List, THE FastAPI_Service SHALL return a conversational prompt asking the Resident which items from the Commodity_List are already in their pantry.
2. WHEN the Resident provides a pantry response, THE FastAPI_Service SHALL deduct the confirmed in-stock items from the Commodity_List and return a revised list.
3. WHEN all items in the Commodity_List are confirmed as available in the Resident's pantry, THE FastAPI_Service SHALL return an empty `commodities` array and a message indicating that no items need to be purchased.
4. THE FastAPI_Service SHALL maintain conversation state across the pantry exclusion exchange using a `session_id` field in the request body, persisted in Redis with a TTL of 30 minutes.
5. IF a `session_id` is not found in Redis, THEN THE FastAPI_Service SHALL return HTTP 404 with error code `SESSION_NOT_FOUND` and instruct the client to restart the AI_Pipeline from Step 1.
6. WHEN the Resident confirms zero pantry items, THE FastAPI_Service SHALL return the original Commodity_List unchanged.
7. FOR ALL valid pantry exclusion operations, the quantity of any remaining commodity item SHALL be greater than zero after exclusion (invariant: no zero-quantity items in output).

---

### Requirement 8: Conversational AI Shopping Assistant — Multi-Trader Market Matching

**User Story:** As a Resident, I want the AI assistant to find local traders who stock the ingredients I need and present the best options for each item, so that I can make a single coordinated purchase rather than manually searching each trader.

#### Acceptance Criteria

1. WHEN a revised Commodity_List is available after Pantry_Exclusion, THE FastAPI_Service SHALL call the Laravel_API to query active trader stalls within the Resident's configured radius that stock each commodity item.
2. THE Laravel_API SHALL expose an internal `POST /internal/ai/match-traders` endpoint that accepts a Commodity_List and a Resident's location and returns matching traders per commodity item.
3. WHEN multiple traders stock the same commodity, THE Laravel_API SHALL rank traders by price (ascending) as the default ordering, with the lowest-price option presented first.
4. WHEN multiple traders stock the same commodity, THE FastAPI_Service SHALL present the Resident with the lowest-price option and the highest-rated option for each item, distinguishing between them clearly.
5. WHEN no active trader within the Resident's configured radius stocks a required commodity item, THE FastAPI_Service SHALL inform the Resident that the item is unavailable locally and exclude it from the checkout assembly.
6. THE Laravel_API internal endpoint SHALL be authenticated using the `InternalApiAuth` middleware and SHALL NOT be accessible without a valid internal service token.

---

### Requirement 9: Conversational AI Shopping Assistant — Fulfilment Selection and Checkout Assembly

**User Story:** As a Resident, I want to choose between self-pickup and Boda Boda delivery and then confirm a single checkout covering all selected traders, so that I pay once with M-Pesa rather than initiating separate transactions per trader.

#### Acceptance Criteria

1. WHEN trader matching is complete, THE FastAPI_Service SHALL present the Resident with a fulfilment choice: self-pickup or last-mile Boda_Rider delivery.
2. WHEN the Resident selects Boda_Rider delivery, THE Laravel_API SHALL calculate the delivery fee dynamically based on the distance between the Resident's location and the furthest trader stall in the order.
3. THE Laravel_API SHALL assemble a single multi-merchant checkout payload containing all selected commodity items, their respective traders, quantities, unit prices, and the delivery fee (if applicable).
4. WHEN the Resident confirms the checkout payload, THE Laravel_API SHALL trigger a single STK_Push to the Resident's registered M-Pesa phone number for the total order value including delivery fee.
5. WHEN the STK_Push succeeds, THE Laravel_API SHALL create individual reservation records for each trader in the multi-merchant order and set their status to `paid`.
6. WHEN the STK_Push fails, THE Laravel_API SHALL return a `PAYMENT_FAILED` error and SHALL NOT create any reservation records.
7. THE Laravel_API SHALL process the multi-merchant checkout atomically — either all reservation records are created or none are (all-or-nothing transactional guarantee).
8. WHEN the multi-merchant checkout is complete, THE Laravel_API SHALL dispatch SMS notifications to each involved Trader using the T07 notification template.

---

### Requirement 10: Next.js Live Map — Debounced Viewport Fetch

**User Story:** As a Resident browsing the live market map, I want stall markers to update smoothly as I pan and zoom without triggering excessive API requests, so that the map feels responsive even on a slow 3G connection.

#### Acceptance Criteria

1. THE Next_JS_Client SHALL render a `StallMap` component using MapLibre GL with WebGL canvas rendering for stall markers, replacing any existing DOM-based marker approach.
2. WHEN the map viewport changes (pan or zoom), THE Next_JS_Client SHALL debounce the bounding box state update by 300ms before dispatching a fetch to `GET /api/map/stalls`.
3. THE Next_JS_Client SHALL apply Supercluster client-side clustering to stall markers when the map zoom level is below 15, grouping nearby stalls into a single cluster marker.
4. WHEN a cluster marker is tapped, THE Next_JS_Client SHALL zoom the map to a level that expands the cluster and reveals individual stall markers.
5. WHEN an individual stall marker is tapped, THE Next_JS_Client SHALL display a bottom-sheet overlay containing the stall's trader name, category, open/closed status, rating, and a "View Profile" button.
6. THE Next_JS_Client SHALL render stall marker updates within 100ms of receiving new data from the bounding box API response, targeting 60 FPS on the map canvas.
7. WHEN the device has no internet connection, THE Next_JS_Client SHALL display the last-cached stall positions with an offline indicator banner and disable the "View Profile" action button.
8. THE Next_JS_Client SHALL establish a WebSocket connection to the Go_Gateway at `/ws/map` to receive live Boda_Rider position updates and render rider markers on the map canvas separately from stall markers.

---

### Requirement 11: Next.js Live Map — Rider Position Streaming

**User Story:** As a Resident tracking a Boda Rider delivery, I want to see the rider's position update on the map in near real-time, so that I know when to expect my delivery.

#### Acceptance Criteria

1. WHEN a Resident has an active Boda_Rider delivery, THE Next_JS_Client SHALL open a WebSocket connection to the Go_Gateway and subscribe to position updates for the assigned rider's ID.
2. WHEN a Boda_Rider position update is received over WebSocket, THE Next_JS_Client SHALL update the rider's marker position on the map canvas within 500ms of receiving the message.
3. WHEN the WebSocket connection to the Go_Gateway is lost, THE Next_JS_Client SHALL attempt to reconnect with exponential backoff starting at 1 second, up to a maximum of 30 seconds between attempts.
4. WHEN the WebSocket connection cannot be re-established after 3 consecutive attempts, THE Next_JS_Client SHALL display a non-blocking banner informing the Resident that live tracking is temporarily unavailable.
5. THE Next_JS_Client SHALL render Boda_Rider markers as visually distinct from Trader stall markers using a different icon and colour.

---

### Requirement 12: Cross-Service Communication Contracts

**User Story:** As a Platform developer, I want well-defined communication contracts between all four services, so that each service can be developed, deployed, and replaced independently without breaking the others.

#### Acceptance Criteria

1. THE Next_JS_Client SHALL communicate with THE Laravel_API exclusively via REST over HTTPS for all CRUD, authentication, and order operations.
2. THE Next_JS_Client SHALL communicate with THE Go_Gateway exclusively via WebSocket for rider position streaming and map updates.
3. THE Laravel_API SHALL communicate with THE FastAPI_Service via REST (HTTP/JSON) for AI pipeline calls, with gRPC as an optional upgrade path documented in the design.
4. THE Laravel_API SHALL communicate with THE Go_Gateway exclusively via Redis Pub/Sub for event notifications (delivery accepted, status changes, rider disconnection).
5. ALL services SHALL communicate with Redis directly via a Redis client library native to each service's runtime.
6. THE Laravel_API SHALL validate all internal inter-service requests using the existing `InternalApiAuth` middleware before processing.
7. WHEN THE FastAPI_Service is unavailable, THE Laravel_API SHALL return a `SERVICE_UNAVAILABLE` error to the client within 5 seconds rather than hanging indefinitely, using a circuit-breaker timeout.
8. WHEN THE Go_Gateway is unavailable, THE Next_JS_Client SHALL degrade gracefully to a static map view without rider positions and SHALL NOT prevent the Resident from completing orders.

---

### Requirement 13: Service Health and Observability

**User Story:** As a Platform operator, I want each microservice to expose a health check endpoint and structured logs, so that I can detect failures and diagnose issues across the polyglot stack from a single monitoring point.

#### Acceptance Criteria

1. THE Laravel_API SHALL expose a `GET /api/health` endpoint returning HTTP 200 with `{"status": "ok", "db": "ok", "redis": "ok"}` when both PostgreSQL and Redis are reachable.
2. THE FastAPI_Service SHALL expose a `GET /ai/health` endpoint returning HTTP 200 with `{"status": "ok", "model": "<model_identifier>"}` when the NLP model is loaded.
3. THE Go_Gateway SHALL expose a `GET /health` endpoint returning HTTP 200 with `{"status": "ok"}` when Redis is reachable.
4. THE Next_JS_Client SHALL display a non-blocking service degradation banner when any upstream service health check returns a non-200 status for more than 30 seconds.
5. ALL services SHALL emit structured JSON logs to stdout, including at minimum: timestamp, service name, log level, and message.
6. WHEN THE Laravel_API receives a 5xx error from THE FastAPI_Service, THE Laravel_API SHALL log the error with the `fastapi` log channel including the request payload (with PII fields redacted) and the response body.
7. WHEN THE Go_Gateway fails to write a GPS ping to Redis, THE Go_Gateway SHALL log the failure with rider ID, attempted coordinates, and error reason.

---

### Requirement 14: Authentication and Security Across Services

**User Story:** As a Platform operator, I want all inter-service communication and new public endpoints to enforce the same authentication and authorisation standards as the existing Laravel API, so that the polyglot expansion does not introduce new attack surfaces.

#### Acceptance Criteria

1. THE Go_Gateway SHALL validate the `rider_id` query parameter on WebSocket upgrade requests by verifying a signed token issued by THE Laravel_API before accepting the connection.
2. THE FastAPI_Service SHALL accept requests only from THE Laravel_API, verified by an `X-Internal-Token` header that matches a shared secret configured via environment variable.
3. THE Laravel_API internal endpoint `POST /internal/ai/match-traders` SHALL reject requests without a valid `X-Internal-Token` header with HTTP 401.
4. THE Laravel_API SHALL rate-limit the `GET /api/map/stalls` endpoint to 60 requests per minute per authenticated user using the existing `throttle` middleware.
5. THE Laravel_API SHALL rate-limit the AI pipeline entry endpoint to 10 requests per minute per authenticated Resident to prevent abuse of the NLP model.
6. ALL service-to-service communication SHALL occur over encrypted channels (TLS) in production environments.
7. THE FastAPI_Service SHALL never log the contents of `text` fields from Recipe_Requests in production mode, as they may contain personal pantry or dietary information.

---

### Requirement 15: Data Migration — Existing Stall Coordinates

**User Story:** As a Platform operator, I want existing stall records migrated to PostGIS coordinates automatically during the database upgrade, so that the live map works immediately after deployment without a manual data re-entry step.

#### Acceptance Criteria

1. THE Laravel_API SHALL provide a database migration that reads all existing stall records and populates the `location` GEOGRAPHY column by converting the stalls' `map_x` and `map_y` pixel-offset values to WGS-84 longitude/latitude using the Kolenyo Market reference coordinates (latitude −0.0917, longitude 34.7679).
2. WHEN the coordinate conversion migration runs, THE Laravel_API SHALL log the count of stall records successfully migrated and any records that could not be converted due to null `map_x` or `map_y` values.
3. IF a stall record has null `map_x` or `map_y` values, THEN THE Laravel_API SHALL leave the `location` column null for that record and continue migrating the remaining records.
4. THE Laravel_API SHALL seed the `active_traders` Redis GEO key with all currently open stalls after the migration completes, as a post-migration step.
5. THE data migration SHALL be idempotent — running the migration twice SHALL NOT create duplicate entries or overwrite manually corrected `location` values with pixel-derived coordinates.

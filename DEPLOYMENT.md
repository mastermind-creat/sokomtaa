# Soko Mtaa — Deployment Guide

Polyglot architecture: Laravel + PostgreSQL/PostGIS · Python FastAPI · Go WebSocket Gateway · Next.js

---

## Prerequisites

| Requirement | Version |
|---|---|
| Docker | ≥ 24 |
| Docker Compose | ≥ 2.20 |
| `openssl` | any |
| Node.js (for Next.js deploy to Vercel) | ≥ 20 |

---

## Environment Setup

### 1. Copy and configure environment files

```bash
# Root .env (used by Docker Compose variable substitution)
cp backend/.env.example .env

# FastAPI
cp fastapi_service/.env.example fastapi_service/.env

# Go Gateway (values passed via docker-compose environment — .env is for local dev reference)
cp go_gateway/.env.example go_gateway/.env
```

Generate strong secrets:

```bash
echo "INTERNAL_API_TOKEN=$(openssl rand -hex 32)"
echo "JWT_SECRET=$(openssl rand -hex 32)"
echo "REDIS_PASSWORD=$(openssl rand -hex 16)"
```

Fill these into `.env`, `fastapi_service/.env`, and `go_gateway/.env`.

> The `INTERNAL_API_TOKEN` must be identical in `.env` (as `INTERNAL_API_TOKEN`) and
> `fastapi_service/.env` (as `FASTAPI_INTERNAL_TOKEN`).
> The `JWT_SECRET` must be identical in `.env` and `go_gateway/.env`.

---

## Deployment Sequence

Follow these steps **in order**. Each step must succeed before proceeding.

---

### Step 1 — Provision PostgreSQL with PostGIS

Start only the database and Redis services first:

```bash
docker compose up -d postgres redis
```

Wait for the database to be ready:

```bash
docker compose exec postgres pg_isready -U sokomtaa -d sokomtaa
```

Verify PostGIS is available (the Laravel migration requires it):

```bash
docker compose exec postgres psql -U sokomtaa -d sokomtaa \
  -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'postgis';"
```

Expected output: a row with `postgis` and a version string.
If empty, install the extension:

```bash
docker compose exec postgres psql -U sokomtaa -d sokomtaa \
  -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

Health check:

```bash
curl -sf http://localhost:5432 || \
  docker compose exec postgres pg_isready -U sokomtaa && echo "postgres OK"
```

---

### Step 2 — Run Laravel Migrations

Build and start the Laravel service:

```bash
docker compose up -d --build laravel
```

Run the schema migrations (includes PostGIS column and GiST index):

```bash
docker compose exec laravel php artisan migrate --force
```

Verify the PostGIS column was created:

```bash
docker compose exec postgres psql -U sokomtaa -d sokomtaa \
  -c "\d stalls" | grep location
```

Expected: `location | geography(Point,4326)`

---

### Step 3 — Run Coordinate Population Migration

This populates the `location` GEOGRAPHY column from existing `map_x`/`map_y` pixel offsets.
The migration is **idempotent** — it skips rows where `location` is already set.

```bash
docker compose exec laravel php artisan migrate --force
```

Verify migration results in the Laravel log:

```bash
docker compose exec laravel tail -n 50 storage/logs/laravel.log | grep -i "migrated\|skipped"
```

---

### Step 4 — Seed Redis GEO with Active Traders

Run the reconciliation command to populate `active_traders` in Redis:

```bash
docker compose exec laravel php artisan geo:reconcile
```

Verify traders are in Redis GEO:

```bash
docker compose exec redis redis-cli -a "${REDIS_PASSWORD}" ZCARD active_traders
```

Expected: a non-negative integer (0 if no traders are `is_open = true`).

---

### Step 5 — Deploy FastAPI AI Service

```bash
docker compose up -d --build fastapi
```

Health check:

```bash
docker compose exec laravel curl -sf http://fastapi:8001/ai/health
```

Expected response:

```json
{"status": "ok", "model": "en_core_web_sm"}
```

> FastAPI is accessible **only** from within the Docker network. Do not expose port 8001 publicly.

---

### Step 6 — Deploy Go WebSocket Gateway

```bash
docker compose up -d --build go_gateway
```

Health check:

```bash
curl -sf http://localhost:8002/health
```

Expected response:

```json
{"status": "ok"}
```

Verify Redis connectivity from the gateway:

```bash
docker compose logs go_gateway | grep -i "redis\|started\|listening"
```

---

### Step 7 — Deploy Laravel (full stack)

If not already running, start the full Laravel service:

```bash
docker compose up -d laravel
```

Health check (all dependencies):

```bash
curl -sf http://localhost:8000/api/health
```

Expected response:

```json
{"status": "ok", "db": "ok", "redis": "ok"}
```

---

### Step 8 — Deploy Nginx Reverse Proxy

```bash
docker compose up -d nginx
```

Verify routing:

```bash
# REST API via Nginx
curl -sf http://localhost/api/health
# Expected: {"status":"ok","db":"ok","redis":"ok"}

# Go Gateway health via Nginx proxy path
curl -sf http://localhost/go/health
# Expected: {"status":"ok"}
```

Verify FastAPI is NOT reachable from outside the Docker network:

```bash
curl -sf http://localhost:8001/ai/health 2>&1 | grep -q "refused\|failed" && echo "FastAPI correctly blocked"
```

---

### Step 9 — Deploy Next.js (Vercel)

```bash
cd frontend
npx vercel --prod
```

Set these environment variables in the Vercel dashboard:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.sokomtaa.co.ke` |
| `NEXT_PUBLIC_WS_URL` | `wss://api.sokomtaa.co.ke` |

---

### Step 10 — Register Reconciliation Cron

The `geo:reconcile` command must run every 5 minutes to keep `active_traders` consistent with the database.

For Docker-based deployments, this is scheduled via Laravel's built-in scheduler.
Ensure the scheduler cron is running inside the Laravel container:

```bash
docker compose exec laravel php artisan schedule:list | grep reconcile
```

For VPS/bare-metal add to `crontab -e`:

```
* * * * * docker compose -f /path/to/docker-compose.yml exec -T laravel php artisan schedule:run >> /dev/null 2>&1
```

---

## Full Stack Health Verification

After all steps, verify every service is healthy:

```bash
# PostgreSQL
docker compose exec postgres pg_isready -U sokomtaa -d sokomtaa

# Redis
docker compose exec redis redis-cli -a "${REDIS_PASSWORD}" ping

# Laravel API (via Nginx)
curl -sf http://localhost/api/health

# Go Gateway (via Nginx)
curl -sf http://localhost/go/health

# FastAPI (internal — via Laravel container)
docker compose exec laravel curl -sf http://fastapi:8001/ai/health

# All containers running
docker compose ps
```

All health checks should return `ok`.

---

## Bring Everything Up at Once

After the first-run sequence above, subsequent starts are:

```bash
docker compose up -d
```

Docker Compose respects the `depends_on` health-check chains:
`nginx` → `laravel` + `go_gateway` → `postgres` + `redis`; `fastapi` → `redis`.

---

## Rollback

To roll back a failed migration:

```bash
docker compose exec laravel php artisan migrate:rollback --step=1 --force
```

To stop all services:

```bash
docker compose down
```

To stop and remove volumes (full reset — **destructive**):

```bash
docker compose down -v
```

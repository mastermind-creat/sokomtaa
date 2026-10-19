# Soko Mtaa: Project Handoff (Server Hosting & Deployment State)

**Purpose of this document:** brief an AI assistant (Google AI Studio) on exactly where the Soko Mtaa demo deployment stands, what was done, what was fixed, and what is still open. No passwords, tokens or keys are included; see "Secrets" for where they live.

**Snapshot date:** 2026-10-18
**Project goal:** *demonstration at an event only*, not a production rollout. Budget is deliberately minimal.

---

## 1. What Soko Mtaa is

A hyper-local Kenyan digital marketplace connecting **Residents (buyers)**, **Traders/Stalls**, **Boda Boda riders** and **County administrators**. Features: product marketplace, reservations, M-Pesa (Daraja sandbox) payments, rider live tracking on a map, an AI shopping assistant (recipe → ingredient list → trader matching → single M-Pesa checkout), notifications, analytics.

### Architecture (polyglot)

| Layer | Tech | Notes |
|---|---|---|
| Frontend | Next.js 15.5 (App Router) | Deployed on **Vercel** |
| Core API | Laravel 13 (PHP 8.3-fpm-alpine) | Nginx + supervisor run *inside* the Laravel container (it is **not** Octane/FrankenPHP) |
| AI / NLP | Python 3.12 FastAPI + spaCy `en_core_web_sm` | Internal only, `X-Internal-Token` auth (except `/ai/health`) |
| Real-time GPS | Go 1.22 gateway (Gorilla WebSockets) | JWT-authenticated, writes to Redis GEO |
| Database | PostgreSQL 15 + PostGIS 3.3 | Image `postgis/postgis:15-3.3-alpine` |
| Cache / pub-sub / GEO | Redis 7 (password protected) | `active_traders` GEO set |
| Edge | Caddy 2 (HTTPS) → Nginx 1.25 (routing) | Caddy gets Let's Encrypt certs automatically |

Repo layout (local laptop: `/opt/lampp/htdocs/sokomtaa`, server: `~/soko-mtaa`):
`backend/` (Laravel), `fastapi_service/`, `go_gateway/`, `frontend/` (not copied to server; it deploys to Vercel), `nginx/`, `docker-compose.yml`, plus files added during this work: `docker-compose.override.yml`, `Caddyfile`, `.env.additions`, `DEPLOYMENT.md`.

---

## 2. Hosting: current state

### The VPS (InterServer)
- Plan: **KVM Linux VPS Slice, 1 slice, $3/month**, host server KVM463. Slices are typically ~1 vCPU / 2 GB RAM / ~30 GB SSD (RAM/CPU not verified on the box; disk showed ~39 GB). Upgrade path: "Upgrade VPS Slices" in the control panel.
- IP: `69.169.111.234`. OS: **Ubuntu 26.04.1 LTS** (the "ubuntu 24 desktop template", so a GUI may be installed; headless target is recommended to save RAM).
- Users: `root` (initial) and non-root **`deploy`** (sudo, in `docker` group).
- Firewall: `ufw` enabled, allowing 22, 80, 443 only.
- Docker 29.9.1, Docker Compose v5.6.0.
- SSH: password login currently **still enabled**. Key login was set up with `ssh-copy-id` but **not confirmed**. Do not disable password auth until key login is verified from the current machine.
- InterServer's VNC setup never worked and isn't needed (SSH is used).
- Alternative considered: HostAfrica Linux VPS plans (C4: 2 vCPU / 4 GB / 100 GB, ~R430/mo). Not needed for a demo.

### Hostnames
- **Backend (HTTPS):** `https://69-169-111-234.sslip.io` (free wildcard DNS, valid Let's Encrypt cert obtained by Caddy).
- **Frontend (Vercel):** live at `https://sokomtaa.co.ke` (a domain the user owns, aliased to the Vercel project `sokomtaa` under the "mastermind-creat's projects" scope). Deployment Protection (Vercel Authentication) was reported **on**; must be checked so the public can open the site.
- Optional later polish: `api.sokomtaa.co.ke` A-record → `69.169.111.234` instead of sslip.io.

### Request routing (verified)
`Browser → Caddy :443 → Nginx :80 (internal) →`
- `/api/` → `laravel` (container port 8000)
- `/ws/` → `go_gateway` (WebSocket; Upgrade headers present)
- `/go/health` (exact) → `go_gateway /health`
- `/` → `laravel`
- **No `/ai/` route exists** (FastAPI is intentionally not public)

### Docker services (compose project `soko-mtaa`, network `sokomtaa`)
`postgres`, `redis`, `laravel`, `fastapi`, `go_gateway`, `nginx`, `caddy`. All have restart policies. `docker-compose.override.yml` (auto-merged):
- adds `caddy` (ports 80/443, on network `sokomtaa`, cert data in volume `caddy_data`);
- removes published ports for postgres, redis, fastapi, nginx; binds laravel to `127.0.0.1:8000` and go_gateway to `127.0.0.1:8002`;
- sets `mem_limit` per service (caddy 64m, nginx 32m, postgres 384m, redis 96m, fastapi 384m, laravel 448m, go_gateway 64m).

**Verified:** from the laptop, ports 5432, 6379, 8000, 8001, 8002 all time out (closed). Only 22/80/443 are reachable.

### Health checks (all passing on the server)
- `GET /api/health` → `{"status":"ok","db":"ok","redis":"ok"}`
- `GET /go/health` → `{"status":"ok"}`
- FastAPI `/ai/health` (internal) → `{"status":"ok","model":"en_core_web_sm","redis":"ok"}`

---

## 3. Data state

- Migrations: all ran on PostgreSQL after a patch (see fixes). Stalls table has `location geography(Point,4326)` + GiST index `stalls_location_gist_idx`.
- Seeders run once: `MarketSeeder`, `CategorySeeder`, `AdminUserSeeder` (via `db:seed`). **Do not run plain `db:seed` again** (`MarketSeeder` isn't idempotent).
- `DemoSeeder` (custom, idempotent, run via `php artisan db:seed --class=DemoSeeder --force`) created: **4 markets** (Gikomba, Muthurwa, Kongowea + "Kibuye Market (Demo)" in Kisumu, with approximate coordinates), **6 stalls with PostGIS locations, 6 verified open traders, 15 products**, a demo buyer. Eggs, sukuma wiki and maize flour are stocked by two traders each (for the AI multi-trader comparison).
- `php artisan geo:reconcile` ran; Redis `active_traders` = **6**.
- Demo logins: buyer phone `0711000100`; traders `0711000001`..`0711000006`; admin phone `0700000001`. Passwords were generated randomly and shown once in the terminal (the default admin password `Admin@1234` from the seeder was **replaced**). The user holds them.

---

## 4. Problems fixed during deployment (so you don't repeat them)

> **IMPORTANT:** several fixes were made **on the server only**. If code is re-synced from the laptop with rsync, it will **overwrite these fixes**. Pull the server copies back to the laptop first, or apply the same edits locally.

1. **`backend/Dockerfile`**
   - `pecl install redis` failed (no autoconf): added a build-deps step using `$PHPIZE_DEPS` (works for Alpine and Debian).
   - `composer install` failed because `composer.lock` lacked `doctrine/dbal`: line now runs `composer update doctrine/dbal ... && composer require barryvdh/laravel-dompdf --update-no-dev ... && composer dump-autoload --optimize --no-dev --no-scripts` (all with `--no-scripts`). `barryvdh/laravel-dompdf` was referenced by the app but missing from `composer.json`.
   - Added `RUN mkdir -p /var/log/supervisor /var/log/nginx /run/nginx` (supervisor crash-looped without it).
   - Stale `bootstrap/cache/packages.php` and `services.php` copied from the laptop were deleted.
2. **`backend/docker/supervisord.conf`**: `numprocs` set to 1 (supervisor rejected `numprocs>1` without `%(process_num)` in `process_name`).
3. **Migration `2026_05_08_092527_add_wallet_topup_to_payments_type_enum.php`** used MySQL-only `MODIFY COLUMN ... ENUM`; rewritten to branch on driver (Postgres: drop/add CHECK constraint `payments_type_check`).
4. **`fastapi_service/app/routers/health.py`**: imported `nlp_model_ready` by value at import time, so it stayed `False` forever (503). Fixed to read `nlp_service.nlp_model_ready` through the module.
5. **`go_gateway/go.sum`** was missing; generated with `docker run golang:1.22-alpine go mod tidy` on the server.
6. **Caddy → Nginx 502:** Caddy was on a different Docker network; added `networks: [sokomtaa]` to the override.
7. **CORS** (`backend/config/cors.php`): allowed origins include `https://sokomtaa.vercel.app`, `https://sokomtaa.co.ke`, `https://www.sokomtaa.co.ke`, localhost; added pattern `#^https://sokomtaa.*\.vercel\.app$#`.
8. **Local laptop is MySQL (XAMPP); server is PostgreSQL.** Watch for other MySQL-only SQL.

---

## 5. Frontend (Vercel) details

- Env vars expected (production): `NEXT_PUBLIC_API_URL=https://69-169-111-234.sslip.io/api`, `API_URL` (same; server-side calls cannot use 127.0.0.1), `NEXT_PUBLIC_GO_GATEWAY_HTTP_URL=https://69-169-111-234.sslip.io` (the hook appends `/go/health`), `NEXT_PUBLIC_GO_GATEWAY_URL=wss://69-169-111-234.sslip.io` (the hook appends `/ws/rider?rider_id=...&token=...`), `NEXT_PUBLIC_PAYPAL_RATE=0.0077`. `NEXT_PUBLIC_AI_URL` deliberately **unset** until a public `/ai/health` route exists. `INTERNAL_API_SECRET` exists in local `.env.local` but nothing in Laravel reads it (Laravel uses `INTERNAL_API_TOKEN`); not needed in Vercel.
- **Unconfirmed:** whether those variables were actually saved in Vercel before the build (`npx vercel@latest env ls production` should list five). `NEXT_PUBLIC_*` are baked in at build time, so redeploy after changing them.
- The Vercel project once had **Root Directory = `frontend`**, which broke CLI deploys from inside `frontend/`; the deploy later succeeded.
- Use `npx vercel@latest` (the old CLI version was rejected).
- The frontend's health hook polls `/api/health`, `/go/health` (browser, cross-origin) and `/ai/health`; the last has no public route and `/go/health` sends no CORS header, so the UI may show a "degraded" banner (see open items).

---

## 6. Open items / next steps (priority order)

1. **Verify the live site end to end** from a private window: no Vercel login wall (disable Deployment Protection if present), buyer login works, Network tab shows calls to the sslip.io API returning 200 with no CORS errors, map shows the 6 demo traders.
2. **Laravel ↔ FastAPI token:** unresolved. Both services must share the same token (`INTERNAL_API_TOKEN` in root `.env`, `FASTAPI_INTERNAL_TOKEN` in `fastapi_service/.env`). Inside the Laravel container the two variables matched each other, but FastAPI's value is unverified, so the AI assistant may get 401s. Compare hashes of the value as seen **inside the fastapi and laravel containers**, never print the values.
3. **Public `/ai/health` + CORS** (stops the degraded banner): add to the Nginx config an exact-match `location = /ai/health` proxying to `fastapi:8001` with `add_header Access-Control-Allow-Origin "*" always`, and the same header on `/go/health`. Validate with `nginx -t` before swapping. Then set `NEXT_PUBLIC_AI_URL` and redeploy.
4. **Go gateway browser origin check:** grep `go_gateway` for `CheckOrigin`/allowed origins; browsers on `sokomtaa.co.ke` / `*.vercel.app` must be allowed.
5. **Rider simulation:** the gateway needs a valid JWT (`JWT_SECRET`, passed as `?token=`) and the route is `/ws/rider?rider_id=<id>&token=<jwt>`; the earlier `simulate_riders.py` has no auth and must be adapted.
6. **Cron for the Laravel scheduler** (runs `geo:reconcile` every 5 minutes): host crontab line `* * * * * cd /home/deploy/soko-mtaa && docker compose exec -T laravel php artisan schedule:run >> /dev/null 2>&1`. Not confirmed as installed.
7. **Intermittent `riders-subscribe` worker exit** (`read error on connection to tcp://redis:6379`, auto-restarted by supervisor). Fix if it recurs: `read_timeout => -1` for that Redis connection.
8. **Backups before the event:** `pg_dump` to a file copied off-server and a "Backup VPS" snapshot in the InterServer panel. Not yet done.
9. **Swap:** confirm 2 GB swap exists (`free -h`); run `docker stats --no-stream` to check memory (target ≈ 1.3-1.6 GB total).
10. **Security hygiene:** 39 Composer security advisories were reported (`composer audit`); fine for a demo, address before any real use. Rotate demo/admin passwords if the transcript is shared.
11. **M-Pesa:** use Daraja *sandbox*; callback URL must be `https://69-169-111-234.sslip.io/api/<mpesa-callback-route>`.
12. Optional: set up the new machine's SSH key, then disable password SSH login.

---

## 7. Working on this from a new machine

- Project source is *not* on the new machine unless copied. Server has the working copy at `~/soko-mtaa` (without `frontend/`, `vendor/`, `node_modules/`, `.git`).
- Connect: `ssh deploy@69.169.111.234` (password, or key after `ssh-copy-id deploy@69.169.111.234`).
- Vercel: `npx vercel@latest login`, link with `npx vercel@latest link` inside `frontend/`.
- After **any** code change on the server, rebuild the image (code is baked in): `docker compose up -d --build <service>`.

### Handy commands (run in `~/soko-mtaa`)
```bash
docker compose ps
docker compose logs <service> --tail 50
docker compose exec laravel php artisan migrate:status
docker compose exec laravel php artisan geo:reconcile
docker compose exec laravel php artisan tinker --execute="echo Illuminate\Support\Facades\Redis::zcard('active_traders');"
docker compose exec postgres psql -U sokomtaa -d sokomtaa
docker stats --no-stream
```

### Gotchas learned
- **Docker bypasses `ufw`:** never publish internal ports to `0.0.0.0`; always `127.0.0.1:` or none.
- When piping a script to `ssh ... 'bash -s' << EOF`, add `< /dev/null` to every `docker compose exec -T` (and similar) line, otherwise the first one swallows the rest of the script from stdin.
- Redis password is not an env var inside the Redis container; read it from the root `.env` or check through Laravel/tinker.
- `grep location` also matches "allocations"; use `grep -w`.
- Do not run plain `db:seed` twice.

---

## 8. Secrets: where they live (values intentionally not shown)

Root `~/soko-mtaa/.env` (`APP_KEY`, `DB_PASSWORD`, `REDIS_PASSWORD`, `JWT_SECRET`, `INTERNAL_API_TOKEN`, M-Pesa sandbox keys, `DOMAIN`), `fastapi_service/.env` (`FASTAPI_INTERNAL_TOKEN`, Redis settings), `go_gateway/.env` (reference only). Rules: `JWT_SECRET` identical for Laravel and the Go gateway; internal token identical for Laravel and FastAPI. All five core secrets were checked to be set and not the insecure compose defaults (`sokomtaa_jwt_secret`, `redis_secret`).

---

## 9. Related artifacts produced earlier in the chat
- Investor-facing system infographic (HTML, published artifact) and a high-resolution PNG export.
- `soko-mtaa-architecture-spec.md`: polyglot architecture upgrade spec.
- `soko-mtaa-fixed/` folder: corrected `DEPLOYMENT.md`, `docker-compose.override.yml`, `Caddyfile`, `.env.additions`, `DemoSeeder.php`.

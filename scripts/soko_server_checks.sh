#!/usr/bin/env bash
# =============================================================================
# soko_server_checks.sh — Pre-event server health runbook
#
# Run ON THE SERVER: ssh deploy@69.169.111.234
# Then: cd ~/soko-mtaa && bash soko_server_checks.sh
#
# What this does (in order):
#   1. Check memory/swap
#   2. Verify docker services
#   3. Test all health endpoints (with CORS check)
#   4. Verify Redis active_traders count
#   5. Check / install the Laravel scheduler cron
#   6. Verify internal token consistency (hash-only, no value printed)
#   7. Test nginx config validity
#   8. Remind about the Vercel env var checklist
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}[OK]${NC}   $*"; }
warn() { echo -e "  ${YELLOW}[WARN]${NC} $*"; }
fail() { echo -e "  ${RED}[FAIL]${NC} $*"; }
hdr()  { echo -e "\n${BOLD}==> $*${NC}"; }

# =============================================================================
hdr "1. Memory & Swap"
# =============================================================================
free -h
SWAP_TOTAL=$(free -m | awk '/^Swap:/{print $2}')
if [[ "$SWAP_TOTAL" -lt 1000 ]]; then
    warn "Swap < 1 GB ($SWAP_TOTAL MB). Recommend 2 GB swap. Create with:"
    echo "       sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile"
    echo "       sudo mkswap /swapfile && sudo swapon /swapfile"
    echo "       echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab"
else
    ok "Swap OK ($SWAP_TOTAL MB)"
fi

# =============================================================================
hdr "2. Docker service status"
# =============================================================================
docker compose ps
echo ""
UNHEALTHY=$(docker compose ps --format json 2>/dev/null \
    | python3 -c "import sys,json; data=sys.stdin.read().strip(); \
        rows=json.loads(data) if data.startswith('[') else [json.loads(l) for l in data.splitlines() if l]; \
        [print(r.get('Name','?')) for r in rows if r.get('Health','') not in ('healthy','')]" 2>/dev/null || true)
if [[ -n "$UNHEALTHY" ]]; then
    warn "Unhealthy/non-healthy services detected:"
    echo "$UNHEALTHY"
else
    ok "All services reporting healthy (or no health check)"
fi

# =============================================================================
hdr "3. Health endpoint checks"
# =============================================================================

BASE="http://localhost"   # Caddy → Nginx on :80/:443; test via Nginx directly on :80

check_endpoint() {
    local label="$1" url="$2" expected="$3"
    local response
    response=$(curl -sf --max-time 5 "$url" 2>/dev/null || echo "CURL_FAILED")
    if [[ "$response" == "CURL_FAILED" ]]; then
        fail "$label  → no response"
    elif echo "$response" | grep -q "$expected"; then
        ok "$label  → $response"
    else
        fail "$label  → unexpected: $response"
    fi
}

# Test via Caddy (port 443 with sslip.io — needs network)
PUBLIC_BASE="https://69-169-111-234.sslip.io"

check_endpoint "Laravel  /api/health"  "${PUBLIC_BASE}/api/health"  '"status":"ok"'
check_endpoint "Go       /go/health"   "${PUBLIC_BASE}/go/health"   '"status":"ok"'
check_endpoint "FastAPI  /ai/health"   "${PUBLIC_BASE}/ai/health"   '"status":"ok"'

# CORS check on /go/health
echo ""
echo -n "  CORS header on /go/health ... "
CORS=$(curl -sf --max-time 5 -H "Origin: https://sokomtaa.co.ke" -I "${PUBLIC_BASE}/go/health" \
    | grep -i "access-control-allow-origin" || true)
if [[ -n "$CORS" ]]; then
    ok "CORS present: $CORS"
else
    warn "No Access-Control-Allow-Origin on /go/health — nginx may need reload"
fi

echo -n "  CORS header on /ai/health  ... "
CORS_AI=$(curl -sf --max-time 5 -H "Origin: https://sokomtaa.co.ke" -I "${PUBLIC_BASE}/ai/health" \
    | grep -i "access-control-allow-origin" || true)
if [[ -n "$CORS_AI" ]]; then
    ok "CORS present: $CORS_AI"
else
    warn "No Access-Control-Allow-Origin on /ai/health — nginx may need reload"
fi

# =============================================================================
hdr "4. Redis active_traders count"
# =============================================================================
TRADER_COUNT=$(docker compose exec -T laravel \
    php artisan tinker --execute="echo Illuminate\Support\Facades\Redis::zcard('active_traders');" \
    2>/dev/null | tail -1 | tr -d '[:space:]')
if [[ "$TRADER_COUNT" -ge 6 ]]; then
    ok "active_traders = $TRADER_COUNT (expected 6)"
else
    warn "active_traders = $TRADER_COUNT (expected 6). Run: docker compose exec laravel php artisan geo:reconcile"
fi

# =============================================================================
hdr "5. Laravel scheduler cron"
# =============================================================================
CRON_LINE="* * * * * cd /home/deploy/soko-mtaa && docker compose exec -T laravel php artisan schedule:run >> /dev/null 2>&1"
if crontab -l 2>/dev/null | grep -q "artisan schedule:run"; then
    ok "Scheduler cron already installed"
    crontab -l | grep "schedule:run"
else
    warn "Scheduler cron NOT installed. Installing now ..."
    (crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
    ok "Cron installed: $CRON_LINE"
fi

# =============================================================================
hdr "6. Internal token consistency check (hash only — no values printed)"
# =============================================================================
echo "  Comparing INTERNAL_API_TOKEN (Laravel) vs FASTAPI_INTERNAL_TOKEN (FastAPI) ..."

LARAVEL_HASH=$(docker compose exec -T laravel \
    php -r 'echo hash("sha256", env("INTERNAL_API_TOKEN", ""));' 2>/dev/null)
FASTAPI_HASH=$(docker compose exec -T fastapi \
    python3 -c "import os,hashlib; print(hashlib.sha256(os.environ.get('FASTAPI_INTERNAL_TOKEN','').encode()).hexdigest())" \
    2>/dev/null)

if [[ "$LARAVEL_HASH" == "$FASTAPI_HASH" ]]; then
    ok "Tokens match (SHA256: ${LARAVEL_HASH:0:16}...)"
else
    fail "Token MISMATCH!"
    echo "    Laravel  SHA256: $LARAVEL_HASH"
    echo "    FastAPI  SHA256: $FASTAPI_HASH"
    echo "    Fix: ensure INTERNAL_API_TOKEN in root .env == FASTAPI_INTERNAL_TOKEN in fastapi_service/.env"
    echo "    Then: docker compose up -d --build fastapi laravel"
fi

# =============================================================================
hdr "7. Nginx config test (inside nginx container)"
# =============================================================================
docker compose exec -T nginx nginx -t 2>&1 | while read -r line; do
    if echo "$line" | grep -q "successful"; then
        ok "$line"
    elif echo "$line" | grep -qi "error"; then
        fail "$line"
    else
        echo "    $line"
    fi
done

# =============================================================================
hdr "8. Docker memory usage"
# =============================================================================
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.CPUPerc}}"

# =============================================================================
hdr "9. Vercel environment variable checklist (manual)"
# =============================================================================
echo ""
echo -e "  ${YELLOW}Run this from your laptop inside frontend/:${NC}"
echo "    npx vercel@latest env ls production"
echo ""
echo "  Required variables:"
echo "    NEXT_PUBLIC_API_URL           = https://69-169-111-234.sslip.io/api"
echo "    API_URL                       = https://69-169-111-234.sslip.io/api"
echo "    NEXT_PUBLIC_GO_GATEWAY_HTTP_URL = https://69-169-111-234.sslip.io"
echo "    NEXT_PUBLIC_GO_GATEWAY_URL    = wss://69-169-111-234.sslip.io"
echo "    NEXT_PUBLIC_PAYPAL_RATE       = 0.0077"
echo "    NEXT_PUBLIC_AI_URL            = https://69-169-111-234.sslip.io  (NEW — after nginx reload)"
echo ""
echo -e "  ${YELLOW}After setting NEXT_PUBLIC_AI_URL, redeploy:${NC}"
echo "    npx vercel@latest --prod"
echo ""
echo -e "  ${YELLOW}Also verify Deployment Protection is OFF in Vercel Dashboard:${NC}"
echo "    Settings → Deployment Protection → disable (or set to Vercel Auth only for your team)"

echo ""
echo -e "${BOLD}==> All checks complete.${NC}"

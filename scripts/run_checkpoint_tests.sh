#!/usr/bin/env bash
# Final checkpoint test runner — writes all output to scripts/test_results.txt

RESULTS="scripts/test_results.txt"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== LARAVEL POLYGLOT TESTS ===" > "$RESULTS"
php "$ROOT/backend/vendor/phpunit/phpunit/phpunit" \
    --configuration "$ROOT/backend/phpunit.xml" \
    "$ROOT/backend/tests/Unit/Polyglot" \
    "$ROOT/backend/tests/Feature/Polyglot" \
    --no-coverage 2>&1 >> "$RESULTS" || true
echo "LARAVEL_EXIT:$?" >> "$RESULTS"

echo "" >> "$RESULTS"
echo "=== FASTAPI TESTS ===" >> "$RESULTS"
(cd "$ROOT/fastapi_service" && python3 -m pytest tests/ -v --tb=short 2>&1) >> "$RESULTS" || true
echo "FASTAPI_EXIT:$?" >> "$RESULTS"

echo "" >> "$RESULTS"
echo "=== GO GATEWAY TESTS ===" >> "$RESULTS"
(cd "$ROOT/go_gateway" && go test ./... -v 2>&1) >> "$RESULTS" || true
echo "GO_EXIT:$?" >> "$RESULTS"

echo "" >> "$RESULTS"
echo "=== FRONTEND VITEST ===" >> "$RESULTS"
(cd "$ROOT/frontend" && npx vitest run 2>&1) >> "$RESULTS" || true
echo "FRONTEND_EXIT:$?" >> "$RESULTS"

echo "ALL_DONE" >> "$RESULTS"

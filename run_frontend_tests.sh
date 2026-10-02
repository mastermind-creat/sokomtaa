#!/bin/bash
# Run frontend tests (vitest --run) and write results
cd frontend
npx vitest run --reporter=verbose 2>&1 > ../test_results_frontend.txt
echo "FRONTEND_EXIT_CODE:$?" >> ../test_results_frontend.txt

#!/bin/bash
# Script to run all test suites and write results to workspace files

# Laravel Polyglot tests
echo "=== RUNNING LARAVEL POLYGLOT TESTS ===" > test_results_laravel.txt
cd backend && php vendor/phpunit/phpunit/phpunit \
    tests/Feature/Polyglot \
    tests/Unit/Polyglot \
    --no-coverage \
    --testdox \
    2>&1 >> ../test_results_laravel.txt
echo "EXIT:$?" >> ../test_results_laravel.txt
cd ..

echo "Done"

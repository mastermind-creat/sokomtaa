#!/bin/bash
# Run Laravel Polyglot tests and write results
cd backend
php vendor/phpunit/phpunit/phpunit \
    tests/Feature/Polyglot \
    tests/Unit/Polyglot \
    --no-coverage \
    --testdox \
    2>&1 > ../test_results_laravel.txt
echo "LARAVEL_EXIT_CODE:$?" >> ../test_results_laravel.txt

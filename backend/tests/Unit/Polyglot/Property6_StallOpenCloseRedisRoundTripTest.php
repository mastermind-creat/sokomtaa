<?php

// Feature: polyglot-architecture-upgrade, Property 6: Stall Open/Close Redis Round-Trip
// Validates: Requirements 3.2
//
// Opening then immediately closing a stall must result in the stall's ID being absent
// from active_traders — regardless of order or stall ID.

use App\Services\GeoService;
use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    Redis::flushdb();
});

it('removes stall ID from active_traders after open-then-close sequence across 80 randomized cases', function (
    int $stallId,
    float $lon,
    float $lat,
) {
    $geoService = new GeoService;

    // Step 1: Open — stall must appear
    $geoService->addTraderToGeo($stallId, $lon, $lat);
    expect(Redis::zrange(GeoService::ACTIVE_TRADERS, 0, -1))->toContain(
        (string) $stallId,
        "Stall {$stallId} must be in active_traders after open"
    );

    // Step 2: Close — stall must be absent
    $geoService->removeTraderFromGeo($stallId);
    expect(Redis::zrange(GeoService::ACTIVE_TRADERS, 0, -1))->not->toContain(
        (string) $stallId,
        "Stall {$stallId} must be absent from active_traders after close"
    );
})->with(function () {
    $cases = [];
    for ($i = 0; $i < 80; $i++) {
        $cases[] = [
            rand(1, 9999),
            round(34.0 + (mt_rand() / mt_getrandmax()) * 1.5, 7),
            round(-0.5  + (mt_rand() / mt_getrandmax()) * 1.0, 7),
        ];
    }
    return $cases;
});

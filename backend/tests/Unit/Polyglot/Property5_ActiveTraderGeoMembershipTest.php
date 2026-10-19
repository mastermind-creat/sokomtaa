<?php

// Feature: polyglot-architecture-upgrade, Property 5: Active Trader GEO Membership
// Validates: Requirements 3.1
//
// For any stall marked is_open = true, after the open event is processed the stall's ID
// must be a member of active_traders Redis GEO set.

use App\Services\GeoService;
use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    Redis::flushdb();
});

it('ensures every opened stall ID becomes a member of active_traders across 80 randomized stall IDs and coordinates', function (
    int $stallId,
    float $lon,
    float $lat,
) {
    $geoService = new GeoService;

    // Simulate the open event: add trader to GEO
    $geoService->addTraderToGeo($stallId, $lon, $lat);

    // The stall ID must be present in active_traders
    $members = Redis::zrange(GeoService::ACTIVE_TRADERS, 0, -1);

    expect($members)->toContain(
        (string) $stallId,
        "Stall ID {$stallId} must be a member of active_traders after open event (lon={$lon}, lat={$lat})"
    );
})->with(function () {
    $cases = [];
    for ($i = 0; $i < 80; $i++) {
        $stallId = rand(1, 9999);
        $lon     = round(33.9 + (mt_rand() / mt_getrandmax()) * 8.0, 7);  // Kenya approx range
        $lat     = round(-4.7  + (mt_rand() / mt_getrandmax()) * 9.3, 7);
        $cases[] = [$stallId, $lon, $lat];
    }
    return $cases;
});

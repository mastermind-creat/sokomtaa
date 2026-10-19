<?php

// Feature: polyglot-architecture-upgrade, Property 9: Rider Disconnect Cleans GEO State
// Validates: Requirements 3.5, 3.6
//
// After the rider.disconnected Pub/Sub event payload is processed by SubscribeRiderEvents,
// the rider's ID must not be present in active_riders.

use App\Services\GeoService;
use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    Redis::flushdb();
});

it('removes rider from active_riders when rider.disconnected event is processed across 80 randomized rider IDs', function (
    string $riderId,
    float  $lon,
    float  $lat,
) {
    $geoService = new GeoService;

    // Precondition: rider is in active_riders (simulating an active WebSocket session)
    Redis::geoadd(GeoService::ACTIVE_RIDERS, $lon, $lat, $riderId);
    expect(Redis::zrange(GeoService::ACTIVE_RIDERS, 0, -1))->toContain(
        $riderId,
        "Precondition: rider must be in active_riders before disconnect"
    );

    // Simulate SubscribeRiderEvents processing rider.disconnected event
    $payload = json_encode(['event' => 'rider.disconnected', 'rider_id' => $riderId]);
    $decoded = json_decode($payload, true);

    if (is_array($decoded) && ($decoded['event'] ?? '') === 'rider.disconnected') {
        $rId = (string) ($decoded['rider_id'] ?? '');
        if ($rId !== '') {
            $geoService->removeRiderFromGeo($rId);
        }
    }

    // Invariant: rider must be absent from active_riders after disconnect
    expect(Redis::zrange(GeoService::ACTIVE_RIDERS, 0, -1))->not->toContain(
        $riderId,
        "Rider {$riderId} must not be in active_riders after rider.disconnected event"
    );
})->with(function () {
    $cases = [];
    for ($i = 0; $i < 80; $i++) {
        $riderId = 'rider-'.rand(1, 99999);
        $lon     = round(34.0 + (mt_rand() / mt_getrandmax()) * 2.0, 7);
        $lat     = round(-0.5  + (mt_rand() / mt_getrandmax()) * 1.0, 7);
        $cases[] = [$riderId, $lon, $lat];
    }
    return $cases;
});

it('is a no-op when rider is not in active_riders and rider.disconnected is received', function (string $riderId) {
    $geoService = new GeoService;

    // Rider is not in active_riders
    expect(Redis::zrange(GeoService::ACTIVE_RIDERS, 0, -1))->not->toContain($riderId);

    // Processing disconnect for an unknown rider must not throw and must leave state clean
    $geoService->removeRiderFromGeo($riderId);

    expect(Redis::zrange(GeoService::ACTIVE_RIDERS, 0, -1))->not->toContain(
        $riderId,
        "Removing an absent rider must leave active_riders clean"
    );
})->with(function () {
    $cases = [];
    for ($i = 0; $i < 20; $i++) {
        $cases[] = ['rider-nonexistent-'.rand(100000, 999999)];
    }
    return $cases;
});

<?php

// Feature: polyglot-architecture-upgrade, Property 3: Viewport Bbox Containment
// Validates: Requirements 2.2
//
// For any valid bbox, every stall returned by GeoService::stallsWithinViewport() must have
// its lat/lon geometrically within the envelope (minLon ≤ lon ≤ maxLon, minLat ≤ lat ≤ maxLat).

use App\Models\Market;
use App\Models\Stall;
use App\Services\GeoService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;

uses(RefreshDatabase::class);

beforeEach(function () {
    Redis::flushdb();
});

it('returns only stalls whose lon/lat fall within the requested bbox across 50 randomized queries', function (
    float $minLon,
    float $minLat,
    float $maxLon,
    float $maxLat,
    array $stallCoords,
) {
    $market = Market::create([
        'name'      => 'BBox Test Market',
        'location'  => 'Test',
        'county'    => 'Kisumu',
        'estate'    => 'Kolenyo',
        'is_active' => true,
    ]);

    foreach ($stallCoords as $idx => $coord) {
        Stall::create([
            'market_id'    => $market->id,
            'stall_number' => 'S'.$idx,
            'zone'         => 'A',
            'status'       => 'occupied',
            'monthly_fee'  => 1000,
            'location'     => json_encode(['lat' => $coord['lat'], 'lon' => $coord['lon']]),
        ]);
    }

    $geoService = new GeoService;
    $results    = $geoService->stallsWithinViewport($minLon, $minLat, $maxLon, $maxLat);

    foreach ($results as $stall) {
        $lon = $stall['lon'] ?? null;
        $lat = $stall['lat'] ?? null;

        if ($lon === null || $lat === null) {
            continue; // Stall has no coordinates — acceptable (not returned by PostGIS path)
        }

        expect($lon)->toBeGreaterThanOrEqual($minLon, "lon {$lon} is below minLon {$minLon}");
        expect($lon)->toBeLessThanOrEqual($maxLon,    "lon {$lon} is above maxLon {$maxLon}");
        expect($lat)->toBeGreaterThanOrEqual($minLat, "lat {$lat} is below minLat {$minLat}");
        expect($lat)->toBeLessThanOrEqual($maxLat,    "lat {$lat} is above maxLat {$maxLat}");
    }
})->with(function () {
    $cases = [];
    for ($i = 0; $i < 50; $i++) {
        $minLon = round(34.0 + (mt_rand() / mt_getrandmax()) * 1.0, 4);
        $minLat = round(-0.5  + (mt_rand() / mt_getrandmax()) * 0.5, 4);
        $maxLon = round($minLon + 0.1 + (mt_rand() / mt_getrandmax()) * 0.5, 4);
        $maxLat = round($minLat + 0.1 + (mt_rand() / mt_getrandmax()) * 0.5, 4);

        // Generate 3–8 stalls, some inside, some outside the bbox
        $count  = rand(3, 8);
        $coords = [];
        for ($j = 0; $j < $count; $j++) {
            if ($j % 3 === 0) {
                // Outside the bbox
                $coords[] = ['lon' => $maxLon + 1.0, 'lat' => $maxLat + 1.0];
            } else {
                // Inside the bbox
                $coords[] = [
                    'lon' => round($minLon + (mt_rand() / mt_getrandmax()) * ($maxLon - $minLon), 7),
                    'lat' => round($minLat + (mt_rand() / mt_getrandmax()) * ($maxLat - $minLat), 7),
                ];
            }
        }

        $cases[] = [$minLon, $minLat, $maxLon, $maxLat, $coords];
    }
    return $cases;
});

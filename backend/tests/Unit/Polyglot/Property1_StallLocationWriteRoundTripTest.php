<?php

// Feature: polyglot-architecture-upgrade, Property 1: Stall Location Write Round-Trip
// Validates: Requirements 1.5
//
// For any valid WGS-84 lon/lat pair stored in the stall location column (as JSON for SQLite
// test fallback), reading back lat/lon must return values within float epsilon.

use App\Models\Market;
use App\Models\Stall;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('reads back lat/lon within float epsilon after writing location across 100 randomized WGS-84 pairs', function (float $lon, float $lat) {
    $market = Market::create([
        'name'      => 'Round-Trip Market',
        'location'  => 'Test',
        'county'    => 'Kisumu',
        'estate'    => 'Kolenyo',
        'is_active' => true,
    ]);

    $stall = Stall::create([
        'market_id'    => $market->id,
        'stall_number' => 'RT1',
        'zone'         => 'A',
        'status'       => 'available',
        'monthly_fee'  => 1000,
        // Stored as JSON for SQLite test environment; PostGIS path tested via migration
        'location'     => json_encode(['lat' => $lat, 'lon' => $lon]),
    ]);

    $fresh = Stall::find($stall->id);

    expect($fresh->lat)->not->toBeNull('lat must not be null after write');
    expect($fresh->lon)->not->toBeNull('lon must not be null after write');

    // Assert values are within float epsilon (1e-6 degrees ≈ 0.1 m)
    expect(abs($fresh->lat - $lat))->toBeLessThanOrEqual(1e-6, "lat round-trip error exceeds epsilon for lat={$lat}");
    expect(abs($fresh->lon - $lon))->toBeLessThanOrEqual(1e-6, "lon round-trip error exceeds epsilon for lon={$lon}");
})->with(function () {
    $cases = [];
    // Kenyan market region: lon 33.9–42.0, lat -4.7–4.6
    // Plus a wider WGS-84 sweep to exercise boundary conditions
    for ($i = 0; $i < 100; $i++) {
        $lon = -180.0 + (mt_rand() / mt_getrandmax()) * 360.0;
        $lat = -90.0  + (mt_rand() / mt_getrandmax()) * 180.0;
        // Round to 7 decimal places (GPS precision)
        $cases[] = [round($lon, 7), round($lat, 7)];
    }
    return $cases;
});

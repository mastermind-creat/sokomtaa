<?php

// Feature: polyglot-architecture-upgrade, Property 4: Maintenance Stall Exclusion
// Validates: Requirements 2.4
//
// For any valid bbox query over any stall distribution, no stall with status = 'maintenance'
// should appear in results regardless of how many maintenance or non-maintenance stalls exist.

use App\Models\Market;
use App\Models\Stall;
use App\Services\GeoService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;

uses(RefreshDatabase::class);

beforeEach(function () {
    Redis::flushdb();
});

it('never returns maintenance stalls for any distribution of stall statuses across 60 randomized cases', function (
    int $maintenanceCount,
    int $availableCount,
    int $occupiedCount,
) {
    $market = Market::create([
        'name'      => 'Exclusion Test Market',
        'location'  => 'Test',
        'county'    => 'Kisumu',
        'estate'    => 'Kolenyo',
        'is_active' => true,
    ]);

    $idx = 0;

    // Seed maintenance stalls within bbox
    for ($i = 0; $i < $maintenanceCount; $i++) {
        Stall::create([
            'market_id'    => $market->id,
            'stall_number' => 'M'.$idx++,
            'zone'         => 'A',
            'status'       => 'maintenance',
            'monthly_fee'  => 1000,
            'location'     => json_encode(['lat' => -0.0917, 'lon' => 34.7679]),
        ]);
    }

    // Seed available stalls within bbox
    for ($i = 0; $i < $availableCount; $i++) {
        Stall::create([
            'market_id'    => $market->id,
            'stall_number' => 'A'.$idx++,
            'zone'         => 'B',
            'status'       => 'available',
            'monthly_fee'  => 1000,
            'location'     => json_encode(['lat' => -0.0918, 'lon' => 34.7680]),
        ]);
    }

    // Seed occupied stalls within bbox
    for ($i = 0; $i < $occupiedCount; $i++) {
        Stall::create([
            'market_id'    => $market->id,
            'stall_number' => 'O'.$idx++,
            'zone'         => 'C',
            'status'       => 'occupied',
            'monthly_fee'  => 1000,
            'location'     => json_encode(['lat' => -0.0919, 'lon' => 34.7681]),
        ]);
    }

    $geoService = new GeoService;
    $results    = $geoService->stallsWithinViewport(34.7, -0.2, 34.9, 0.1);

    $statuses = collect($results)->pluck('status')->all();

    expect($statuses)->not->toContain(
        'maintenance',
        "Maintenance stalls must never appear in results (maintenance={$maintenanceCount}, available={$availableCount}, occupied={$occupiedCount})"
    );
})->with(function () {
    $cases = [];
    for ($i = 0; $i < 60; $i++) {
        $cases[] = [
            rand(0, 5),   // maintenance stalls
            rand(0, 5),   // available stalls
            rand(0, 5),   // occupied stalls
        ];
    }
    return $cases;
});

<?php

// Feature: polyglot-architecture-upgrade, Property 20: Delivery Fee Proportional to Max Trader Distance
// Validates: Requirements 9.2

use App\Services\DeliveryFeeCalculator;
use App\Services\StallLocationConverter;

it('returns 0.0 when trader positions array is empty', function () {
    $calculator = new DeliveryFeeCalculator();
    expect($calculator->calculate(-0.0917, 34.7679, []))->toBe(0.0);
});

it('returns BASE_FEE when trader is at the exact same location as resident', function () {
    $calculator = new DeliveryFeeCalculator();
    $fee = $calculator->calculate(-0.0917, 34.7679, [
        ['lat' => -0.0917, 'lon' => 34.7679],
    ]);
    expect($fee)->toBe(DeliveryFeeCalculator::BASE_FEE);
});

it('ensures delivery fee is monotonically non-decreasing as max trader distance increases across 100 randomized cases', function (float $resLat, float $resLon, array $traders) {
    $calculator = new DeliveryFeeCalculator();

    $initialFee = $calculator->calculate($resLat, $resLon, $traders);

    // Compute current max distance
    $currentMaxKm = 0.0;
    foreach ($traders as $t) {
        $km = StallLocationConverter::haversineKm($resLat, $resLon, (float) $t['lat'], (float) $t['lon']);
        $currentMaxKm = max($currentMaxKm, $km);
    }

    // Add a trader that is guaranteed strictly farther away
    $extraOffset = (rand(10, 100) / 1000.0) + 0.01; // ~1-10km further
    $fartherTrader = [
        'lat' => $resLat + ($currentMaxKm + $extraOffset) / 111.0,
        'lon' => $resLon,
    ];

    $newTraders = array_merge($traders, [$fartherTrader]);
    $newFee = $calculator->calculate($resLat, $resLon, $newTraders);

    // Property 20: strictly farther trader must never produce a lower delivery fee
    expect($newFee)->toBeGreaterThanOrEqual($initialFee);
})->with(function () {
    $cases = [];
    for ($i = 0; $i < 100; $i++) {
        $resLat = -0.0917 + (rand(-100, 100) / 1000.0);
        $resLon = 34.7679 + (rand(-100, 100) / 1000.0);

        $traderCount = rand(1, 10);
        $traders = [];
        for ($t = 0; $t < $traderCount; $t++) {
            $traders[] = [
                'lat' => $resLat + (rand(-50, 50) / 1000.0),
                'lon' => $resLon + (rand(-50, 50) / 1000.0),
            ];
        }

        $cases[] = [$resLat, $resLon, $traders];
    }
    return $cases;
});

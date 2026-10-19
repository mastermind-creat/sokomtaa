<?php

// Feature: polyglot-architecture-upgrade, Property 2 & Property 28: Migration Completeness and Idempotence
// Validates: Requirements 1.6, 15.1, 15.5

use App\Services\StallLocationConverter;

it('returns null when either map_x or map_y is null or empty', function ($mapX, $mapY) {
    expect(StallLocationConverter::fromPixels($mapX, $mapY))->toBeNull();
})->with([
    [null, 100],
    [100, null],
    [null, null],
    ['', 50],
    [50, ''],
]);

it('completes conversion to valid WGS-84 coordinates for any valid non-null map_x and map_y across 100 randomized cases', function (float $mapX, float $mapY) {
    $coords = StallLocationConverter::fromPixels($mapX, $mapY);

    expect($coords)->not->toBeNull();
    expect($coords)->toHaveKeys(['lat', 'lon']);

    // Validates WGS-84 coordinate bounds
    expect($coords['lat'])->toBeGreaterThanOrEqual(-90.0)->toBeLessThanOrEqual(90.0);
    expect($coords['lon'])->toBeGreaterThanOrEqual(-180.0)->toBeLessThanOrEqual(180.0);

    // Derived from Kolenyo Market reference
    $expectedLon = StallLocationConverter::MARKET_LON + ($mapX * StallLocationConverter::PIXEL_SCALE);
    $expectedLat = StallLocationConverter::MARKET_LAT - ($mapY * StallLocationConverter::PIXEL_SCALE);

    expect($coords['lon'])->toBe($expectedLon);
    expect($coords['lat'])->toBe($expectedLat);
})->with(function () {
    $cases = [];
    for ($i = 0; $i < 100; $i++) {
        $cases[] = [
            (float) rand(0, 1000), // map_x
            (float) rand(0, 1000), // map_y
        ];
    }
    return $cases;
});

it('guarantees conversion idempotence: re-converting pixel coordinates produces identical results across 100 randomized cases', function (float $mapX, float $mapY) {
    $firstRun  = StallLocationConverter::fromPixels($mapX, $mapY);
    $secondRun = StallLocationConverter::fromPixels($mapX, $mapY);

    expect($firstRun)->toEqual($secondRun);
})->with(function () {
    $cases = [];
    for ($i = 0; $i < 100; $i++) {
        $cases[] = [
            (float) rand(0, 500),
            (float) rand(0, 500),
        ];
    }
    return $cases;
});

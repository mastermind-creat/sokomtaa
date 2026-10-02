<?php

namespace App\Services;

class StallLocationConverter
{
    public const MARKET_LAT = -0.0917;

    public const MARKET_LON = 34.7679;

    public const PIXEL_SCALE = 0.00005;

    /**
     * Convert Kolenyo Market canvas pixel offsets to WGS-84 coordinates.
     *
     * @return array{lat: float, lon: float}|null
     */
    public static function fromPixels(mixed $mapX, mixed $mapY): ?array
    {
        if ($mapX === null || $mapY === null || $mapX === '' || $mapY === '') {
            return null;
        }

        $x = (float) $mapX;
        $y = (float) $mapY;

        return [
            'lon' => self::MARKET_LON + ($x * self::PIXEL_SCALE),
            'lat' => self::MARKET_LAT - ($y * self::PIXEL_SCALE),
        ];
    }

    public static function haversineKm(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthKm = 6371.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;

        return $earthKm * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}

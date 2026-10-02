<?php

namespace App\Services;

class DeliveryFeeCalculator
{
    public const BASE_FEE = 50.0;

    public const PER_KM = 20.0;

    /**
     * Fee is monotonically non-decreasing with the furthest stall distance.
     */
    public function calculate(float $residentLat, float $residentLon, array $traderPositions): float
    {
        if ($traderPositions === []) {
            return 0.0;
        }

        $maxKm = 0.0;
        foreach ($traderPositions as $position) {
            $km = StallLocationConverter::haversineKm(
                $residentLat,
                $residentLon,
                (float) $position['lat'],
                (float) $position['lon'],
            );
            $maxKm = max($maxKm, $km);
        }

        return round(self::BASE_FEE + (ceil($maxKm * 10) / 10) * self::PER_KM, 2);
    }
}

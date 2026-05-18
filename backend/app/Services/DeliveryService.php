<?php

namespace App\Services;

use App\Models\Reservation;
use App\Models\DeliveryProfile;
use App\Models\DeliveryTransaction;
use Illuminate\Support\Facades\DB;
use Exception;

class DeliveryService
{
    /**
     * Calculate physical distance between two lat/lng coordinates (Haversine Formula)
     */
    public function calculateDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371; // Earth radius in kilometres

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return round($earthRadius * $c, 2);
    }

    /**
     * Calculate dynamic delivery fee:
     * - Base fare: 100 KES (covers up to 3 km)
     * - Per-km fare: 30 KES for every km thereafter
     */
    public function calculateDeliveryFee(float $distanceKm): float
    {
        if ($distanceKm <= 3.0) {
            return 100.00;
        }

        $extraKm = $distanceKm - 3.0;
        $extraFee = $extraKm * 30.00;

        return round(100.00 + $extraFee, 2);
    }

    /**
     * Processes the payout: splits delivery fee 50/50 between rider and platform
     */
    public function executeDeliveryPayout(Reservation $reservation): void
    {
        if ($reservation->delivery_status !== 'in_transit' && $reservation->delivery_status !== 'assigned') {
            throw new Exception("Delivery must be in transit or assigned to be completed.");
        }

        if (!$reservation->delivery_rider_id) {
            throw new Exception("No rider has been assigned to this delivery.");
        }

        $riderProfile = DeliveryProfile::where('user_id', $reservation->delivery_rider_id)->first();
        if (!$riderProfile) {
            throw new Exception("Assigned rider does not have a delivery profile.");
        }

        DB::transaction(function () use ($reservation, $riderProfile) {
            $deliveryFee = $reservation->delivery_fee;
            
            // 50/50 Revenue Split
            $riderShare = round($deliveryFee * 0.50, 2);
            $platformCommission = round($deliveryFee * 0.50, 2);

            // 1. Log Delivery Transaction
            DeliveryTransaction::create([
                'user_id' => $reservation->delivery_rider_id,
                'reservation_id' => $reservation->id,
                'amount' => $riderShare,
                'platform_commission' => $platformCommission,
                'type' => 'credit',
            ]);

            // 2. Increment Rider's earnings balance
            $riderProfile->increment('earnings_balance', $riderShare);

            // 3. Mark delivery as successfully completed
            $reservation->update([
                'delivery_status' => 'delivered',
                'status' => 'completed',
                'picked_up_at' => now(),
            ]);
        });
    }
}

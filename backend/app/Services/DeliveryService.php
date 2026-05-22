<?php

namespace App\Services;

use App\Models\Reservation;
use App\Models\DeliveryProfile;
use App\Models\DeliveryTransaction;
use App\Models\SystemSetting;
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
     * - Base fare: KES 100 (covers up to 3 km), +KES 30/km beyond that
     * - Proportional cap: fee cannot exceed 25% of the order value (min KES 10)
     *   This prevents small orders (e.g. KES 20) from being charged an outsized fee.
     *
     * @param float $distanceKm  Haversine distance from market to delivery point
     * @param float $orderSubtotal  Cart total excluding fees — used for proportional capping
     */
    public function calculateDeliveryFee(float $distanceKm, float $orderSubtotal = 0.0): float
    {
        // Raw distance-based fee
        $rawFee = $distanceKm <= 3.0
            ? 100.00
            : round(100.00 + ($distanceKm - 3.0) * 30.00, 2);

        // Proportional cap: never exceed 25% of order value (minimum KES 10)
        if ($orderSubtotal > 0) {
            $proportionalCap = max(10.0, round($orderSubtotal * 0.25, 2));
            return round(min($rawFee, $proportionalCap), 2);
        }

        return round($rawFee, 2);
    }

    /**
     * Calculates the payout split between the rider and the platform.
     *
     * Reads 'rider_payout_percentage' — the value the admin explicitly sets
     * in the Fiscal Policies tab (e.g. 80 → rider keeps 80 % of the delivery
     * fee; the platform retains the remaining 20 %).
     *
     * NOTE: 'delivery_rider_fee_percentage' is the *platform's* commission,
     * auto-computed by the admin UI as (100 - rider_payout_percentage). It is
     * stored for accounting purposes but must NOT be used here as the rider share.
     *
     * @return array{riderShare: float, platformCommission: float}
     */
    public function calculatePayouts(float $deliveryFee): array
    {
        // Read the rider's share percentage (e.g. 80 → rider gets 80 %)
        $riderPercentage = (float) \App\Models\SystemSetting::get('rider_payout_percentage', 80.0);

        // Clamp to [0, 100] to guard against accidental bad data
        $riderPercentage = max(0.0, min(100.0, $riderPercentage));

        $riderShare         = round(($deliveryFee * $riderPercentage) / 100.0, 2);
        $platformCommission = round($deliveryFee - $riderShare, 2);

        return [
            'riderShare'         => $riderShare,
            'platformCommission' => $platformCommission,
        ];
    }

    /**
     * Processes the payout: splits delivery fee using recorded fees or current settings
     */
    public function executeDeliveryPayout(Reservation $reservation): void
    {
        if ($reservation->delivery_status !== 'in_transit' && $reservation->delivery_status !== 'assigned' && $reservation->delivery_status !== 'picked_up') {
            throw new Exception("Delivery must be in transit, picked up, or assigned to be completed.");
        }

        if (!$reservation->delivery_rider_id) {
            throw new Exception("No rider has been assigned to this delivery.");
        }

        $riderProfile = DeliveryProfile::where('user_id', $reservation->delivery_rider_id)->first();
        if (!$riderProfile) {
            throw new Exception("Assigned rider does not have a delivery profile.");
        }

        DB::transaction(function () use ($reservation, $riderProfile) {
            // Use recorded fees if available, otherwise fallback to recalculation
            if ($reservation->rider_fee > 0 || $reservation->system_delivery_fee > 0) {
                $riderShare = (float) $reservation->rider_fee;
                $platformCommission = (float) $reservation->system_delivery_fee;
            } else {
                $payouts = $this->calculatePayouts((float) $reservation->delivery_fee);
                $riderShare = $payouts['riderShare'];
                $platformCommission = $payouts['platformCommission'];
            }

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

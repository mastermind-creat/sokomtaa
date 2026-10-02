<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Market;
use App\Models\Trader;
use Illuminate\Http\JsonResponse;

class MapController extends Controller
{
    /**
     * Discover markets and independent traders within a bounding box.
     */
    public function discover(Request $request): JsonResponse
    {
        $n = $request->query('n');
        $s = $request->query('s');
        $e = $request->query('e');
        $w = $request->query('w');

        // Markets: Must be active and have coordinates
        $marketsQuery = Market::where('is_active', true)
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->withCount(['stalls as active_stalls_count' => function($q) {
                $q->where('status', 'occupied');
            }]);

        // Independent Traders: user active, independent stall_type, have coords
        $tradersQuery = Trader::whereHas('user', function($q) {
                $q->where('is_active', true);
            })
            ->where('stall_type', 'independent')
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->withCount('products');

        if ($n && $s && $e && $w) {
            $marketsQuery->whereBetween('latitude', [$s, $n])
                         ->whereBetween('longitude', [$w, $e]);
                         
            $tradersQuery->whereBetween('latitude', [$s, $n])
                         ->whereBetween('longitude', [$w, $e]);
        }

        // Limit results to avoid massive payloads
        $markets = $marketsQuery->limit(50)->get();
        $traders = $tradersQuery->limit(100)->get();
        
        $fallbackLocation = null;
        // Always provide the fallback location on the first load if needed
        if ($request->query('needs_fallback') === 'true') {
             $fallbackMarket = Market::where('is_active', true)
                 ->whereNotNull('latitude')
                 ->first();
             if ($fallbackMarket) {
                 $fallbackLocation = [
                     'latitude' => $fallbackMarket->latitude,
                     'longitude' => $fallbackMarket->longitude,
                 ];
             } else {
                 // Nairobi CBD
                 $fallbackLocation = [
                     'latitude' => -1.286389,
                     'longitude' => 36.817223,
                 ];
             }
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'markets' => $markets,
                'traders' => $traders,
                'fallback_location' => $fallbackLocation
            ]
        ]);
    }

    /**
     * Find markets and independent traders within a radius of a given location.
     * Uses the Haversine formula to calculate great-circle distances.
     *
     * @param  \Illuminate\Http\Request  $request
     *   - lat    float  Latitude of the user's location (required)
     *   - lng    float  Longitude of the user's location (required)
     *   - radius float  Search radius in kilometres (default: 50, max: 200)
     */
    public function nearby(Request $request): JsonResponse
    {
        $request->validate([
            'lat'    => 'required|numeric|between:-90,90',
            'lng'    => 'required|numeric|between:-180,180',
            'radius' => 'nullable|numeric|min:1|max:200',
        ]);

        $lat    = (float) $request->lat;
        $lng    = (float) $request->lng;
        $radius = (float) ($request->radius ?? 50);

        // Haversine raw SQL snippet (reusable)
        $haversine = "(
            6371 * acos(
                cos( radians(?) )
                * cos( radians( latitude ) )
                * cos( radians( longitude ) - radians(?) )
                + sin( radians(?) ) * sin( radians( latitude ) )
            )
        )";

        // ── Markets ──────────────────────────────────────────────────────────
        $markets = Market::where('is_active', true)
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->selectRaw(
                "markets.*, ROUND({$haversine}, 2) AS distance_km",
                [$lat, $lng, $lat]
            )
            ->withCount(['stalls as active_stalls_count' => function ($q) {
                $q->where('status', 'occupied');
            }])
            ->having('distance_km', '<=', $radius)
            ->orderBy('distance_km')
            ->limit(50)
            ->get();

        // ── Independent Traders ───────────────────────────────────────────────
        $traders = Trader::whereHas('user', function ($q) {
                $q->where('is_active', true);
            })
            ->where('stall_type', 'independent')
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->selectRaw(
                "traders.*, ROUND({$haversine}, 2) AS distance_km",
                [$lat, $lng, $lat]
            )
            ->withCount('products')
            ->having('distance_km', '<=', $radius)
            ->orderBy('distance_km')
            ->limit(100)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'markets'       => $markets,
                'traders'       => $traders,
                'user_location' => ['latitude' => $lat, 'longitude' => $lng],
                'radius_km'     => $radius,
                'total'         => $markets->count() + $traders->count(),
            ]
        ]);
    }
}

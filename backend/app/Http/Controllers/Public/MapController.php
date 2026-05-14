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
}

<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\Trader;
use App\Models\Product;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TraderController extends Controller
{
    use ApiResponse;

    /**
     * Display a trader's public storefront.
     */
    public function show(Trader $trader): JsonResponse
    {
        // Show all traders (removed verification check as per request)

        $trader->load(['stall', 'market']);

        // Get trader's active products
        $products = Product::where('trader_id', $trader->id)
            ->where('is_active', true)
            ->with('category')
            ->latest()
            ->paginate(12);

        return $this->success([
            'trader' => $trader,
            'products' => $products
        ]);
    }

    /**
     * Search for traders / discovery.
     * Supports distance-based biasing if lat/lng are provided.
     */
    public function search(Request $request): JsonResponse
    {
        $query      = $request->input('q');
        $categoryId = $request->input('category_id');
        $marketId   = $request->input('market_id');
        $lat        = $request->filled('lat')    ? (float) $request->lat    : null;
        $lng        = $request->filled('lng')    ? (float) $request->lng    : null;
        $radius     = $request->filled('radius') ? (float) $request->radius : 5.0;

        $tradersQuery = Trader::query()
            ->when($query, function ($q) use ($query) {
                $q->where('business_name', 'like', "%{$query}%")
                  ->orWhere('business_name_sw', 'like', "%{$query}%");
            })
            ->when($marketId, function ($q) use ($marketId) {
                $q->where('market_id', $marketId);
            })
            ->when($categoryId, function ($q) use ($categoryId) {
                $q->whereHas('products', function ($p) use ($categoryId) {
                    $p->where('category_id', $categoryId);
                });
            });

        // Distance filtering logic
        if ($lat !== null && $lng !== null) {
            $tradersQuery->selectRaw(
                "*, ROUND(( 6371 * acos( cos( radians(?) ) * cos( radians( COALESCE(traders.latitude, markets.latitude) ) ) * cos( radians( COALESCE(traders.longitude, markets.longitude) ) - radians(?) ) + sin( radians(?) ) * sin( radians( COALESCE(traders.latitude, markets.latitude) ) ) ) ), 2) AS distance_km",
                [$lat, $lng, $lat]
            )
            ->join('markets', 'traders.market_id', '=', 'markets.id')
            ->having('distance_km', '<=', $radius)
            ->orderBy('distance_km');
        }

        $traders = $tradersQuery->with(['market', 'stall'])
            ->paginate(15);

        return $this->success($traders);
    }

    /**
     * Find traders near a specific location (independent stalls).
     */
    public function nearby(Request $request): JsonResponse
    {
        $request->validate([
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
            'radius' => 'nullable|numeric|min:1|max:100' // km
        ]);

        $lat = $request->lat;
        $lng = $request->lng;
        $radius = $request->radius ?? 5.0; // Default 5km

        // Haversine formula to find independent traders within radius
        // Uses Trader lat/lng first, falls back to Market lat/lng
        $traders = Trader::where('verification_status', 'verified')
            ->selectRaw("traders.*, ROUND(( 6371 * acos( cos( radians(?) ) * cos( radians( COALESCE(traders.latitude, markets.latitude) ) ) * cos( radians( COALESCE(traders.longitude, markets.longitude) ) - radians(?) ) + sin( radians(?) ) * sin( radians( COALESCE(traders.latitude, markets.latitude) ) ) ) ), 2) AS distance_km", [$lat, $lng, $lat])
            ->join('markets', 'traders.market_id', '=', 'markets.id')
            ->having('distance_km', '<=', $radius)
            ->orderBy('distance_km')
            ->with(['market', 'stall'])
            ->get();

        return $this->success($traders);
    }

}

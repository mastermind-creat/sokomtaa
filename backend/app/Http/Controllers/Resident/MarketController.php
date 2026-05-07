<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\Market;
use App\Models\Category;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MarketController extends Controller
{
    use ApiResponse;

    /**
     * List all active markets.
     */
    public function index(): JsonResponse
    {
        $markets = Market::where('is_active', true)
            ->withCount(['traders' => function ($query) {
                $query->where('verification_status', 'verified');
            }])
            ->get();

        return $this->success($markets);
    }

    /**
     * Find markets near a specific location.
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
        $radius = $request->radius ?? 10; // Default 10km

        // Haversine formula to find markets within radius
        $markets = Market::where('is_active', true)
            ->selectRaw("*, ( 6371 * acos( cos( radians(?) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(?) ) + sin( radians(?) ) * sin( radians( latitude ) ) ) ) AS distance", [$lat, $lng, $lat])
            ->having('distance', '<=', $radius)
            ->orderBy('distance')
            ->withCount(['traders' => function ($query) {
                $query->where('verification_status', 'verified');
            }])
            ->get();

        return $this->success($markets);
    }

    /**
     * Detailed view of a single market.
     */
    public function show(Market $market): JsonResponse
    {
        $market->loadCount(['traders' => function ($query) {
            $query->where('verification_status', 'verified');
        }]);

        // Get traders in this market
        $traders = $market->traders()
            ->where('verification_status', 'verified')
            ->with(['stall', 'user'])
            ->paginate(15);

        // Get categories that have products in this market
        $categories = Category::whereHas('products', function ($query) use ($market) {
            $query->whereHas('trader', function ($q) use ($market) {
                $q->where('market_id', $market->id);
            });
        })->get();

        return $this->success([
            'market' => $market,
            'traders' => $traders,
            'categories' => $categories
        ]);
    }
}

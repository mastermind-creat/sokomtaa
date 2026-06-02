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
     * List active markets, optionally sorted/filtered by distance.
     * Accepts: lat, lng, radius (km, default 5)
     */
    public function index(Request $request): JsonResponse
    {
        $lat    = $request->filled('lat')    ? (float) $request->lat    : null;
        $lng    = $request->filled('lng')    ? (float) $request->lng    : null;
        $radius = $request->filled('radius') ? (float) $request->radius : 50.0;

        $query = Market::where('is_active', true)
            ->withCount('traders')
            ->with(['center.region']);

        if ($request->filled('q')) {
            $query->where('name', 'LIKE', "%{$request->q}%");
        }

        if ($request->has('region_id')) {
            $query->whereHas('center', function($q) use ($request) {
                $q->where('region_id', $request->region_id);
            });
        }

        if ($request->has('center_id')) {
            $query->where('center_id', $request->center_id);
        }

        // If coordinates supplied, add distance column + filter by radius
        if ($lat !== null && $lng !== null) {
            $query->selectRaw(
                "markets.*, ROUND(( 6371 * acos( cos( radians(?) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(?) ) + sin( radians(?) ) * sin( radians( latitude ) ) ) ), 2) AS distance_km",
                [$lat, $lng, $lat]
            )->having('distance_km', '<=', $radius)
             ->orderBy('distance_km');
        }

        $markets = $query->get();

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
        $radius = $request->radius ?? 50; // Default 50km

        // Haversine formula to find markets within radius
        $markets = Market::where('is_active', true)
            ->selectRaw("markets.*, ( 6371 * acos( cos( radians(?) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(?) ) + sin( radians(?) ) * sin( radians( latitude ) ) ) ) AS distance", [$lat, $lng, $lat])
            ->having('distance', '<=', $radius)
            ->orderBy('distance')
            ->withCount('traders')
            ->get();

        return $this->success($markets);
    }

    /**
     * Detailed view of a single market.
     */
    public function show(Market $market): JsonResponse
    {
        $market->loadCount('traders');

        // Get traders in this market
        $traders = $market->traders()
            ->with(['stall', 'user'])
            ->get(); // Using get() instead of paginate for the grid view

        // Get all stalls in this market
        $stalls = $market->stalls()
            ->with('trader')
            ->get();

        // Get products in this market (via traders)
        $products = \App\Models\Product::whereHas('trader', function ($query) use ($market) {
            $query->where('market_id', $market->id);
        })->with(['trader.stall', 'category'])->get();

        // Get categories that have products in this market
        $categories = Category::whereHas('products', function ($query) use ($market) {
            $query->whereHas('trader', function ($q) use ($market) {
                $q->where('market_id', $market->id);
            });
        })->get();

        return $this->success([
            'market' => $market,
            'traders' => $traders,
            'stalls' => $stalls,
            'products' => $products,
            'categories' => $categories
        ]);
    }

    /**
     * Compare prices of similar items in a market.
     */
    public function compare(Request $request, Market $market): JsonResponse
    {
        $query = $request->input('q');
        
        $productsQuery = \App\Models\Product::whereHas('trader', function ($q) use ($market) {
            $q->where('market_id', $market->id);
        })->with(['trader:id,business_name,avatar_url', 'trader.stall:id,stall_number', 'category:id,name']);

        if ($query) {
            $productsQuery->where(function($q) use ($query) {
                $q->where('name', 'LIKE', "%{$query}%")
                  ->orWhere('description', 'LIKE', "%{$query}%");
            });
        }

        $products = $productsQuery->get();

        // Group by normalized name (lowercase, trimmed)
        $grouped = $products->groupBy(function ($item) {
            return strtolower(trim($item->name));
        })->map(function ($items, $name) {
            return [
                'name' => $items->first()->name, // Use original casing from first item
                'category' => $items->first()->category?->name,
                'min_price' => $items->min('price'),
                'max_price' => $items->max('price'),
                'avg_price' => round($items->avg('price'), 2),
                'unit' => $items->first()->unit,
                'traders' => $items->map(function($item) {
                    return [
                        'trader_id' => $item->trader_id,
                        'business_name' => $item->trader->business_name,
                        'avatar_url' => $item->trader->avatar_url,
                        'average_rating' => $item->trader->average_rating,
                        'stall_number' => $item->trader->stall?->stall_number,
                        'price' => $item->price,
                        'stock_status' => $item->stock_status,
                        'product_id' => $item->id
                    ];
                })->sortBy('price')->values()
            ];
        })->values();

        return $this->success($grouped);
    }
}

<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Trader;
use App\Models\Market;
use Illuminate\Support\Collection;

class SearchService
{
    /**
     * Conduct a global weighted search across the marketplace.
     */
    public function globalSearch(string $query): array
    {
        $products = Product::with(['trader', 'category'])
            ->where('name', 'LIKE', "%{$query}%")
            ->orWhere('name_sw', 'LIKE', "%{$query}%")
            ->orWhere('description', 'LIKE', "%{$query}%")
            ->where('is_active', true)
            ->get()
            ->map(function ($product) {
                $ratingWeight = $product->trader?->average_rating ?? 0;
                $popularityWeight = min($product->total_reservations / 10, 5); // Max 5 pts from reservations
                $product->reliability_score = ($ratingWeight * 0.7) + ($popularityWeight * 0.3);
                $product->search_type = 'product';
                return $product;
            });

        $traders = Trader::with(['market', 'stall'])
            ->where('business_name', 'LIKE', "%{$query}%")
            ->orWhere('description', 'LIKE', "%{$query}%")
            ->where('verification_status', 'verified')
            ->get()
            ->map(function ($trader) {
                // Focus entirely on rating and profile views
                $popularityWeight = min($trader->profile_views / 100, 5);
                $trader->reliability_score = ($trader->average_rating * 0.8) + ($popularityWeight * 0.2);
                $trader->search_type = 'trader';
                return $trader;
            });

        $markets = Market::where('name', 'LIKE', "%{$query}%")
            ->orWhere('location', 'LIKE', "%{$query}%")
            ->where('is_active', true)
            ->get()
            ->map(function ($market) {
                $market->reliability_score = 10; // Markets always rank high contextually
                $market->search_type = 'market';
                return $market;
            });

        // Combine and sort by our weighted reliability score
        $allResults = collect()
            ->concat($products)
            ->concat($traders)
            ->concat($markets)
            ->sortByDesc('reliability_score')
            ->values();

        return [
            'results' => $allResults->take(20), // Top 20 relevant results
            'total' => $allResults->count(),
            'breakdown' => [
                'products' => $products->count(),
                'traders' => $traders->count(),
                'markets' => $markets->count()
            ]
        ];
    }

    /**
     * Get discovery segments for the Resident Home page.
     */
    public function getDiscoverySegments(): array
    {
        $popularProducts = Product::with(['trader', 'category'])
            ->where('is_active', true)
            ->where('stock_status', 'available')
            ->orderByDesc('total_reservations')
            ->take(8)
            ->get();

        $topTraders = Trader::with(['market'])
            ->where('verification_status', 'verified')
            ->where('is_open', true)
            ->orderByDesc('average_rating')
            ->take(6)
            ->get();

        return [
            'popular_products' => $popularProducts,
            'top_traders' => $topTraders,
        ];
    }
}

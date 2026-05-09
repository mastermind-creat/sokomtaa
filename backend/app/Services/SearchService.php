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
                $popularityWeight = min($product->total_reservations / 10, 5); 
                
                $score = ($ratingWeight * 0.7) + ($popularityWeight * 0.3);
                
                // MICRO-ADS: Massively boost products that paid for a spot
                if ($product->is_boosted && $product->boosted_until && $product->boosted_until->isFuture()) {
                    $score += 100; 
                }

                // Stock Availability Intelligence
                if ($product->stock_status === 'out_of_stock') {
                    $score *= 0.1; // Sink to the bottom
                } elseif ($product->stock_status === 'low') {
                    $score *= 0.8; // Slight penalty
                }
                
                $product->reliability_score = $score;
                $product->search_type = 'product';
                return $product;
            });

        $traders = Trader::with(['market', 'stall'])
            ->where('business_name', 'LIKE', "%{$query}%")
            ->orWhere('description', 'LIKE', "%{$query}%")
            ->get()
            ->map(function ($trader) {
                $popularityWeight = min($trader->profile_views / 100, 5);
                $score = ($trader->average_rating * 0.8) + ($popularityWeight * 0.2);
                
                // Operational Intelligence
                if (!$trader->is_open) {
                    $score *= 0.5; // Closed shops rank lower
                }
                
                $trader->reliability_score = $score;
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
            ->where('is_open', true)
            ->orderByDesc('average_rating')
            ->take(6)
            ->get();

        $boostedProducts = Product::with(['trader', 'category'])
            ->where('is_active', true)
            ->where('is_boosted', true)
            ->where('boosted_until', '>=', now())
            ->where('stock_status', 'available')
            ->inRandomOrder()
            ->take(6)
            ->get();

        return [
            'boosted_products' => $boostedProducts,
            'popular_products' => $popularProducts,
            'top_traders' => $topTraders,
        ];
    }
}

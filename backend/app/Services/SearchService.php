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
    public function globalSearch(?string $query = null, ?int $categoryId = null, ?float $lat = null, ?float $lng = null, float $radius = 5.0): array
    {
        // 1. PRODUCTS
        $productsQuery = Product::with(['trader.market', 'category']);

        if ($query) {
            // AI Query Expansion
            $aiService = app(\App\Services\AiService::class);
            $expandedQueries = $aiService->expandQuery($query);
            
            $productsQuery->where(function($q) use ($expandedQueries) {
                foreach ($expandedQueries as $qTerm) {
                    $q->orWhere('name', 'LIKE', "%{$qTerm}%")
                      ->orWhere('name_sw', 'LIKE', "%{$qTerm}%")
                      ->orWhere('description', 'LIKE', "%{$qTerm}%");
                }
            });
        }

        if ($categoryId) {
            $productsQuery->where('category_id', $categoryId);
        }

        // Distance filtering for products (via trader's market location)
        if ($lat !== null && $lng !== null) {
            $productsQuery->selectRaw(
                "products.*, ROUND(( 6371 * acos( cos( radians(?) ) * cos( radians( COALESCE(traders.latitude, markets.latitude) ) ) * cos( radians( COALESCE(traders.longitude, markets.longitude) ) - radians(?) ) + sin( radians(?) ) * sin( radians( COALESCE(traders.latitude, markets.latitude) ) ) ) ), 2) AS distance_km",
                [$lat, $lng, $lat]
            )
            ->join('traders', 'products.trader_id', '=', 'traders.id')
            ->join('markets', 'traders.market_id', '=', 'markets.id')
            ->having('distance_km', '<=', $radius);
        }

        $products = $productsQuery->where('products.is_active', true)
            ->get()
            ->map(function ($product) {
                $ratingWeight = $product->trader?->average_rating ?? 0;
                $popularityWeight = min($product->total_reservations / 10, 5); 
                
                $score = ($ratingWeight * 0.7) + ($popularityWeight * 0.3);
                
                // Distance penalty: bias towards closer items
                if (isset($product->distance_km)) {
                    $score += (5 - min($product->distance_km, 5)) * 10; // Boost closer items
                }

                if ($product->is_boosted && $product->boosted_until && $product->boosted_until->isFuture()) {
                    $score += 100; 
                }

                if ($product->stock_status === 'out_of_stock') {
                    $score *= 0.1;
                } elseif ($product->stock_status === 'low') {
                    $score *= 0.8;
                }
                
                $product->reliability_score = $score;
                $product->search_type = 'product';
                return $product;
            });

        // 2. TRADERS
        $tradersQuery = Trader::with(['market', 'stall']);
        if ($query) {
            $aiService = app(\App\Services\AiService::class);
            $expandedQueries = $aiService->expandQuery($query);

            $tradersQuery->where(function($q) use ($expandedQueries) {
                foreach ($expandedQueries as $qTerm) {
                    $q->orWhere('business_name', 'LIKE', "%{$qTerm}%")
                      ->orWhere('description', 'LIKE', "%{$qTerm}%");
                }
            });
        }

        if ($lat !== null && $lng !== null) {
            $tradersQuery->selectRaw(
                "traders.*, ROUND(( 6371 * acos( cos( radians(?) ) * cos( radians( COALESCE(traders.latitude, markets.latitude) ) ) * cos( radians( COALESCE(traders.longitude, markets.longitude) ) - radians(?) ) + sin( radians(?) ) * sin( radians( COALESCE(traders.latitude, markets.latitude) ) ) ) ), 2) AS distance_km",
                [$lat, $lng, $lat]
            )
            ->join('markets', 'traders.market_id', '=', 'markets.id')
            ->having('distance_km', '<=', $radius);
        }
        
        $traders = $tradersQuery->get()
            ->map(function ($trader) {
                $popularityWeight = min($trader->profile_views / 100, 5);
                $score = ($trader->average_rating * 0.8) + ($popularityWeight * 0.2);
                
                if (isset($trader->distance_km)) {
                    $score += (5 - min($trader->distance_km, 5)) * 10;
                }

                if (!$trader->is_open) {
                    $score *= 0.5;
                }
                
                $trader->reliability_score = $score;
                $trader->search_type = 'trader';
                return $trader;
            });

        // 3. MARKETS
        $marketsQuery = Market::where('is_active', true);
        if ($query) {
            $aiService = app(\App\Services\AiService::class);
            $expandedQueries = $aiService->expandQuery($query);

            $marketsQuery->where(function($q) use ($expandedQueries) {
                foreach ($expandedQueries as $qTerm) {
                    $q->orWhere('name', 'LIKE', "%{$qTerm}%")
                      ->orWhere('location', 'LIKE', "%{$qTerm}%");
                }
            });
        }

        if ($lat !== null && $lng !== null) {
            $marketsQuery->selectRaw(
                "*, ROUND(( 6371 * acos( cos( radians(?) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(?) ) + sin( radians(?) ) * sin( radians( latitude ) ) ) ), 2) AS distance_km",
                [$lat, $lng, $lat]
            )->having('distance_km', '<=', $radius);
        }

        $markets = $marketsQuery->get()
            ->map(function ($market) {
                $score = 10;
                if (isset($market->distance_km)) {
                    $score += (5 - min($market->distance_km, 5)) * 10;
                }
                $market->reliability_score = $score;
                $market->search_type = 'market';
                return $market;
            });

        $allResults = collect()
            ->concat($products)
            ->concat($traders)
            ->concat($markets)
            ->sortByDesc('reliability_score')
            ->values();

        return [
            'results' => $allResults->take(20),
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
    public function getDiscoverySegments(?float $lat = null, ?float $lng = null, float $radius = 5.0): array
    {
        // 1. Boosted Products (Global or Nearby)
        $boostedQuery = Product::with(['trader.market', 'category'])
            ->where('products.is_active', true)
            ->where('is_boosted', true)
            ->where('boosted_until', '>=', now())
            ->where('stock_status', 'available');

        if ($lat !== null && $lng !== null) {
            $boostedQuery->selectRaw(
                "products.*, ROUND(( 6371 * acos( cos( radians(?) ) * cos( radians( COALESCE(traders.latitude, markets.latitude) ) ) * cos( radians( COALESCE(traders.longitude, markets.longitude) ) - radians(?) ) + sin( radians(?) ) * sin( radians( COALESCE(traders.latitude, markets.latitude) ) ) ) ), 2) AS distance_km",
                [$lat, $lng, $lat]
            )
            ->join('traders', 'products.trader_id', '=', 'traders.id')
            ->join('markets', 'traders.market_id', '=', 'markets.id')
            ->having('distance_km', '<=', $radius);
        }

        $boostedProducts = $boostedQuery->inRandomOrder()->take(6)->get();

        // 2. Popular Products (Bias towards nearby if coords available)
        $popularQuery = Product::with(['trader.market', 'category'])
            ->where('products.is_active', true)
            ->where('stock_status', 'available');

        if ($lat !== null && $lng !== null) {
            $popularQuery->selectRaw(
                "products.*, ROUND(( 6371 * acos( cos( radians(?) ) * cos( radians( COALESCE(traders.latitude, markets.latitude) ) ) * cos( radians( COALESCE(traders.longitude, markets.longitude) ) - radians(?) ) + sin( radians(?) ) * sin( radians( COALESCE(traders.latitude, markets.latitude) ) ) ) ), 2) AS distance_km",
                [$lat, $lng, $lat]
            )
            ->join('traders', 'products.trader_id', '=', 'traders.id')
            ->join('markets', 'traders.market_id', '=', 'markets.id')
            ->having('distance_km', '<=', $radius);
        }

        $popularProducts = $popularQuery->orderByDesc('total_reservations')->take(8)->get();

        // 3. Top Traders
        $tradersQuery = Trader::with(['market'])
            ->where('is_open', true);

        if ($lat !== null && $lng !== null) {
            $tradersQuery->selectRaw(
                "traders.*, ROUND(( 6371 * acos( cos( radians(?) ) * cos( radians( COALESCE(traders.latitude, markets.latitude) ) ) * cos( radians( COALESCE(traders.longitude, markets.longitude) ) - radians(?) ) + sin( radians(?) ) * sin( radians( COALESCE(traders.latitude, markets.latitude) ) ) ) ), 2) AS distance_km",
                [$lat, $lng, $lat]
            )
            ->join('markets', 'traders.market_id', '=', 'markets.id')
            ->having('distance_km', '<=', $radius);
        }

        $topTraders = $tradersQuery->orderByDesc('average_rating')->take(6)->get();

        return [
            'boosted_products' => $boostedProducts,
            'popular_products' => $popularProducts,
            'top_traders' => $topTraders,
        ];
    }
}



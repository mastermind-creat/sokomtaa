<?php

namespace App\Services;

use App\Models\Product;
use App\Models\SearchAlias;
use App\Models\Trader;
use App\Models\Market;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SearchService
{
    /**
     * Conduct a global weighted search across the marketplace.
     */
    public function globalSearch(
        ?string $query      = null,
        ?int    $categoryId = null,
        ?float  $lat        = null,
        ?float  $lng        = null,
        float   $radius     = 50.0
    ): array {
        // ── Products via 4-stage pipeline ────────────────────────────────────
        $products = $query
            ? $this->searchProductsPipeline($query, $categoryId, $lat, $lng, $radius)
            : $this->baseProductQuery($categoryId, $lat, $lng, $radius)->get();

        $products = $this->scoreProducts($products, $lat, $lng);

        // ── Traders ──────────────────────────────────────────────────────────
        $tradersQuery = Trader::with(['market', 'stall']);
        if ($query) {
            $tradersQuery->where(function ($q) use ($query) {
                $q->where('business_name', 'LIKE', "%{$query}%")
                  ->orWhere('description', 'LIKE', "%{$query}%");
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

        $traders = $tradersQuery->get()->map(function ($trader) {
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

        // ── Markets ───────────────────────────────────────────────────────────
        $marketsQuery = Market::where('is_active', true);
        if ($query) {
            $marketsQuery->where(function ($q) use ($query) {
                $q->where('name', 'LIKE', "%{$query}%")
                  ->orWhere('location', 'LIKE', "%{$query}%");
            });
        }

        if ($lat !== null && $lng !== null) {
            $marketsQuery->selectRaw(
                "*, ROUND(( 6371 * acos( cos( radians(?) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(?) ) + sin( radians(?) ) * sin( radians( latitude ) ) ) ), 2) AS distance_km",
                [$lat, $lng, $lat]
            )->having('distance_km', '<=', $radius);
        }

        $markets = $marketsQuery->get()->map(function ($market) {
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
            'results'   => $allResults->take(20),
            'total'     => $allResults->count(),
            'breakdown' => [
                'products' => $products->count(),
                'traders'  => $traders->count(),
                'markets'  => $markets->count(),
            ],
        ];
    }

    // =========================================================================
    // 4-STAGE SEARCH PIPELINE (products only)
    // =========================================================================

    /**
     * Run the four-stage product search pipeline and return a scored collection.
     */
    private function searchProductsPipeline(
        string $query,
        ?int   $categoryId,
        ?float $lat,
        ?float $lng,
        float  $radius
    ): Collection {
        // ── Stage 1: Alias resolution ─────────────────────────────────────────
        $terms = $this->resolveAliases($query);

        // ── Stage 2: MySQL FULLTEXT ───────────────────────────────────────────
        $products = $this->fulltextSearch($terms, $categoryId, $lat, $lng, $radius);

        if ($products->isNotEmpty()) {
            return $products; // Skip stages 3 & 4
        }

        // ── Stage 3: Fuzzy LIKE fallback ──────────────────────────────────────
        $products = $this->fuzzySearch($terms, $categoryId, $lat, $lng, $radius);

        // ── Stage 4: AI expansion (only when total candidates < 3) ────────────
        if ($products->count() < 3 && mb_strlen(trim($query)) >= 3) {
            $products = $this->aiExpandedSearch($query, $terms, $categoryId, $lat, $lng, $radius, $products);
        }

        return $products;
    }

    /**
     * Stage 1 — Alias resolution.
     * Returns an array containing the original query plus any maps_to value found.
     */
    private function resolveAliases(string $query): array
    {
        $alias = SearchAlias::whereRaw('LOWER(alias) = LOWER(?)', [trim($query)])->first();
        $terms = [$query];

        if ($alias && $alias->maps_to !== $query) {
            $terms[] = $alias->maps_to;
        }

        return array_unique($terms);
    }

    /**
     * Stage 2 — MySQL FULLTEXT search.
     */
    private function fulltextSearch(
        array  $terms,
        ?int   $categoryId,
        ?float $lat,
        ?float $lng,
        float  $radius
    ): Collection {
        // MATCH ... AGAINST is MySQL-only. On any other driver (the SQLite test
        // database) fall through to the fuzzy LIKE stage instead of throwing.
        if (! in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            return collect();
        }

        $searchString = implode(' ', $terms);

        $q = $this->baseProductQuery($categoryId, $lat, $lng, $radius);
        $q->whereRaw(
            'MATCH(products.name, products.name_sw, products.description) AGAINST (? IN NATURAL LANGUAGE MODE)',
            [$searchString]
        );

        return $q->get();
    }

    /**
     * Stage 3 — Fuzzy LIKE fallback.
     * Only tokens with strlen >= 3 are used. Results capped at 50 by reliability_score.
     */
    private function fuzzySearch(
        array  $terms,
        ?int   $categoryId,
        ?float $lat,
        ?float $lng,
        float  $radius
    ): Collection {
        // Flatten all terms into individual tokens of length >= 3
        $tokens = [];
        foreach ($terms as $term) {
            foreach (explode(' ', $term) as $token) {
                $token = trim($token);
                if (mb_strlen($token) >= 3) {
                    $tokens[] = $token;
                }
            }
        }

        if (empty($tokens)) {
            return collect();
        }

        $q = $this->baseProductQuery($categoryId, $lat, $lng, $radius);
        $q->where(function ($sub) use ($tokens) {
            foreach ($tokens as $token) {
                $sub->orWhere('products.name',        'LIKE', "%{$token}%")
                    ->orWhere('products.name_sw',     'LIKE', "%{$token}%")
                    ->orWhere('products.description', 'LIKE', "%{$token}%");
            }
        });

        // Cap at 50 by reliability_score proxy (total_reservations for ordering)
        return $q->orderByDesc('products.total_reservations')->limit(50)->get();
    }

    /**
     * Stage 4 — AI query expansion.
     * Expands query via AiService (cached 30 min), re-runs FULLTEXT + LIKE,
     * then deduplicates with prior results.
     */
    private function aiExpandedSearch(
        string     $query,
        array      $priorTerms,
        ?int       $categoryId,
        ?float     $lat,
        ?float     $lng,
        float      $radius,
        Collection $priorResults
    ): Collection {
        $cacheKey      = 'ai_expand_' . strtolower(trim($query));
        $existingIds   = $priorResults->pluck('id')->toArray();

        try {
            $expandedTerms = Cache::remember($cacheKey, 1800, function () use ($query) {
                /** @var AiService $ai */
                $ai = app(AiService::class);
                return $ai->expandQuery($query);
            });
        } catch (\Throwable $e) {
            Log::warning('SearchService AI expansion failed', ['query' => $query, 'error' => $e->getMessage()]);
            return $priorResults;
        }

        $allTerms = array_unique(array_merge($priorTerms, $expandedTerms));

        // Re-run FULLTEXT with expanded terms
        $expanded = $this->fulltextSearch($allTerms, $categoryId, $lat, $lng, $radius);

        // Fallback to LIKE with expanded terms if FULLTEXT still empty
        if ($expanded->isEmpty()) {
            $expanded = $this->fuzzySearch($allTerms, $categoryId, $lat, $lng, $radius);
        }

        // Deduplicate by product ID and merge with prior results
        $newResults = $expanded->reject(fn ($p) => in_array($p->id, $existingIds));

        return $priorResults->concat($newResults)->values();
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Base product query with category, distance, and active-only filters.
     * Does NOT include any text-matching clauses.
     */
    private function baseProductQuery(
        ?int   $categoryId,
        ?float $lat,
        ?float $lng,
        float  $radius
    ) {
        $q = Product::with(['trader.market', 'category'])
            ->where('products.is_active', true);

        if ($categoryId) {
            $q->where('category_id', $categoryId);
        }

        if ($lat !== null && $lng !== null) {
            $q->selectRaw(
                "products.*, ROUND(( 6371 * acos( cos( radians(?) ) * cos( radians( COALESCE(traders.latitude, markets.latitude) ) ) * cos( radians( COALESCE(traders.longitude, markets.longitude) ) - radians(?) ) + sin( radians(?) ) * sin( radians( COALESCE(traders.latitude, markets.latitude) ) ) ) ), 2) AS distance_km",
                [$lat, $lng, $lat]
            )
            ->join('traders', 'products.trader_id', '=', 'traders.id')
            ->join('markets', 'traders.market_id', '=', 'markets.id')
            ->having('distance_km', '<=', $radius);
        }

        return $q;
    }

    /**
     * Score a collection of Product models in-place and tag with search_type.
     * Also attaches ai_insight when available (cached 24 h per product).
     */
    private function scoreProducts(Collection $products, ?float $lat, ?float $lng): Collection
    {
        return $products->map(function ($product) {
            $ratingWeight    = $product->trader?->average_rating ?? 0;
            $popularityWeight = min($product->total_reservations / 10, 5);
            $score           = ($ratingWeight * 0.7) + ($popularityWeight * 0.3);

            if (isset($product->distance_km)) {
                $score += (5 - min($product->distance_km, 5)) * 10;
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
            $product->search_type       = 'product';

            // ── AI insight attachment (non-blocking) ──────────────────────────
            $insightKey = "product_insight_{$product->id}";
            $insight    = Cache::get($insightKey);

            if ($insight === null) {
                try {
                    /** @var AiService $ai */
                    $ai     = app(AiService::class);
                    $name   = $product->name;
                    $sw     = $product->name_sw ? " ({$product->name_sw})" : '';
                    $cat    = $product->category?->name ?? 'general';
                    $prompt = "Give a 1-2 sentence helpful market tip about {$name}{$sw} in the {$cat} category for a Kenyan shopper. Return plain text only, no markdown, no asterisks.";

                    $generated = $ai->generate($prompt);

                    if (!empty($generated)) {
                        Cache::put($insightKey, $generated, 86400); // 24 hours
                        $insight = $generated;
                    }
                } catch (\Throwable $e) {
                    Log::debug('ai_insight generation failed', ['product_id' => $product->id, 'error' => $e->getMessage()]);
                }
            }

            if (!empty($insight)) {
                $product->ai_insight = $insight;
            }

            return $product;
        });
    }

    // =========================================================================
    // DISCOVERY SEGMENTS (home page)
    // =========================================================================

    /**
     * Get discovery segments for the Resident Home page.
     */
    public function getDiscoverySegments(?float $lat = null, ?float $lng = null, float $radius = 50.0): array
    {
        // 1. Boosted Products
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

        // 2. Popular Products
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

        // 3. Top Traders — ordered by average_rating DESC, total_reviews DESC (Requirement 12.3)
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

        $topTraders = $tradersQuery
            ->orderByDesc('average_rating')
            ->orderByDesc('total_reviews')
            ->take(6)
            ->get();

        return [
            'boosted_products' => $boostedProducts,
            'popular_products' => $popularProducts,
            'top_traders'      => $topTraders,
        ];
    }
}

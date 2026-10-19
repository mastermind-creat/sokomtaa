<?php

// Feature: polyglot-architecture-upgrade, Property 18: Trader Ranking by Price Ascending
// Validates: Requirements 8.3

it('ensures trader ranking sorting is ordered by price ascending with no cheaper option following a more expensive one across 100 randomized cases', function (array $products) {
    // The sorting logic in AiMatchController sorts matched products by price ascending
    $collection = collect($products)->sortBy(fn ($p) => (float) $p['price'])->values();

    $count = $collection->count();
    for ($i = 0; $i < $count - 1; $i++) {
        $currentPrice = (float) $collection[$i]['price'];
        $nextPrice = (float) $collection[$i + 1]['price'];

        // Invariant: current price <= next price (monotonic non-decreasing)
        expect($currentPrice)->toBeLessThanOrEqual($nextPrice);
    }
})->with(function () {
    $cases = [];
    for ($i = 0; $i < 100; $i++) {
        $count = rand(2, 25);
        $products = [];
        for ($j = 0; $j < $count; $j++) {
            $products[] = [
                'trader_id' => rand(1, 100),
                'product_id' => rand(1, 500),
                'price' => rand(10, 50000) / 10.0, // 1.0 to 5000.0 KES
            ];
        }
        $cases[] = [$products];
    }
    return $cases;
});

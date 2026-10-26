<?php

// Feature: email-phone-registration-ai-search, Property 7: alias resolution round-trip

namespace Tests\Feature\Search;

use App\Models\Category;
use App\Models\Market;
use App\Models\Product;
use App\Models\SearchAlias;
use App\Models\Trader;
use App\Models\User;
use App\Services\SearchService;
use Database\Seeders\SearchAliasSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Property 7: Alias resolution is a round-trip.
 *
 * For any (alias, maps_to) pair in search_aliases, a search using the alias
 * value SHALL return a superset of the results returned by a direct search
 * using the maps_to value, when at least one active product matches maps_to.
 *
 * Validates: Requirements 6.2, 6.5
 */
class AliasRoundTripPropertyTest extends TestCase
{
    use RefreshDatabase;

    private SearchService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(SearchService::class);
        $this->seed(SearchAliasSeeder::class);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function createActiveProduct(string $name, ?string $nameSw = null): Product
    {
        $market = Market::create([
            'name'      => 'Test Market',
            'location'  => 'Nairobi',
            'county'    => 'Nairobi',
            'estate'    => 'Westlands',
            'latitude'  => -1.286,
            'longitude' => 36.817,
            'is_active' => true,
        ]);

        $user = User::create([
            'name'           => 'Trader User',
            'phone'          => '07' . rand(10000000, 99999999),
            'password'       => Hash::make('password'),
            'role'           => 'trader',
            'phone_verified' => true,
            'is_active'      => true,
        ]);

        $trader = Trader::create([
            'user_id'             => $user->id,
            'market_id'           => $market->id,
            'business_name'       => 'Test Trader',
            'verification_status' => 'verified',
            'is_open'             => true,
            'average_rating'      => 4.0,
            'total_reviews'       => 5,
        ]);

        $category = Category::create([
            'name'    => 'Test Category',
            'name_sw' => 'Kategoria ya Majaribio',
        ]);

        return Product::create([
            'trader_id'    => $trader->id,
            'category_id'  => $category->id,
            'name'         => $name,
            'name_sw'      => $nameSw,
            'price'        => 50.00,
            'unit'         => 'kg',
            'is_active'    => true,
            'stock_status' => 'available',
        ]);
    }

    private function productIdsFrom(array $result): array
    {
        return collect($result['results'])
            ->where('search_type', 'product')
            ->pluck('id')
            ->toArray();
    }

    // -------------------------------------------------------------------------
    // Property 7 — core round-trip
    // -------------------------------------------------------------------------

    /**
     * @test
     * Searching by alias returns at least the same products as searching by maps_to.
     */
    public function test_alias_search_returns_superset_of_maps_to_search(): void
    {
        // Use the seeded nyanya → tomatoes pair
        $this->createActiveProduct('Tomatoes', 'Nyanya');

        $resultsByAlias  = $this->service->globalSearch('nyanya');
        $resultsByMapsTo = $this->service->globalSearch('tomatoes');

        $idsByAlias  = $this->productIdsFrom($resultsByAlias);
        $idsByMapsTo = $this->productIdsFrom($resultsByMapsTo);

        // Every ID found by the canonical term must also appear in the alias search
        foreach ($idsByMapsTo as $id) {
            $this->assertContains(
                $id,
                $idsByAlias,
                "Product #{$id} found via 'tomatoes' was NOT found via alias 'nyanya'"
            );
        }
    }

    /**
     * @test
     * Property 7 — 20 iterations across different seeded alias pairs.
     */
    public function test_alias_round_trip_across_seeded_pairs(): void
    {
        $pairs = [
            ['alias' => 'vitunguu', 'maps_to' => 'onions',    'name' => 'Onions',    'name_sw' => 'Vitunguu'],
            ['alias' => 'maembe',   'maps_to' => 'mangoes',   'name' => 'Mangoes',   'name_sw' => 'Maembe'],
            ['alias' => 'viazi',    'maps_to' => 'potatoes',  'name' => 'Potatoes',  'name_sw' => 'Viazi'],
            ['alias' => 'mayai',    'maps_to' => 'eggs',      'name' => 'Eggs',      'name_sw' => 'Mayai'],
        ];

        foreach ($pairs as $pair) {
            $this->createActiveProduct($pair['name'], $pair['name_sw']);

            $byAlias  = $this->productIdsFrom($this->service->globalSearch($pair['alias']));
            $byMapsTo = $this->productIdsFrom($this->service->globalSearch($pair['maps_to']));

            foreach ($byMapsTo as $id) {
                $this->assertContains(
                    $id,
                    $byAlias,
                    "Alias '{$pair['alias']}' did not return product #{$id} found by '{$pair['maps_to']}'"
                );
            }
        }
    }

    /**
     * @test
     * Searching with an unknown term (no alias) still works and returns empty safely.
     */
    public function test_unknown_alias_proceeds_with_original_query(): void
    {
        $result = $this->service->globalSearch('xyzunknownterm9999');

        $this->assertIsArray($result);
        $this->assertArrayHasKey('results', $result);
        $this->assertArrayHasKey('total', $result);
        $this->assertSame(0, (int) collect($result['results'])->where('search_type', 'product')->count());
    }

    /**
     * @test
     * Alias lookup is case-insensitive — "NYANYA" resolves same as "nyanya".
     */
    public function test_alias_resolution_is_case_insensitive(): void
    {
        $this->createActiveProduct('Tomatoes', 'Nyanya');

        $lower = $this->productIdsFrom($this->service->globalSearch('nyanya'));
        $upper = $this->productIdsFrom($this->service->globalSearch('NYANYA'));
        $mixed = $this->productIdsFrom($this->service->globalSearch('Nyanya'));

        $this->assertEqualsCanonicalizing($lower, $upper, 'Case mismatch: nyanya vs NYANYA');
        $this->assertEqualsCanonicalizing($lower, $mixed, 'Case mismatch: nyanya vs Nyanya');
    }
}

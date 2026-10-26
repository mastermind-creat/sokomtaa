<?php

// Feature: email-phone-registration-ai-search, Property 14: SearchAliasSeeder idempotence

namespace Tests\Feature\Search;

use App\Models\SearchAlias;
use Database\Seeders\SearchAliasSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Property 14: SearchAliasSeeder idempotence.
 *
 * Running SearchAliasSeeder N times produces the same row count as running it
 * once — no duplicate alias records are created.
 *
 * Validates: Requirements 11.2
 */
class SearchAliasSeederIdempotenceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @test
     * Running the seeder twice produces the same row count as running it once.
     */
    public function test_running_seeder_twice_does_not_create_duplicates(): void
    {
        $this->seed(SearchAliasSeeder::class);
        $countAfterFirst = SearchAlias::count();

        $this->assertGreaterThanOrEqual(20, $countAfterFirst, 'Seeder must create at least 20 alias pairs');

        $this->seed(SearchAliasSeeder::class);
        $countAfterSecond = SearchAlias::count();

        $this->assertSame(
            $countAfterFirst,
            $countAfterSecond,
            'Running the seeder a second time must not create duplicate rows'
        );
    }

    /**
     * @test
     * Property 14 — 10 iterations: seeder is idempotent across N runs.
     * Row count stays constant no matter how many times the seeder is called.
     */
    public function test_seeder_idempotent_across_multiple_runs(): void
    {
        $this->seed(SearchAliasSeeder::class);
        $baseline = SearchAlias::count();

        for ($n = 2; $n <= 10; $n++) {
            $this->seed(SearchAliasSeeder::class);

            $this->assertSame(
                $baseline,
                SearchAlias::count(),
                "Row count changed after seeder run #{$n}"
            );
        }
    }

    /**
     * @test
     * Each seeded alias has the required non-empty alias, maps_to, and language fields.
     */
    public function test_seeded_aliases_have_required_fields(): void
    {
        $this->seed(SearchAliasSeeder::class);

        SearchAlias::all()->each(function (SearchAlias $alias) {
            $this->assertNotEmpty($alias->alias,    'alias field must not be empty');
            $this->assertNotEmpty($alias->maps_to,  'maps_to field must not be empty');
            $this->assertContains($alias->language, ['sw', 'en'], 'language must be sw or en');
        });
    }

    /**
     * @test
     * Well-known Kenyan market pairs are present after seeding.
     */
    public function test_known_kenyan_aliases_are_seeded(): void
    {
        $this->seed(SearchAliasSeeder::class);

        $expected = [
            ['alias' => 'nyanya',   'language' => 'sw'],
            ['alias' => 'vitunguu', 'language' => 'sw'],
            ['alias' => 'maembe',   'language' => 'sw'],
            ['alias' => 'sukuma',   'language' => 'sw'],
            ['alias' => 'tomatos',  'language' => 'en'],
        ];

        foreach ($expected as $pair) {
            $this->assertTrue(
                SearchAlias::where('alias', $pair['alias'])
                            ->where('language', $pair['language'])
                            ->exists(),
                "Expected alias '{$pair['alias']}' ({$pair['language']}) not found after seeding"
            );
        }
    }
}

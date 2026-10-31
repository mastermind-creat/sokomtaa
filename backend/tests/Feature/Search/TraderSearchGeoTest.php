<?php

namespace Tests\Feature\Search;

use App\Models\Market;
use App\Models\Trader;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Regression cover for the geolocated trader search.
 *
 * This endpoint backs the AI assistant's search_traders tool, which always
 * appends the user's coordinates. The distance branch joins `markets` onto
 * `traders`, so an unqualified `*` in the select pulled in two `id` columns:
 * MySQL rejected the paginate() count subquery outright (HTTP 500) and, on
 * drivers that tolerate it, the market's id silently replaced the trader's —
 * which then pointed the follow-up product lookup at the wrong record.
 */
class TraderSearchGeoTest extends TestCase
{
    use RefreshDatabase;

    private const LAT = -1.2920659;
    private const LNG = 36.8219462;

    private Market $market;
    private Trader $trader;

    protected function setUp(): void
    {
        parent::setUp();

        $user = User::create([
            'name'           => 'Peter Mwangi',
            'phone'          => '+254733333333',
            'email'          => 'peter@sokomtaa.co.ke',
            'password'       => Hash::make('Secret123!'),
            'role'           => 'trader',
            'phone_verified' => true,
        ]);

        // A decoy market keeps market ids ahead of trader ids, so a row whose
        // id matches the market id is distinguishable from a correct one.
        Market::create([
            'name'     => 'Toi Market',
            'location' => 'Kibera, Nairobi',
            'county'   => 'Nairobi',
            'estate'   => 'Kibera',
        ]);

        $this->market = Market::create([
            'name'      => 'Gikomba Market',
            'location'  => 'Gikomba, Nairobi',
            'county'    => 'Nairobi',
            'estate'    => 'Gikomba',
            'latitude'  => self::LAT,
            'longitude' => self::LNG,
            'is_active' => true,
        ]);

        $this->trader = Trader::create([
            'user_id'             => $user->id,
            'market_id'           => $this->market->id,
            'business_name'       => 'Tech Safi Store',
            'verification_status' => 'verified',
            'is_open'             => true,
        ]);
    }

    private function search(array $params)
    {
        return $this->getJson('/api/traders/search?' . http_build_query($params));
    }

    public function test_geolocated_search_returns_the_trader_without_erroring(): void
    {
        $response = $this->search([
            'q'   => 'Tech Safi',
            'lat' => self::LAT,
            'lng' => self::LNG,
        ]);

        $response->assertOk();

        $rows = $response->json('data.data');

        $this->assertCount(1, $rows);
        $this->assertSame('Tech Safi Store', $rows[0]['business_name']);
        $this->assertArrayHasKey('distance_km', $rows[0]);
        $this->assertEqualsWithDelta(0.0, (float) $rows[0]['distance_km'], 0.5);
    }

    public function test_geolocated_search_returns_the_trader_id_not_the_market_id(): void
    {
        $response = $this->search([
            'q'   => 'Tech Safi',
            'lat' => self::LAT,
            'lng' => self::LNG,
        ]);

        $response->assertOk();

        $row = $response->json('data.data.0');

        $this->assertNotSame($this->market->id, $this->trader->id, 'fixture must keep the ids distinct');
        $this->assertSame($this->trader->id, $row['id']);
        $this->assertSame($this->market->id, $row['market_id']);
    }

    public function test_radius_outside_the_trader_returns_an_empty_page(): void
    {
        $response = $this->search([
            'q'      => 'Tech Safi',
            'lat'    => 51.5074,
            'lng'    => -0.1278,
            'radius' => 1,
        ]);

        $response->assertOk();
        $this->assertSame([], $response->json('data.data'));
    }

    public function test_market_filter_is_not_escaped_by_the_name_or_clause(): void
    {
        $otherMarket = Market::create([
            'name'     => 'Kawangware Market',
            'location' => 'Kawangware, Nairobi',
            'county'   => 'Nairobi',
            'estate'   => 'Kawangware',
        ]);

        $response = $this->search([
            'q'         => 'Tech Safi',
            'market_id' => $otherMarket->id,
        ]);

        $response->assertOk();
        $this->assertSame([], $response->json('data.data'));
    }

    public function test_soft_deleted_traders_are_excluded(): void
    {
        $removed = Trader::create([
            'user_id'             => $this->trader->user_id,
            'market_id'           => $this->market->id,
            'business_name'       => 'Tech Safi Store (closed)',
            'verification_status' => 'verified',
        ]);
        $removed->delete();

        $response = $this->search(['q' => 'Tech Safi']);

        $response->assertOk();
        $this->assertSame(
            ['Tech Safi Store'],
            array_column($response->json('data.data'), 'business_name')
        );
    }

    public function test_plain_search_without_coordinates_still_works(): void
    {
        $response = $this->search(['q' => 'Tech']);

        $response->assertOk();
        $this->assertSame($this->trader->id, $response->json('data.data.0.id'));
    }
}

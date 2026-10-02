<?php

namespace Tests\Unit\Polyglot;

use App\Models\Market;
use App\Models\Stall;
use App\Services\GeoService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

/**
 * Checkpoint 3 — Laravel layer: GeoService unit tests
 *
 * Tests Redis GEO sync (addTraderToGeo / removeTraderFromGeo) and that
 * maintenance stalls are excluded from viewport results.
 */
class GeoServiceTest extends TestCase
{
    use RefreshDatabase;

    private GeoService $geoService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->geoService = new GeoService;
        Redis::flushdb();
    }

    public function test_add_trader_to_geo_writes_to_redis(): void
    {
        $this->geoService->addTraderToGeo(42, 34.7679, -0.0917);

        $pos = Redis::geopos(GeoService::ACTIVE_TRADERS, '42');
        $this->assertNotNull($pos[0], 'Stall 42 must be present in active_traders after addTraderToGeo');
    }

    public function test_remove_trader_from_geo_deletes_from_redis(): void
    {
        $this->geoService->addTraderToGeo(42, 34.7679, -0.0917);
        $this->geoService->removeTraderFromGeo(42);

        $members = Redis::zrange(GeoService::ACTIVE_TRADERS, 0, -1);
        $this->assertNotContains('42', $members, 'Stall must not be in active_traders after removeTraderFromGeo');
    }

    public function test_maintenance_stalls_excluded_from_viewport(): void
    {
        $market = Market::create([
            'name'      => 'Test Market',
            'location'  => 'Kisumu',
            'county'    => 'Kisumu',
            'estate'    => 'Kolenyo',
            'is_active' => true,
        ]);

        Stall::create([
            'market_id'    => $market->id,
            'stall_number' => 'M1',
            'zone'         => 'A',
            'status'       => 'maintenance',
            'monthly_fee'  => 1500,
            'location'     => json_encode(['lat' => -0.0917, 'lon' => 34.7679]),
        ]);

        Stall::create([
            'market_id'    => $market->id,
            'stall_number' => 'A1',
            'zone'         => 'A',
            'status'       => 'occupied',
            'monthly_fee'  => 1500,
            'location'     => json_encode(['lat' => -0.0918, 'lon' => 34.7680]),
        ]);

        $results = $this->geoService->stallsWithinViewport(34.7, -0.1, 34.8, 0);

        $statuses = $results->pluck('status')->all();
        $this->assertNotContains('maintenance', $statuses);
    }

    public function test_open_close_redis_round_trip(): void
    {
        // Open the stall — must appear in active_traders
        $this->geoService->addTraderToGeo(10, 34.7679, -0.0917);
        $members = Redis::zrange(GeoService::ACTIVE_TRADERS, 0, -1);
        $this->assertContains('10', $members, 'Stall must appear in active_traders after open');

        // Close the stall — must be absent from active_traders
        $this->geoService->removeTraderFromGeo(10);
        $members = Redis::zrange(GeoService::ACTIVE_TRADERS, 0, -1);
        $this->assertNotContains('10', $members, 'Stall must be absent from active_traders after close');
    }

    public function test_geoadd_overwrites_previous_position(): void
    {
        $this->geoService->addTraderToGeo(5, 34.7000, -0.0900);
        $this->geoService->addTraderToGeo(5, 34.8000, -0.0800);

        // Only one entry for stall 5
        $count = Redis::zcount(GeoService::ACTIVE_TRADERS, '-inf', '+inf');
        $this->assertEquals(1, $count, 'GEOADD must overwrite, not append');
    }
}

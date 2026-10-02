<?php

namespace Tests\Feature\Polyglot;

use App\Models\Market;
use App\Models\Stall;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Checkpoint 3 — Laravel layer: GET /api/map/stalls
 *
 * Verifies:
 * - HTTP 422 on out-of-range and inverted bounding boxes (Req 2.5, 2.6)
 * - HTTP 200 with stall list on valid bbox (Req 2.1, 2.2)
 * - Maintenance stalls are excluded (Req 2.4)
 * - Authentication is required (Req 14.4)
 */
class StallMapControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['role' => 'resident']);
    }

    // ── Validation: out-of-range coordinates ─────────────────────────────────

    public function test_returns_422_when_lon_out_of_range(): void
    {
        $this->actingAs($this->user)
            ->getJson('/api/map/stalls?min_lon=-200&min_lat=-1&max_lon=35&max_lat=1')
            ->assertStatus(422);
    }

    public function test_returns_422_when_lat_out_of_range(): void
    {
        $this->actingAs($this->user)
            ->getJson('/api/map/stalls?min_lon=34&min_lat=-100&max_lon=35&max_lat=1')
            ->assertStatus(422);
    }

    public function test_returns_422_when_max_lon_out_of_range(): void
    {
        $this->actingAs($this->user)
            ->getJson('/api/map/stalls?min_lon=34&min_lat=-1&max_lon=200&max_lat=1')
            ->assertStatus(422);
    }

    public function test_returns_422_when_max_lat_out_of_range(): void
    {
        $this->actingAs($this->user)
            ->getJson('/api/map/stalls?min_lon=34&min_lat=-1&max_lon=35&max_lat=95')
            ->assertStatus(422);
    }

    // ── Validation: inverted bounding box ────────────────────────────────────

    public function test_returns_422_when_bbox_is_inverted_lon(): void
    {
        // max_lon <= min_lon
        $this->actingAs($this->user)
            ->getJson('/api/map/stalls?min_lon=35&min_lat=-1&max_lon=34&max_lat=1')
            ->assertStatus(422)
            ->assertJsonPath('code', 'VALIDATION_ERROR');
    }

    public function test_returns_422_when_bbox_is_inverted_lat(): void
    {
        // max_lat <= min_lat
        $this->actingAs($this->user)
            ->getJson('/api/map/stalls?min_lon=34&min_lat=1&max_lon=35&max_lat=-1')
            ->assertStatus(422)
            ->assertJsonPath('code', 'VALIDATION_ERROR');
    }

    public function test_returns_422_when_bbox_params_missing(): void
    {
        $this->actingAs($this->user)
            ->getJson('/api/map/stalls')
            ->assertStatus(422);
    }

    // ── Authentication ────────────────────────────────────────────────────────

    public function test_requires_authentication(): void
    {
        $this->getJson('/api/map/stalls?min_lon=34&min_lat=-1&max_lon=35&max_lat=1')
            ->assertStatus(401);
    }

    // ── Valid bbox returns results ────────────────────────────────────────────

    public function test_returns_200_with_stalls_in_valid_bbox(): void
    {
        $market = Market::create([
            'name'      => 'Test Market',
            'location'  => 'Test Location',
            'county'    => 'Kisumu',
            'estate'    => 'Kolenyo',
            'is_active' => true,
        ]);

        // Stall with location stored as JSON (SQLite fallback in tests)
        Stall::create([
            'market_id'    => $market->id,
            'stall_number' => 'A1',
            'zone'         => 'A',
            'status'       => 'occupied',
            'monthly_fee'  => 1500,
            'location'     => json_encode(['lat' => -0.0917, 'lon' => 34.7679]),
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/map/stalls?min_lon=34.7&min_lat=-0.1&max_lon=34.8&max_lat=0');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['success', 'message', 'data']);
    }

    public function test_excludes_maintenance_stalls_from_response(): void
    {
        $market = Market::create([
            'name'      => 'Test Market',
            'location'  => 'Test Location',
            'county'    => 'Kisumu',
            'estate'    => 'Kolenyo',
            'is_active' => true,
        ]);

        // One maintenance stall, one available stall — both within bbox
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
            'stall_number' => 'A2',
            'zone'         => 'A',
            'status'       => 'available',
            'monthly_fee'  => 1500,
            'location'     => json_encode(['lat' => -0.0918, 'lon' => 34.7680]),
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/map/stalls?min_lon=34.7&min_lat=-0.1&max_lon=34.8&max_lat=0');

        $response->assertStatus(200);

        $data = $response->json('data');
        $statuses = array_column($data, 'status');

        $this->assertNotContains('maintenance', $statuses, 'Maintenance stalls must never appear in map results');
    }

    public function test_response_stalls_contain_required_fields(): void
    {
        $market = Market::create([
            'name'      => 'Test Market',
            'location'  => 'Test Location',
            'county'    => 'Kisumu',
            'estate'    => 'Kolenyo',
            'is_active' => true,
        ]);

        Stall::create([
            'market_id'    => $market->id,
            'stall_number' => 'B1',
            'zone'         => 'B',
            'status'       => 'occupied',
            'monthly_fee'  => 1200,
            'location'     => json_encode(['lat' => -0.0917, 'lon' => 34.7679]),
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/map/stalls?min_lon=34.7&min_lat=-0.1&max_lon=34.8&max_lat=0');

        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertNotEmpty($data);

        foreach ($data as $stall) {
            $this->assertArrayHasKey('id', $stall);
            $this->assertArrayHasKey('status', $stall);
            $this->assertArrayHasKey('stall_number', $stall);
        }
    }

    public function test_returns_empty_array_when_no_stalls_in_bbox(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/map/stalls?min_lon=0&min_lat=0&max_lon=1&max_lat=1');

        $response->assertStatus(200)
            ->assertJsonPath('data', []);
    }
}

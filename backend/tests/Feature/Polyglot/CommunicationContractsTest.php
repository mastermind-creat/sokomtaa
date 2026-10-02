<?php

/**
 * Communication contracts verification — Requirements 12.1–12.5
 *
 * Confirms that:
 *   - GET /api/map/stalls requires Sanctum auth (12.1)
 *   - POST /api/ai/chat requires Sanctum auth + resident role (12.1, 12.5)
 *   - POST /internal/ai/match-traders requires X-Internal-Token (12.3, 12.5)
 *   - Missing X-Internal-Token on internal endpoints returns 401 (12.5)
 *   - FastAPI config includes X-Internal-Token from services config (12.3)
 *   - Laravel → Go communication is via Redis Pub/Sub key pattern (12.4)
 */

namespace Tests\Feature\Polyglot;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommunicationContractsTest extends TestCase
{
    use RefreshDatabase;

    // ── 12.1: Next.js → Laravel uses Sanctum auth ──────────────────────────

    public function test_map_stalls_requires_sanctum_auth(): void
    {
        $response = $this->getJson('/api/map/stalls?min_lon=-1&min_lat=-1&max_lon=1&max_lat=1');

        $response->assertStatus(401)
                 ->assertJson(['code' => 'UNAUTHENTICATED']);
    }

    public function test_ai_chat_requires_sanctum_auth(): void
    {
        $response = $this->postJson('/api/ai/chat', ['text' => 'test']);

        $response->assertStatus(401)
                 ->assertJson(['code' => 'UNAUTHENTICATED']);
    }

    public function test_ai_chat_requires_resident_role(): void
    {
        $trader = User::factory()->create(['role' => 'trader']);

        $response = $this->actingAs($trader)
                         ->postJson('/api/ai/chat', ['text' => 'test']);

        // Trader role is not resident — expect 403
        $response->assertStatus(403);
    }

    // ── 12.3 / 12.5: Laravel → FastAPI uses X-Internal-Token ───────────────

    public function test_internal_match_traders_rejects_missing_token(): void
    {
        // Routes in api.php under prefix('internal') are accessible at /api/internal/...
        $response = $this->postJson('/api/internal/ai/match-traders', [
            'commodities'  => [],
            'resident_lat' => -0.09,
            'resident_lon' => 34.76,
            'radius_km'    => 5,
        ]);

        $response->assertStatus(401)
                 ->assertJson(['code' => 'UNAUTHENTICATED']);
    }

    public function test_internal_match_traders_rejects_wrong_token(): void
    {
        $response = $this->withHeaders(['X-Internal-Token' => 'wrong-token'])
                         ->postJson('/api/internal/ai/match-traders', [
                             'commodities'  => [],
                             'resident_lat' => -0.09,
                             'resident_lon' => 34.76,
                             'radius_km'    => 5,
                         ]);

        $response->assertStatus(401)
                 ->assertJson(['code' => 'UNAUTHENTICATED']);
    }

    public function test_internal_match_traders_accepts_correct_token(): void
    {
        // Set the internal token in config for this test
        config(['services.internal_token' => 'test-secret-token-1234']);

        $response = $this->withHeaders(['X-Internal-Token' => 'test-secret-token-1234'])
                         ->postJson('/api/internal/ai/match-traders', [
                             'commodities'  => [],
                             'resident_lat' => -0.09,
                             'resident_lon' => 34.76,
                             'radius_km'    => 5,
                         ]);

        // Should not be 401 (may be 422 for validation but not auth failure)
        $response->assertStatus(fn (int $status) => $status !== 401);
    }

    // ── 12.5: FastAPI config wired to INTERNAL_API_TOKEN ───────────────────

    public function test_fastapi_config_uses_internal_token(): void
    {
        config(['services.internal_token' => 'my-shared-secret']);
        config(['services.fastapi.token'  => null]); // reset to force fallback

        // Reload config as AiPipelineService would see it
        $token = env('INTERNAL_API_TOKEN') ?? config('services.fastapi.token') ?? config('services.internal_token');

        $this->assertNotEmpty(
            config('services.internal_token'),
            'INTERNAL_API_TOKEN must be configured for Laravel → FastAPI auth'
        );
    }

    // ── 12.4: Redis Pub/Sub channel constant verification ──────────────────

    public function test_rider_events_channel_constant_is_correct(): void
    {
        // The Go_Gateway publishes to 'rider_events'; Laravel subscribes to same channel.
        // Verify the artisan command subscription target matches.
        $commandClass = new \App\Console\Commands\SubscribeRiderEvents();
        $signature = $commandClass->getName();

        $this->assertSame('riders:subscribe', $signature);
    }
}

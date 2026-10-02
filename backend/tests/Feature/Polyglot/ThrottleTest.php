<?php

/**
 * Throttle middleware verification
 *
 * Confirms that:
 *   - GET /api/map/stalls is throttled at 60 requests per minute (Requirement 14.4)
 *   - POST /api/ai/chat is throttled at 10 requests per minute (Requirement 14.5)
 *
 * We use RateLimiter::clear() to reset between tests so they don't bleed.
 */

namespace Tests\Feature\Polyglot;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class ThrottleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Clear all rate limiter buckets before each test
        RateLimiter::clear('api');
    }

    // ── GET /api/map/stalls: throttle:60,1 ────────────────────────────────

    public function test_map_stalls_returns_429_after_60_requests(): void
    {
        $user = User::factory()->create(['role' => 'resident']);

        $params = '?min_lon=34.76&min_lat=-0.10&max_lon=34.78&max_lat=-0.08';

        // The first 60 requests should not be rate-limited (may fail for
        // other reasons like DB, but must not be 429).
        for ($i = 0; $i < 60; $i++) {
            $response = $this->actingAs($user)
                             ->getJson('/api/map/stalls' . $params);

            $this->assertNotEquals(
                429,
                $response->getStatusCode(),
                "Request #{$i} was rate-limited before hitting the limit of 60."
            );
        }

        // The 61st request must be rate-limited.
        $response = $this->actingAs($user)
                         ->getJson('/api/map/stalls' . $params);

        $response->assertStatus(429);
    }

    // ── POST /api/ai/chat: throttle:10,1 ─────────────────────────────────

    public function test_ai_chat_returns_429_after_10_requests(): void
    {
        $resident = User::factory()->create(['role' => 'resident']);

        for ($i = 0; $i < 10; $i++) {
            $response = $this->actingAs($resident)
                             ->postJson('/api/ai/chat', ['text' => 'test']);

            $this->assertNotEquals(
                429,
                $response->getStatusCode(),
                "Request #{$i} was rate-limited before hitting the limit of 10."
            );
        }

        // The 11th request must be rate-limited.
        $response = $this->actingAs($resident)
                         ->postJson('/api/ai/chat', ['text' => 'test']);

        $response->assertStatus(429);
    }

    // ── Different users have separate rate-limit buckets ─────────────────

    public function test_throttle_is_per_user_not_global(): void
    {
        $userA = User::factory()->create(['role' => 'resident']);
        $userB = User::factory()->create(['role' => 'resident']);

        $params = '?min_lon=34.76&min_lat=-0.10&max_lon=34.78&max_lat=-0.08';

        // Exhaust userA's limit
        for ($i = 0; $i <= 60; $i++) {
            $this->actingAs($userA)->getJson('/api/map/stalls' . $params);
        }

        // userB must NOT be rate-limited
        $response = $this->actingAs($userB)
                         ->getJson('/api/map/stalls' . $params);

        $this->assertNotEquals(429, $response->getStatusCode());
    }
}

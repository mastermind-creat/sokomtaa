<?php

namespace Tests\Feature\Polyglot;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Checkpoint 3 — Laravel layer: InternalApiAuth middleware
 *
 * Verifies:
 * - POST /internal/ai/match-traders rejects requests with missing token (Req 8.6, 14.3)
 * - POST /internal/ai/match-traders rejects requests with wrong token
 * - POST /internal/ai/match-traders accepts valid token
 */
class InternalApiAuthTest extends TestCase
{
    use RefreshDatabase;

    private string $validToken = 'test-internal-token';

    public function test_rejects_request_with_no_token(): void
    {
        $this->postJson('/api/internal/ai/match-traders', [
            'commodities'    => [['name' => 'tomatoes', 'quantity' => 1, 'unit' => 'kg']],
            'resident_lat'   => -0.0917,
            'resident_lon'   => 34.7679,
        ])->assertStatus(401)
          ->assertJsonPath('code', 'UNAUTHENTICATED');
    }

    public function test_rejects_request_with_wrong_token(): void
    {
        $this->postJson('/api/internal/ai/match-traders', [
            'commodities'    => [['name' => 'tomatoes', 'quantity' => 1, 'unit' => 'kg']],
            'resident_lat'   => -0.0917,
            'resident_lon'   => 34.7679,
        ], ['X-Internal-Token' => 'wrong-token'])
          ->assertStatus(401)
          ->assertJsonPath('code', 'UNAUTHENTICATED');
    }

    public function test_accepts_request_with_valid_token(): void
    {
        $this->postJson('/api/internal/ai/match-traders', [
            'commodities'  => [['name' => 'tomatoes', 'quantity' => 1, 'unit' => 'kg']],
            'resident_lat' => -0.0917,
            'resident_lon' => 34.7679,
        ], ['X-Internal-Token' => $this->validToken])
          ->assertStatus(200)
          ->assertJsonPath('success', true);
    }
}

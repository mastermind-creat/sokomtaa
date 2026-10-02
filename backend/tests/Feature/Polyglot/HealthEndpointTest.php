<?php

namespace Tests\Feature\Polyglot;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Checkpoint 3 — Laravel layer: health endpoint
 * Verifies GET /api/health returns all-green with HTTP 200.
 */
class HealthEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_returns_200_when_db_is_reachable(): void
    {
        $response = $this->getJson('/api/health');

        // SQLite in-memory is always reachable; Redis will be mocked via array driver
        $response->assertStatus(200)
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('db', 'ok');
    }

    public function test_health_response_contains_required_keys(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertJsonStructure(['status', 'db', 'redis']);
    }

    public function test_health_is_unauthenticated(): void
    {
        // Health endpoint must work without a Sanctum token
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)->assertJsonPath('db', 'ok');
    }
}

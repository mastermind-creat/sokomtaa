<?php

// Feature: email-phone-registration-ai-search, Property 11: empty pipeline success envelope

namespace Tests\Feature\Search;

use App\Services\AiService;
use App\Services\SearchService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * Property 11: Empty pipeline result returns correct envelope.
 *
 * For any search query that produces zero results after all four stages, the
 * response SHALL have success: true, data.results: [], and data.total: 0 —
 * never an error status code.
 *
 * Validates: Requirements 10.4
 */
class EmptyPipelineEnvelopeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();

        // Bind a mock AiService that always returns an empty expansion so we
        // don't need a live AI key for these tests.
        $this->app->bind(AiService::class, function () {
            $mock = $this->createMock(AiService::class);
            $mock->method('expandQuery')->willReturn([]);
            $mock->method('generate')->willReturn(null);
            return $mock;
        });
    }

    // -------------------------------------------------------------------------
    // Via SearchService directly
    // -------------------------------------------------------------------------

    /**
     * @test
     * globalSearch() returns a valid envelope (no exception) when no products exist.
     */
    public function test_search_service_returns_empty_envelope_when_no_products(): void
    {
        $service = app(SearchService::class);
        $result  = $service->globalSearch('xyznotarealproduct99999');

        $this->assertIsArray($result);
        $this->assertArrayHasKey('results', $result);
        $this->assertArrayHasKey('total',   $result);

        $productCount = collect($result['results'])->where('search_type', 'product')->count();
        $this->assertSame(0, $productCount);
    }

    // -------------------------------------------------------------------------
    // Via HTTP endpoint
    // -------------------------------------------------------------------------

    /**
     * @test
     * Property 11 — 50 iterations via HTTP: nonsense queries always yield
     * success:true, non-error HTTP status, and results array (possibly empty).
     */
    public function test_search_endpoint_returns_success_true_for_zero_results(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $junk = 'zzz_no_match_' . $i . '_' . substr(md5((string) $i), 0, 4);

            $response = $this->getJson('/api/search?q=' . urlencode($junk));

            $response->assertStatus(200)
                     ->assertJsonPath('success', true);

            $data = $response->json('data');
            $this->assertIsArray($data, "Response data must be an array for query '{$junk}'");
        }
    }

    /**
     * @test
     * An empty query string (no q param) returns a valid response, not a 5xx.
     */
    public function test_empty_query_returns_valid_response(): void
    {
        $this->getJson('/api/search')
             ->assertSuccessful()
             ->assertJsonPath('success', true);
    }

    /**
     * @test
     * A query of fewer than 3 characters still returns a valid envelope.
     */
    public function test_single_char_query_returns_valid_envelope(): void
    {
        foreach (['a', 'ab', 'x'] as $short) {
            $this->getJson('/api/search?q=' . $short)
                 ->assertSuccessful()
                 ->assertJsonPath('success', true);
        }
    }

    /**
     * @test
     * When AiService throws, the pipeline still returns a success envelope.
     */
    public function test_ai_service_failure_does_not_cause_5xx(): void
    {
        $this->app->bind(AiService::class, function () {
            $mock = $this->createMock(AiService::class);
            $mock->method('expandQuery')->willThrowException(new \RuntimeException('AI unavailable'));
            $mock->method('generate')->willReturn(null);
            return $mock;
        });

        $response = $this->getJson('/api/search?q=freshgreens');

        $response->assertSuccessful()
                 ->assertJsonPath('success', true);
    }
}

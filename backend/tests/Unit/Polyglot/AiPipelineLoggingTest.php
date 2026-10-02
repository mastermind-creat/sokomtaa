<?php

/**
 * AiPipelineService — PII redaction and structured logging verification
 *
 * Requirement 13.6: When Laravel receives a 5xx from FastAPI it logs to the
 * 'fastapi' channel including the request payload with PII 'text' fields
 * redacted.
 *
 * Requirement 14.7: FastAPI must never log the contents of 'text' fields.
 * On the Laravel side we verify the redaction happens before the log call.
 */

namespace Tests\Unit\Polyglot;

use App\Services\AiPipelineService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class AiPipelineLoggingTest extends TestCase
{
    private AiPipelineService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new AiPipelineService();
        config(['services.fastapi.url'   => 'http://fake-fastapi:8001']);
        config(['services.fastapi.token' => 'test-token']);
    }

    public function test_text_field_is_redacted_from_log_on_fastapi_error(): void
    {
        // Simulate a FastAPI 500 response
        Http::fake([
            'http://fake-fastapi:8001/ai/parse-recipe' => Http::response(['error' => 'oops'], 500),
        ]);

        Log::shouldReceive('channel')
            ->with('fastapi')
            ->andReturnSelf();

        // The log call must NOT include 'text' in the payload
        Log::shouldReceive('error')
            ->once()
            ->withArgs(function (string $message, array $context) {
                // 'text' must NOT appear in the logged payload
                $payload = $context['payload'] ?? [];
                return !array_key_exists('text', $payload);
            });

        try {
            $this->service->callFastApi('/ai/parse-recipe', [
                'text'    => 'I want to cook ugali for 10 people — PRIVATE DATA',
                'user_id' => 42,
            ]);
        } catch (\Throwable) {
            // Exception is expected — we only care about the log assertion above
        }
    }

    public function test_text_field_is_redacted_on_connection_exception(): void
    {
        Http::fake([
            'http://fake-fastapi:8001/ai/parse-recipe' => function () {
                throw new ConnectionException('Connection refused');
            },
        ]);

        Log::shouldReceive('channel')
            ->with('fastapi')
            ->andReturnSelf();

        Log::shouldReceive('error')
            ->once()
            ->withArgs(function (string $message, array $context) {
                $payload = $context['payload'] ?? [];
                return !array_key_exists('text', $payload);
            });

        try {
            $this->service->callFastApi('/ai/parse-recipe', [
                'text'    => 'Chapati for 5 — PRIVATE DATA',
                'user_id' => 7,
            ]);
        } catch (\Throwable) {
            // expected
        }
    }

    public function test_fastapi_channel_is_used_not_default(): void
    {
        Http::fake([
            'http://fake-fastapi:8001/ai/parse-recipe' => Http::response([], 503),
        ]);

        // Verify that Log::channel('fastapi') is called (not the default channel)
        Log::shouldReceive('channel')
            ->once()
            ->with('fastapi')
            ->andReturnSelf();

        Log::shouldReceive('error')->once();

        try {
            $this->service->callFastApi('/ai/parse-recipe', ['user_id' => 1]);
        } catch (\Throwable) {
            // expected
        }
    }
}

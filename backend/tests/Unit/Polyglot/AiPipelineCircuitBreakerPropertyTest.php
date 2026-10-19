<?php

// Feature: polyglot-architecture-upgrade, Property 26: Circuit-Breaker Timeout on FastAPI Unavailability
// Validates: Requirements 12.7

use App\Exceptions\ServiceUnavailableException;
use App\Services\AiPipelineService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

beforeEach(function () {
    Config::set('services.fastapi.url', 'http://127.0.0.1:8001');
    Config::set('services.fastapi.token', 'test_secret_token');
});

it('throws ServiceUnavailableException on connection exception without hanging', function () {
    Http::fake([
        'http://127.0.0.1:8001/*' => fn () => throw new ConnectionException('Connection timed out after 5000ms'),
    ]);

    $service = new AiPipelineService();

    expect(fn () => $service->callFastApi('/ai/parse-recipe', ['text' => 'Cook ugali for 4 people', 'user_id' => 1]))
        ->toThrow(ServiceUnavailableException::class, 'AI service is temporarily unavailable');
});

it('throws ServiceUnavailableException on HTTP 5xx responses across status codes 500, 502, 503, 504', function (int $statusCode) {
    Http::fake([
        'http://127.0.0.1:8001/*' => Http::response(['error' => 'Service degraded'], $statusCode),
    ]);

    $service = new AiPipelineService();

    expect(fn () => $service->callFastApi('/ai/match-traders', ['session_id' => 'abc', 'radius_km' => 5]))
        ->toThrow(ServiceUnavailableException::class, 'AI service returned an error');
})->with([500, 502, 503, 504]);

it('redacts text field from logged payload on error', function () {
    $loggedContext = null;
    Log::shouldReceive('channel')
        ->with('fastapi')
        ->andReturnSelf();
    Log::shouldReceive('error')
        ->andReturnUsing(function ($message, $context) use (&$loggedContext) {
            $loggedContext = $context;
        });

    Http::fake([
        'http://127.0.0.1:8001/*' => Http::response(['error' => 'Failed'], 500),
    ]);

    $service = new AiPipelineService();

    try {
        $service->callFastApi('/ai/parse-recipe', [
            'text' => 'Confidential personal meal request with 10 people',
            'user_id' => 42,
        ]);
    } catch (ServiceUnavailableException) {
        // Expected
    }

    expect($loggedContext)->not->toBeNull();
    expect($loggedContext['payload'])->toHaveKey('user_id');
    expect($loggedContext['payload'])->not->toHaveKey('text');
});

<?php

// Feature: paypal-payment-integration
// Property 1: OAuth Token Caching
// Validates: Requirements 1.4

use App\Services\PayPalService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

it('only requests a new token once across multiple generateToken() calls within cache TTL', function () {
    Http::fake([
        '*/v1/oauth2/token' => Http::response(
            ['access_token' => 'test_token_' . rand(1000, 9999), 'token_type' => 'Bearer'],
            200
        ),
    ]);

    Cache::flush();

    $service = new PayPalService(
        clientId: 'test_client',
        clientSecret: 'test_secret',
        baseUrl: 'https://api-m.sandbox.paypal.com',
        kesToUsdRate: 0.0077,
        webhookId: 'test_webhook'
    );

    $token1 = $service->generateToken();
    $token2 = $service->generateToken();

    // Both calls must return the same token value
    expect($token1)->toBe($token2);

    // Only one real HTTP call should have been made (second was served from cache)
    Http::assertSentCount(1);
})->repeat(10);

it('throws PaymentFailedException when PayPal token endpoint returns an error', function () {
    Http::fake([
        '*/v1/oauth2/token' => Http::response(['error' => 'invalid_client'], 401),
    ]);

    Cache::flush();

    $service = new PayPalService(
        clientId: 'bad_client',
        clientSecret: 'bad_secret',
        baseUrl: 'https://api-m.sandbox.paypal.com',
        kesToUsdRate: 0.0077,
        webhookId: 'test_webhook'
    );

    expect(fn () => $service->generateToken())
        ->toThrow(\App\Exceptions\PaymentFailedException::class);
});

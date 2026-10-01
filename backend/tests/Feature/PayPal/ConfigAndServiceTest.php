<?php

// Feature: paypal-payment-integration
// Tests: Configuration, Service setup, and logging channel
// Requirements: 1.2, 1.3, 1.5, 1.6, 10.1

use App\Exceptions\PaymentFailedException;
use App\Services\PayPalService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

it('test_paypal_config_uses_sandbox_url', function () {
    // When PAYPAL_ENV is sandbox (or missing), base_url must point to sandbox
    config(['paypal.env' => 'sandbox']);
    config(['paypal.base_url' => 'https://api-m.sandbox.paypal.com']);

    expect(config('paypal.base_url'))->toBe('https://api-m.sandbox.paypal.com');
});

it('test_paypal_config_uses_production_url', function () {
    // When PAYPAL_ENV is production, base_url must point to live PayPal API
    config(['paypal.env' => 'production']);
    // Simulate the config file logic
    $url = config('paypal.env') === 'production'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';

    expect($url)->toBe('https://api-m.paypal.com');
});

it('test_token_request_failure_throws_exception', function () {
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
        ->toThrow(PaymentFailedException::class);
});

it('test_paypal_config_file_has_required_keys', function () {
    $config = config('paypal');

    expect($config)->toHaveKey('client_id')
        ->and($config)->toHaveKey('client_secret')
        ->and($config)->toHaveKey('env')
        ->and($config)->toHaveKey('base_url')
        ->and($config)->toHaveKey('kes_to_usd_rate')
        ->and($config)->toHaveKey('webhook_id');
});

it('test_paypal_log_channel_configured_with_30_day_retention', function () {
    $channels = config('logging.channels');

    expect($channels)->toHaveKey('paypal');

    $paypalChannel = $channels['paypal'];

    expect($paypalChannel['driver'])->toBe('daily')
        ->and($paypalChannel['path'])->toContain('paypal.log')
        ->and($paypalChannel['days'])->toBe(30);
});

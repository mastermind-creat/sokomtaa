<?php

// Feature: paypal-payment-integration
// Property 2: Amount Calculation and KES→USD Conversion
// Validates: Requirements 2.3, 2.4, 9.1, 9.2

use App\Services\PayPalService;
use App\Exceptions\PaymentFailedException;

function makePayPalService(float $rate = 0.0077): PayPalService
{
    return new PayPalService(
        clientId: 'test_client',
        clientSecret: 'test_secret',
        baseUrl: 'https://api-m.sandbox.paypal.com',
        kesToUsdRate: $rate,
        webhookId: 'test_webhook'
    );
}

it('converts KES to USD correctly for any amount and rate', function (float $kesAmount, float $rate) {
    $service = makePayPalService($rate);
    $result  = $service->convertKesToUsd($kesAmount);

    expect($result)->toBe(round($kesAmount * $rate, 2));
})->with(function () {
    $cases = [];
    for ($i = 0; $i < 100; $i++) {
        $cases[] = [
            rand(100, 500000) / 10.0,   // KES amount: 10 – 50,000
            rand(50, 150) / 10000.0,    // rate: 0.0050 – 0.0150
        ];
    }
    return $cases;
});

it('rounds USD result to exactly 2 decimal places', function () {
    $service = makePayPalService(0.0077);
    $result  = $service->convertKesToUsd(1234.56);

    // Result must have at most 2 decimal places
    expect(round($result, 2))->toBe($result);
});

it('throws PaymentFailedException when rate is zero', function () {
    $service = makePayPalService(0.0);
    expect(fn () => $service->convertKesToUsd(1000))
        ->toThrow(PaymentFailedException::class, 'PayPal exchange rate is not configured');
});

it('throws PaymentFailedException when rate is not configured', function () {
    // Simulate missing env — pass 0 which is the falsy default
    $service = new PayPalService(
        clientId: 'test',
        clientSecret: 'test',
        baseUrl: 'https://api-m.sandbox.paypal.com',
        kesToUsdRate: 0,
        webhookId: 'test'
    );

    expect(fn () => $service->convertKesToUsd(500))
        ->toThrow(PaymentFailedException::class);
});

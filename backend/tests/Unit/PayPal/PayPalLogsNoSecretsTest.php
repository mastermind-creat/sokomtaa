<?php

// Feature: paypal-payment-integration
// Property 11: Logs Never Expose Secrets
// Validates: Requirements 10.5

use App\Exceptions\PaymentFailedException;
use App\Services\PayPalService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

it('never writes PAYPAL_CLIENT_SECRET or bearer tokens to the paypal log channel', function () {
    $clientSecret = 'SUPER_SECRET_' . strtoupper(uniqid());
    $accessToken  = 'ACCESS_TOKEN_' . strtoupper(uniqid());

    // Capture log messages written to the paypal channel
    $loggedMessages = [];

    Log::shouldReceive('channel')
        ->with('paypal')
        ->andReturnUsing(function () use (&$loggedMessages, $clientSecret, $accessToken) {
            $logger = Mockery::mock(\Psr\Log\LoggerInterface::class);

            foreach (['info', 'error', 'warning', 'debug'] as $level) {
                $logger->shouldReceive($level)
                    ->andReturnUsing(function (string $message, array $context = []) use (&$loggedMessages, $level) {
                        $loggedMessages[] = [
                            'level'   => $level,
                            'message' => $message,
                            'context' => json_encode($context),
                        ];
                    });
            }

            return $logger;
        });

    Cache::flush();

    $service = new PayPalService(
        clientId: 'test_client_id',
        clientSecret: $clientSecret,
        baseUrl: 'https://api-m.sandbox.paypal.com',
        kesToUsdRate: 0.0077,
        webhookId: 'test_webhook_id'
    );

    // Scenario A: token generation failure — triggers error log
    Http::fake([
        '*/v1/oauth2/token' => Http::response(['error' => 'invalid_client'], 401),
    ]);
    try {
        $service->generateToken();
    } catch (PaymentFailedException) {
        // Expected — continue to check logs
    }

    // Scenario B: create order failure — triggers error log with response body
    Cache::put('paypal_access_token', $accessToken, 3000);
    Http::fake([
        '*/v2/checkout/orders' => Http::response(['error' => 'INTERNAL_SERVER_ERROR'], 500),
    ]);
    try {
        $service->createOrder(1.92, 'SM-REF001');
    } catch (PaymentFailedException) {
        // Expected
    }

    // Assert: no log entry contains the secret or the real bearer token
    foreach ($loggedMessages as $entry) {
        $fullText = $entry['message'] . ' ' . $entry['context'];
        expect($fullText)->not->toContain($clientSecret);
        expect($fullText)->not->toContain($accessToken);
    }
})->repeat(10);

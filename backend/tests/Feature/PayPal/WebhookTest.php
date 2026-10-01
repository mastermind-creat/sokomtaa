<?php

// Feature: paypal-payment-integration
// Tests: webhook endpoint (public access, signature verification, unknown payment)
// Requirements: 4.1, 4.3, 4.4, 4.6

use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Trader;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns a minimal PAYMENT.CAPTURE.COMPLETED event body.
 */
function captureCompletedEvent(string $orderId, string $captureId = 'CAP_TEST_001'): array
{
    return [
        'id'         => 'WH-EVENT-001',
        'event_type' => 'PAYMENT.CAPTURE.COMPLETED',
        'resource'   => [
            'id'     => $captureId,
            'status' => 'COMPLETED',
            'supplementary_data' => [
                'related_ids' => [
                    'order_id' => $orderId,
                ],
            ],
        ],
    ];
}

/**
 * PayPal-required signature headers (mocked, not real).
 */
function webhookHeaders(): array
{
    return [
        'PAYPAL-TRANSMISSION-ID'   => 'TRANS-001',
        'PAYPAL-TRANSMISSION-TIME' => now()->toIso8601String(),
        'PAYPAL-CERT-URL'          => 'https://api.sandbox.paypal.com/v1/notifications/certs/CERT-360caa42',
        'PAYPAL-AUTH-ALGO'         => 'SHA256withRSA',
        'PAYPAL-TRANSMISSION-SIG'  => 'base64sigvalue==',
    ];
}

// ── Tests ──────────────────────────────────────────────────────────────────

it('test_webhook_endpoint_is_public', function () {
    // Mock PayPal APIs: token + signature verification passes
    Http::fake([
        '*/v1/oauth2/token'                          => Http::response(['access_token' => 'fake_token'], 200),
        '*/v1/notifications/verify-webhook-signature' => Http::response(['verification_status' => 'SUCCESS'], 200),
    ]);

    $orderId = 'ORDER_PUBLIC_TEST_001';

    // Post without any Authorization header — must not return 401
    $response = $this->postJson(
        '/api/payments/paypal/webhook',
        captureCompletedEvent($orderId),
        webhookHeaders()
    );

    // 200 is expected whether payment is found or not (idempotent webhook)
    expect($response->status())->not->toBe(401);
    $response->assertStatus(200);
});

it('test_webhook_rejects_invalid_signature', function () {
    // Signature verification returns FAILURE
    Http::fake([
        '*/v1/oauth2/token'                          => Http::response(['access_token' => 'fake_token'], 200),
        '*/v1/notifications/verify-webhook-signature' => Http::response(['verification_status' => 'FAILURE'], 200),
    ]);

    $response = $this->postJson(
        '/api/payments/paypal/webhook',
        captureCompletedEvent('ORDER_BOGUS'),
        webhookHeaders()
    );

    // Must reject with 400, not process the event
    $response->assertStatus(400);
});

it('test_webhook_returns_200_for_unknown_payment', function () {
    // Signature passes but no matching Payment record in DB
    Http::fake([
        '*/v1/oauth2/token'                          => Http::response(['access_token' => 'fake_token'], 200),
        '*/v1/notifications/verify-webhook-signature' => Http::response(['verification_status' => 'SUCCESS'], 200),
    ]);

    $response = $this->postJson(
        '/api/payments/paypal/webhook',
        captureCompletedEvent('ORDER_DOES_NOT_EXIST_XYZ'),
        webhookHeaders()
    );

    // Must return 200 to prevent PayPal retry loops (Req 4.6)
    $response->assertStatus(200);
});

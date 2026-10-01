<?php

// Feature: paypal-payment-integration
// Property 7: Webhook Processing for Pending Payments
// Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.6

use App\Models\Notification;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

/**
 * Build a fake valid PayPal webhook payload for PAYMENT.CAPTURE.COMPLETED.
 */
function makeWebhookPayload(string $orderId, string $transactionId): array
{
    return [
        'event_type' => 'PAYMENT.CAPTURE.COMPLETED',
        'resource'   => [
            'id'     => $transactionId,
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
 * Fake HTTP responses: signature verification returns SUCCESS, token endpoint returns token.
 */
function fakeWebhookHttp(): void
{
    Http::fake([
        '*/v1/oauth2/token'                        => Http::response(['access_token' => 'fake_token'], 200),
        '*/v1/notifications/verify-webhook-signature' => Http::response(['verification_status' => 'SUCCESS'], 200),
        '*/v2/checkout/orders/*/capture'            => Http::response([], 200),
    ]);
}

it('processes a pending payment via webhook — same post-conditions as direct capture', function () {
    fakeWebhookHttp();

    $transactionId = 'TXN_' . strtoupper(uniqid());
    $orderId       = 'ORDER_' . strtoupper(uniqid());

    $resident = User::factory()->create(['role' => 'resident']);
    $trader   = \App\Models\Trader::factory()->create();
    $product  = \App\Models\Product::factory()->create(['trader_id' => $trader->id, 'price' => 250]);

    $reservation = Reservation::factory()->create([
        'resident_id'     => $resident->id,
        'trader_id'       => $trader->id,
        'product_id'      => $product->id,
        'status'          => 'pending',
        'total_amount'    => 250,
        'unit_price'      => 250,
        'quantity'        => 1,
        'paypal_order_id' => $orderId,
    ]);

    $payment = Payment::factory()->create([
        'reservation_id'  => $reservation->id,
        'user_id'         => $resident->id,
        'paypal_order_id' => $orderId,
        'status'          => 'pending',
        'payment_method'  => 'paypal',
        'amount'          => 250,
    ]);

    $response = $this->postJson('/api/payments/paypal/webhook', makeWebhookPayload($orderId, $transactionId), [
        'PAYPAL-TRANSMISSION-ID'   => 'trans-' . uniqid(),
        'PAYPAL-TRANSMISSION-TIME' => now()->toISOString(),
        'PAYPAL-CERT-URL'          => 'https://api.sandbox.paypal.com/v1/notifications/certs/test',
        'PAYPAL-AUTH-ALGO'         => 'SHA256withRSA',
        'PAYPAL-TRANSMISSION-SIG'  => base64_encode('fake_sig'),
    ]);

    $response->assertStatus(200);

    // Same post-conditions as Property 5
    $payment->refresh();
    expect($payment->status)->toBe('completed');
    expect($payment->paypal_transaction_id)->toBe($transactionId);
    expect($payment->paid_at)->not->toBeNull();

    $reservation->refresh();
    expect($reservation->status)->toBe('paid');

    $walletTx = WalletTransaction::where('reference_type', 'reservation')
        ->where('reference_id', (string) $reservation->id)
        ->first();
    expect($walletTx)->not->toBeNull();

    expect(Notification::where('user_id', $resident->id)->where('type', 'payment')->exists())->toBeTrue();
    expect(Notification::where('user_id', $trader->user_id)->where('type', 'payment')->exists())->toBeTrue();
})->repeat(3);

it('returns 400 and does not process when webhook signature is invalid', function () {
    Http::fake([
        '*/v1/oauth2/token'                        => Http::response(['access_token' => 'fake_token'], 200),
        '*/v1/notifications/verify-webhook-signature' => Http::response(['verification_status' => 'FAILURE'], 200),
    ]);

    $orderId       = 'ORDER_' . strtoupper(uniqid());
    $transactionId = 'TXN_' . strtoupper(uniqid());

    $resident    = User::factory()->create(['role' => 'resident']);
    $trader      = \App\Models\Trader::factory()->create();
    $product     = \App\Models\Product::factory()->create(['trader_id' => $trader->id, 'price' => 100]);
    $reservation = Reservation::factory()->create([
        'resident_id'     => $resident->id,
        'trader_id'       => $trader->id,
        'product_id'      => $product->id,
        'status'          => 'pending',
        'total_amount'    => 100,
        'paypal_order_id' => $orderId,
    ]);
    Payment::factory()->create([
        'reservation_id'  => $reservation->id,
        'user_id'         => $resident->id,
        'paypal_order_id' => $orderId,
        'status'          => 'pending',
    ]);

    $response = $this->postJson('/api/payments/paypal/webhook', makeWebhookPayload($orderId, $transactionId));

    $response->assertStatus(400);

    // Payment must still be pending (not processed)
    $payment = Payment::where('paypal_order_id', $orderId)->first();
    expect($payment->status)->toBe('pending');
});

it('returns 200 and does not throw when webhook payment record is not found', function () {
    fakeWebhookHttp();

    $response = $this->postJson('/api/payments/paypal/webhook', makeWebhookPayload('ORDER_NONEXISTENT', 'TXN_NONE'), [
        'PAYPAL-TRANSMISSION-ID'   => 'trans-' . uniqid(),
        'PAYPAL-TRANSMISSION-TIME' => now()->toISOString(),
        'PAYPAL-CERT-URL'          => 'https://api.sandbox.paypal.com/v1/notifications/certs/test',
        'PAYPAL-AUTH-ALGO'         => 'SHA256withRSA',
        'PAYPAL-TRANSMISSION-SIG'  => base64_encode('fake_sig'),
    ]);

    // Must return 200 to prevent PayPal retry loop
    $response->assertStatus(200);
});

it('is idempotent — does not re-process an already-completed payment received via webhook', function () {
    fakeWebhookHttp();

    $orderId       = 'ORDER_' . strtoupper(uniqid());
    $transactionId = 'TXN_ORIGINAL';

    $resident = User::factory()->create(['role' => 'resident']);
    $trader   = \App\Models\Trader::factory()->create();
    $product  = \App\Models\Product::factory()->create(['trader_id' => $trader->id, 'price' => 100]);

    $reservation = Reservation::factory()->create([
        'resident_id'     => $resident->id,
        'trader_id'       => $trader->id,
        'product_id'      => $product->id,
        'status'          => 'paid',
        'total_amount'    => 100,
        'paypal_order_id' => $orderId,
    ]);

    Payment::factory()->create([
        'reservation_id'        => $reservation->id,
        'user_id'               => $resident->id,
        'paypal_order_id'       => $orderId,
        'status'                => 'completed',
        'paypal_transaction_id' => $transactionId,
        'amount'                => 100,
        'paid_at'               => now()->subMinutes(5),
    ]);

    $walletTxCountBefore     = WalletTransaction::count();
    $notificationCountBefore = Notification::count();

    $headers = [
        'PAYPAL-TRANSMISSION-ID'   => 'trans-' . uniqid(),
        'PAYPAL-TRANSMISSION-TIME' => now()->toISOString(),
        'PAYPAL-CERT-URL'          => 'https://api.sandbox.paypal.com/v1/notifications/certs/test',
        'PAYPAL-AUTH-ALGO'         => 'SHA256withRSA',
        'PAYPAL-TRANSMISSION-SIG'  => base64_encode('fake_sig'),
    ];

    $this->postJson('/api/payments/paypal/webhook', makeWebhookPayload($orderId, 'TXN_DUPLICATE'), $headers)
        ->assertStatus(200);

    // No new wallet credits or notifications
    expect(WalletTransaction::count())->toBe($walletTxCountBefore);
    expect(Notification::count())->toBe($notificationCountBefore);

    // Transaction ID must not have changed
    $payment = Payment::where('paypal_order_id', $orderId)->first();
    expect($payment->paypal_transaction_id)->toBe($transactionId);
});

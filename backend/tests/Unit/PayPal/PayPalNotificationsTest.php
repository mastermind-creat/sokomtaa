<?php

// Feature: paypal-payment-integration
// Property 12: PayPal Payment Completion Notifications
// Validates: Requirements 11.1, 11.3

use App\Models\Notification;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\Trader;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

it('sends in-app notifications to both resident and trader after a successful capture', function () {
    $transactionId = 'TXN_' . strtoupper(uniqid());
    $orderId       = 'ORDER_' . strtoupper(uniqid());

    Http::fake([
        '*/v1/oauth2/token'              => Http::response(['access_token' => 'fake_token'], 200),
        '*/v2/checkout/orders/*/capture' => Http::response([
            'id'             => $orderId,
            'status'         => 'COMPLETED',
            'purchase_units' => [[
                'payments' => [
                    'captures' => [[
                        'id'     => $transactionId,
                        'status' => 'COMPLETED',
                    ]],
                ],
            ]],
        ], 200),
    ]);

    $resident = User::factory()->create(['role' => 'resident']);
    $trader   = Trader::factory()->create();
    $product  = Product::factory()->create(['trader_id' => $trader->id, 'price' => 150]);

    $reservation = Reservation::factory()->create([
        'resident_id'     => $resident->id,
        'trader_id'       => $trader->id,
        'product_id'      => $product->id,
        'status'          => 'pending',
        'total_amount'    => 150,
        'unit_price'      => 150,
        'quantity'        => 1,
        'paypal_order_id' => $orderId,
    ]);

    Payment::factory()->create([
        'reservation_id'  => $reservation->id,
        'user_id'         => $resident->id,
        'paypal_order_id' => $orderId,
        'status'          => 'pending',
        'payment_method'  => 'paypal',
        'amount'          => 150,
    ]);

    $this->actingAs($resident)
        ->postJson('/api/payments/paypal/capture-order', ['order_id' => $orderId])
        ->assertStatus(200);

    // Resident must receive a payment notification
    $residentNote = Notification::where('user_id', $resident->id)
        ->where('type', 'payment')
        ->first();

    expect($residentNote)->not->toBeNull();
    expect($residentNote->title)->toContain('PayPal');

    // Trader must receive a payment notification
    $traderNote = Notification::where('user_id', $trader->user_id)
        ->where('type', 'payment')
        ->first();

    expect($traderNote)->not->toBeNull();
    expect($traderNote->title)->toContain('PayPal');
})->repeat(5);

it('sends in-app notifications via webhook for a pending payment', function () {
    $captureId = 'CAP_' . strtoupper(uniqid());
    $orderId   = 'ORDER_WH_' . strtoupper(uniqid());

    Http::fake([
        '*/v1/oauth2/token'                           => Http::response(['access_token' => 'fake_token'], 200),
        '*/v1/notifications/verify-webhook-signature' => Http::response(['verification_status' => 'SUCCESS'], 200),
    ]);

    $resident = User::factory()->create(['role' => 'resident']);
    $trader   = Trader::factory()->create();
    $product  = Product::factory()->create(['trader_id' => $trader->id, 'price' => 200]);

    $reservation = Reservation::factory()->create([
        'resident_id'     => $resident->id,
        'trader_id'       => $trader->id,
        'product_id'      => $product->id,
        'status'          => 'pending',
        'total_amount'    => 200,
        'unit_price'      => 200,
        'quantity'        => 1,
        'paypal_order_id' => $orderId,
    ]);

    Payment::factory()->create([
        'reservation_id'  => $reservation->id,
        'user_id'         => $resident->id,
        'paypal_order_id' => $orderId,
        'status'          => 'pending',
        'payment_method'  => 'paypal',
        'amount'          => 200,
    ]);

    $webhookPayload = [
        'event_type' => 'PAYMENT.CAPTURE.COMPLETED',
        'resource'   => [
            'id'     => $captureId,
            'status' => 'COMPLETED',
            'supplementary_data' => [
                'related_ids' => ['order_id' => $orderId],
            ],
        ],
    ];

    $headers = [
        'PAYPAL-TRANSMISSION-ID'   => 'TRANS-WH-001',
        'PAYPAL-TRANSMISSION-TIME' => now()->toIso8601String(),
        'PAYPAL-CERT-URL'          => 'https://api.sandbox.paypal.com/v1/notifications/certs/CERT-360caa42',
        'PAYPAL-AUTH-ALGO'         => 'SHA256withRSA',
        'PAYPAL-TRANSMISSION-SIG'  => 'base64sigvalue==',
    ];

    $this->postJson('/api/payments/paypal/webhook', $webhookPayload, $headers)
        ->assertStatus(200);

    // Both resident and trader must have notifications after webhook processing
    expect(Notification::where('user_id', $resident->id)->where('type', 'payment')->count())->toBeGreaterThan(0);
    expect(Notification::where('user_id', $trader->user_id)->where('type', 'payment')->count())->toBeGreaterThan(0);
})->repeat(3);

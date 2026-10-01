<?php

// Feature: paypal-payment-integration
// Property 13: No SMS for PayPal Events
// Validates: Requirements 11.4

use App\Models\Payment;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\SmsLog;
use App\Models\Trader;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

it('does not create any sms_log records after a successful PayPal capture', function () {
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
    $product  = Product::factory()->create(['trader_id' => $trader->id, 'price' => 100]);

    $reservation = Reservation::factory()->create([
        'resident_id'     => $resident->id,
        'trader_id'       => $trader->id,
        'product_id'      => $product->id,
        'status'          => 'pending',
        'total_amount'    => 100,
        'unit_price'      => 100,
        'quantity'        => 1,
        'paypal_order_id' => $orderId,
    ]);

    Payment::factory()->create([
        'reservation_id'  => $reservation->id,
        'user_id'         => $resident->id,
        'paypal_order_id' => $orderId,
        'status'          => 'pending',
        'payment_method'  => 'paypal',
        'amount'          => 100,
    ]);

    $smsBefore = SmsLog::count();

    $this->actingAs($resident)
        ->postJson('/api/payments/paypal/capture-order', ['order_id' => $orderId])
        ->assertStatus(200);

    // No new SMS log records must exist after a PayPal capture
    expect(SmsLog::count())->toBe($smsBefore);
})->repeat(5);

it('does not create any sms_log records after a failed PayPal capture', function () {
    $orderId = 'ORDER_FAIL_' . strtoupper(uniqid());

    Http::fake([
        '*/v1/oauth2/token'              => Http::response(['access_token' => 'fake_token'], 200),
        '*/v2/checkout/orders/*/capture' => Http::response([
            'id'             => $orderId,
            'status'         => 'VOIDED',
            'purchase_units' => [[
                'payments' => [
                    'captures' => [[
                        'id'     => 'CAP_VOIDED',
                        'status' => 'VOIDED',
                    ]],
                ],
            ]],
        ], 200),
    ]);

    $resident = User::factory()->create(['role' => 'resident']);
    $trader   = Trader::factory()->create();
    $product  = Product::factory()->create(['trader_id' => $trader->id, 'price' => 100]);

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
        'payment_method'  => 'paypal',
        'amount'          => 100,
    ]);

    $smsBefore = SmsLog::count();

    $this->actingAs($resident)
        ->postJson('/api/payments/paypal/capture-order', ['order_id' => $orderId])
        ->assertStatus(402);

    expect(SmsLog::count())->toBe($smsBefore);
})->repeat(5);

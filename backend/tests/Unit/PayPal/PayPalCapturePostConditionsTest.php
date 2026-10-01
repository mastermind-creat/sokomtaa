<?php

// Feature: paypal-payment-integration
// Property 5: Capture Success Post-Condition Invariant
// Validates: Requirements 3.2, 3.3

use App\Models\Notification;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

it('marks Payment completed, updates Reservations to paid, credits wallet, and creates notifications on successful capture', function () {
    $transactionId = 'TXN_' . strtoupper(uniqid());
    $orderId       = 'ORDER_' . strtoupper(uniqid());

    Http::fake([
        '*/v1/oauth2/token'             => Http::response(['access_token' => 'fake_token'], 200),
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
    $trader   = \App\Models\Trader::factory()->create();
    $product  = \App\Models\Product::factory()->create([
        'trader_id' => $trader->id,
        'price'     => 200,
    ]);

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

    $payment = Payment::factory()->create([
        'reservation_id'  => $reservation->id,
        'user_id'         => $resident->id,
        'paypal_order_id' => $orderId,
        'status'          => 'pending',
        'payment_method'  => 'paypal',
        'amount'          => 200,
    ]);

    $response = $this->actingAs($resident)
        ->postJson('/api/payments/paypal/capture-order', [
            'order_id' => $orderId,
        ]);

    $response->assertStatus(200);

    // Payment must be completed with transaction ID and paid_at set
    $payment->refresh();
    expect($payment->status)->toBe('completed');
    expect($payment->paypal_transaction_id)->toBe($transactionId);
    expect($payment->paid_at)->not->toBeNull();

    // Reservation must be paid
    $reservation->refresh();
    expect($reservation->status)->toBe('paid');

    // Trader wallet must have been credited
    $wallet = Wallet::where('user_id', $trader->user_id)->first();
    expect($wallet)->not->toBeNull();
    expect((float) $wallet->balance)->toBeGreaterThan(0.0);

    $walletTx = WalletTransaction::where('reference_type', 'reservation')
        ->where('reference_id', (string) $reservation->id)
        ->first();
    expect($walletTx)->not->toBeNull();
    expect($walletTx->type)->toBe('credit');

    // Both resident and trader must have received in-app notifications
    $residentNotification = Notification::where('user_id', $resident->id)
        ->where('type', 'payment')
        ->first();
    expect($residentNotification)->not->toBeNull();

    $traderNotification = Notification::where('user_id', $trader->user_id)
        ->where('type', 'payment')
        ->first();
    expect($traderNotification)->not->toBeNull();
})->repeat(5);

it('marks Payment as failed and Reservations as cancelled when capture status is not COMPLETED', function () {
    $orderId = 'ORDER_' . strtoupper(uniqid());

    foreach (['VOIDED', 'DECLINED', 'FAILED', 'PENDING'] as $captureStatus) {
        Http::fake([
            '*/v1/oauth2/token'             => Http::response(['access_token' => 'fake_token'], 200),
            '*/v2/checkout/orders/*/capture' => Http::response([
                'id'             => $orderId,
                'status'         => $captureStatus,
                'purchase_units' => [[
                    'payments' => [
                        'captures' => [[
                            'id'     => 'TXN_FAILED',
                            'status' => $captureStatus,
                        ]],
                    ],
                ]],
            ], 200),
        ]);

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
        $payment = Payment::factory()->create([
            'reservation_id'  => $reservation->id,
            'user_id'         => $resident->id,
            'paypal_order_id' => $orderId,
            'status'          => 'pending',
        ]);

        $response = $this->actingAs($resident)
            ->postJson('/api/payments/paypal/capture-order', ['order_id' => $orderId]);

        $response->assertStatus(402)
            ->assertJson(['code' => 'PAYMENT_FAILED']);

        $payment->refresh();
        expect($payment->status)->toBe('failed');

        $reservation->refresh();
        expect($reservation->status)->toBe('cancelled');
    }
});

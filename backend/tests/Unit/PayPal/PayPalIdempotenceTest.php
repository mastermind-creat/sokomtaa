<?php

// Feature: paypal-payment-integration
// Property 6: Payment Processing Idempotence
// Validates: Requirements 3.5, 4.5

use App\Models\Notification;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

it('returns 200 and makes no state changes when capturing an already-completed payment', function () {
    Http::fake([
        '*/v1/oauth2/token'             => Http::response(['access_token' => 'fake_token'], 200),
        '*/v2/checkout/orders/*/capture' => Http::response([
            'id'             => 'ORDER_ALREADY_DONE',
            'status'         => 'COMPLETED',
            'purchase_units' => [[
                'payments' => [
                    'captures' => [[
                        'id'     => 'TXN_ALREADY_DONE',
                        'status' => 'COMPLETED',
                    ]],
                ],
            ]],
        ], 200),
    ]);

    $resident = User::factory()->create(['role' => 'resident']);
    $trader   = \App\Models\Trader::factory()->create();
    $product  = \App\Models\Product::factory()->create(['trader_id' => $trader->id, 'price' => 150]);

    $orderId = 'ORDER_' . strtoupper(uniqid());

    $reservation = Reservation::factory()->create([
        'resident_id'     => $resident->id,
        'trader_id'       => $trader->id,
        'product_id'      => $product->id,
        'status'          => 'paid',          // already paid
        'total_amount'    => 150,
        'paypal_order_id' => $orderId,
    ]);

    $payment = Payment::factory()->create([
        'reservation_id'        => $reservation->id,
        'user_id'               => $resident->id,
        'paypal_order_id'       => $orderId,
        'status'                => 'completed',  // already completed
        'paypal_transaction_id' => 'TXN_ORIGINAL',
        'payment_method'        => 'paypal',
        'amount'                => 150,
        'paid_at'               => now()->subMinutes(5),
    ]);

    $walletTxCountBefore      = WalletTransaction::count();
    $notificationCountBefore  = Notification::count();

    // First call — already completed, must short-circuit
    $response = $this->actingAs($resident)
        ->postJson('/api/payments/paypal/capture-order', ['order_id' => $orderId]);

    $response->assertStatus(200)
        ->assertJsonPath('data.status', 'completed');

    // No new wallet credits
    expect(WalletTransaction::count())->toBe($walletTxCountBefore);

    // No new notifications
    expect(Notification::count())->toBe($notificationCountBefore);

    // Payment state unchanged
    $payment->refresh();
    expect($payment->paypal_transaction_id)->toBe('TXN_ORIGINAL');

    // Capture endpoint must NOT have been called (idempotent short-circuit)
    Http::assertNothingSent();
})->repeat(5);

it('does not credit the wallet or create duplicate notifications on a second capture call', function () {
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

    $resident    = User::factory()->create(['role' => 'resident']);
    $trader      = \App\Models\Trader::factory()->create();
    $product     = \App\Models\Product::factory()->create(['trader_id' => $trader->id, 'price' => 300]);
    $reservation = Reservation::factory()->create([
        'resident_id'     => $resident->id,
        'trader_id'       => $trader->id,
        'product_id'      => $product->id,
        'status'          => 'pending',
        'total_amount'    => 300,
        'unit_price'      => 300,
        'quantity'        => 1,
        'paypal_order_id' => $orderId,
    ]);

    Payment::factory()->create([
        'reservation_id'  => $reservation->id,
        'user_id'         => $resident->id,
        'paypal_order_id' => $orderId,
        'status'          => 'pending',
        'payment_method'  => 'paypal',
        'amount'          => 300,
    ]);

    // First capture — processes successfully
    $this->actingAs($resident)
        ->postJson('/api/payments/paypal/capture-order', ['order_id' => $orderId])
        ->assertStatus(200);

    $walletTxAfterFirst     = WalletTransaction::count();
    $notificationsAfterFirst = Notification::count();

    // Second capture — must be idempotent
    $this->actingAs($resident)
        ->postJson('/api/payments/paypal/capture-order', ['order_id' => $orderId])
        ->assertStatus(200)
        ->assertJsonPath('data.status', 'completed');

    expect(WalletTransaction::count())->toBe($walletTxAfterFirst);
    expect(Notification::count())->toBe($notificationsAfterFirst);
});

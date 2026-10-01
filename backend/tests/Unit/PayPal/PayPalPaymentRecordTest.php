<?php

// Feature: paypal-payment-integration
// Property 4: Payment Record Creation Invariant
// Validates: Requirements 2.5, 2.6, 8.4

use App\Models\Payment;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

it('always creates a pending paypal Payment record with correct fields on successful create-order', function () {
    $orderId = 'ORDER_' . strtoupper(uniqid());

    Http::fake([
        '*/v1/oauth2/token'    => Http::response(['access_token' => 'fake_token'], 200),
        '*/v2/checkout/orders' => Http::response([
            'id'    => $orderId,
            'links' => [['rel' => 'approve', 'href' => 'https://paypal.com/approve/' . $orderId]],
        ], 200),
    ]);

    $user    = User::factory()->create(['role' => 'resident']);
    $trader  = \App\Models\Trader::factory()->create();
    $product = \App\Models\Product::factory()->create([
        'trader_id' => $trader->id,
        'price'     => rand(50, 500),
    ]);
    $reservation = Reservation::factory()->create([
        'resident_id'  => $user->id,
        'trader_id'    => $trader->id,
        'product_id'   => $product->id,
        'status'       => 'pending',
        'total_amount' => $product->price,
    ]);

    $response = $this->actingAs($user)
        ->postJson('/api/payments/paypal/create-order', [
            'reservation_ids' => [$reservation->id],
            'currency'        => 'KES',
        ]);

    $response->assertStatus(200);

    // Payment record must exist with correct fields
    $payment = Payment::where('paypal_order_id', $orderId)->first();
    expect($payment)->not->toBeNull();
    expect($payment->status)->toBe('pending');
    expect($payment->payment_method)->toBe('paypal');
    expect($payment->user_id)->toBe($user->id);

    // Reservation must have paypal_order_id set
    $reservation->refresh();
    expect($reservation->paypal_order_id)->toBe($orderId);
})->repeat(5);

it('creates a Payment record with payment_method=paypal (never mpesa) for PayPal orders', function () {
    $orderId = 'ORDER_' . strtoupper(uniqid());

    Http::fake([
        '*/v1/oauth2/token'    => Http::response(['access_token' => 'fake_token'], 200),
        '*/v2/checkout/orders' => Http::response([
            'id'    => $orderId,
            'links' => [['rel' => 'approve', 'href' => 'https://paypal.com/approve']],
        ], 200),
    ]);

    $user    = User::factory()->create(['role' => 'resident']);
    $trader  = \App\Models\Trader::factory()->create();
    $product = \App\Models\Product::factory()->create(['trader_id' => $trader->id, 'price' => 200]);

    $reservation = Reservation::factory()->create([
        'resident_id'  => $user->id,
        'trader_id'    => $trader->id,
        'product_id'   => $product->id,
        'status'       => 'pending',
        'total_amount' => 200,
    ]);

    $this->actingAs($user)
        ->postJson('/api/payments/paypal/create-order', [
            'reservation_ids' => [$reservation->id],
            'currency'        => 'KES',
        ])
        ->assertStatus(200);

    $payment = Payment::where('paypal_order_id', $orderId)->firstOrFail();
    expect($payment->payment_method)->toBe('paypal')
        ->and($payment->payment_method)->not->toBe('mpesa');
});

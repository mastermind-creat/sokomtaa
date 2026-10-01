<?php

// Feature: paypal-payment-integration
// Tests: capture-order and status endpoints
// Requirements: 3.4, 3.5, 7.2, 7.3

use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Trader;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

// ── Helpers ────────────────────────────────────────────────────────────────

function createPendingPayPalPayment(User $user): array
{
    $trader  = Trader::factory()->create();
    $reservation = Reservation::factory()->create([
        'resident_id'    => $user->id,
        'trader_id'      => $trader->id,
        'status'         => 'pending',
        'total_amount'   => 300,
        'paypal_order_id' => 'ORDER_PENDING_' . rand(1000, 9999),
    ]);

    $orderId = $reservation->paypal_order_id;

    $payment = Payment::factory()->create([
        'user_id'         => $user->id,
        'reservation_id'  => $reservation->id,
        'paypal_order_id' => $orderId,
        'payment_method'  => 'paypal',
        'amount'          => 300,
        'status'          => 'pending',
    ]);

    return compact('payment', 'reservation', 'orderId');
}

function createCompletedPayPalPayment(User $user): array
{
    $trader  = Trader::factory()->create();
    $reservation = Reservation::factory()->create([
        'resident_id'    => $user->id,
        'trader_id'      => $trader->id,
        'status'         => 'paid',
        'total_amount'   => 300,
        'paypal_order_id' => 'ORDER_DONE_' . rand(1000, 9999),
    ]);

    $orderId = $reservation->paypal_order_id;

    $payment = Payment::factory()->create([
        'user_id'                => $user->id,
        'reservation_id'         => $reservation->id,
        'paypal_order_id'        => $orderId,
        'paypal_transaction_id'  => 'TXN_' . rand(100000, 999999),
        'payment_method'         => 'paypal',
        'amount'                 => 300,
        'status'                 => 'completed',
        'paid_at'                => now(),
    ]);

    return compact('payment', 'reservation', 'orderId');
}

// ── Tests ──────────────────────────────────────────────────────────────────

it('test_capture_fails_with_402_on_non_completed_status', function () {
    // PayPal returns a VOIDED status — controller must respond 402
    Http::fake([
        '*/v1/oauth2/token'          => Http::response(['access_token' => 'fake_token'], 200),
        '*/v2/checkout/orders/*/capture' => Http::response([
            'id'             => 'ORDER_VOIDED',
            'status'         => 'VOIDED',
            'purchase_units' => [
                [
                    'payments' => [
                        'captures' => [
                            ['id' => 'CAP_001', 'status' => 'DECLINED'],
                        ],
                    ],
                ],
            ],
        ], 200),
    ]);

    $user = User::factory()->create(['role' => 'resident']);
    ['orderId' => $orderId] = createPendingPayPalPayment($user);

    $response = $this->actingAs($user)
        ->postJson('/api/payments/paypal/capture-order', ['order_id' => $orderId]);

    $response->assertStatus(402)
        ->assertJsonFragment(['code' => 'PAYMENT_FAILED']);
});

it('test_capture_returns_200_when_already_completed', function () {
    // If payment is already completed, capture must be idempotent and return 200
    $user = User::factory()->create(['role' => 'resident']);
    ['orderId' => $orderId] = createCompletedPayPalPayment($user);

    // No HTTP mock needed — the controller should short-circuit before calling PayPal
    $response = $this->actingAs($user)
        ->postJson('/api/payments/paypal/capture-order', ['order_id' => $orderId]);

    $response->assertStatus(200)
        ->assertJsonFragment(['status' => 'completed']);
});

it('test_status_endpoint_returns_all_required_fields', function () {
    $user = User::factory()->create(['role' => 'resident']);
    ['orderId' => $orderId, 'payment' => $payment] = createCompletedPayPalPayment($user);

    $response = $this->actingAs($user)
        ->getJson("/api/payments/paypal/status/{$orderId}");

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => ['status', 'paypal_transaction_id', 'amount', 'paid_at'],
        ]);

    // All four keys must be present (null values allowed for pending fields)
    $data = $response->json('data');
    expect($data)->toHaveKeys(['status', 'paypal_transaction_id', 'amount', 'paid_at']);
});

it('test_status_returns_404_for_unowned_order', function () {
    $owner = User::factory()->create(['role' => 'resident']);
    $other = User::factory()->create(['role' => 'resident']);

    ['orderId' => $orderId] = createCompletedPayPalPayment($owner);

    // Request from a different user
    $response = $this->actingAs($other)
        ->getJson("/api/payments/paypal/status/{$orderId}");

    $response->assertStatus(404)
        ->assertJsonFragment(['code' => 'NOT_FOUND']);
});

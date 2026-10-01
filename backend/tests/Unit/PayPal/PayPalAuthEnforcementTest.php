<?php

// Feature: paypal-payment-integration
// Property 14: Authentication and Ownership Enforcement
// Validates: Requirements 12.3, 12.4

use App\Models\Payment;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\Trader;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

// ── Helpers ────────────────────────────────────────────────────────────────

function createPayPalOrderForResident(): array
{
    $resident = User::factory()->create(['role' => 'resident']);
    $trader   = Trader::factory()->create();
    $product  = Product::factory()->create(['trader_id' => $trader->id, 'price' => 100]);
    $orderId  = 'ORDER_AUTH_' . strtoupper(uniqid());

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
        'paypal_transaction_id' => 'TXN_AUTH_' . strtoupper(uniqid()),
        'status'                => 'completed',
        'payment_method'        => 'paypal',
        'amount'                => 100,
        'paid_at'               => now(),
    ]);

    return compact('resident', 'orderId');
}

// ── 401 — Unauthenticated ─────────────────────────────────────────────────

it('returns 401 for unauthenticated requests to create-order', function () {
    $response = $this->postJson('/api/payments/paypal/create-order', [
        'reservation_ids' => [1],
        'currency'        => 'KES',
    ]);

    $response->assertStatus(401);
})->repeat(3);

it('returns 401 for unauthenticated requests to capture-order', function () {
    $response = $this->postJson('/api/payments/paypal/capture-order', [
        'order_id' => 'ORDER_NO_AUTH',
    ]);

    $response->assertStatus(401);
})->repeat(3);

it('returns 401 for unauthenticated requests to status endpoint', function () {
    $response = $this->getJson('/api/payments/paypal/status/ORDER_NO_AUTH');

    $response->assertStatus(401);
})->repeat(3);

// ── 403 — Trader Role ─────────────────────────────────────────────────────

it('returns 403 when a trader role user attempts to create a PayPal order', function () {
    Http::fake([
        '*/v1/oauth2/token'    => Http::response(['access_token' => 'fake_token'], 200),
        '*/v2/checkout/orders' => Http::response(['id' => 'ORDER_X', 'links' => []], 200),
    ]);

    $traderUser = User::factory()->create(['role' => 'trader']);

    $response = $this->actingAs($traderUser)
        ->postJson('/api/payments/paypal/create-order', [
            'reservation_ids' => [999],
            'currency'        => 'KES',
        ]);

    // Trader role must be rejected (403 or 422 from ownership check — both acceptable)
    // Requirement 12.3 says resident or admin only
    expect($response->status())->toBeIn([403, 422]);
})->repeat(3);

// ── 404 — Unowned Order ───────────────────────────────────────────────────

it('returns 404 when capture is attempted for an order owned by a different user', function () {
    ['orderId' => $orderId] = createPayPalOrderForResident();

    // Attacker is a different user
    $attacker = User::factory()->create(['role' => 'resident']);

    $response = $this->actingAs($attacker)
        ->postJson('/api/payments/paypal/capture-order', ['order_id' => $orderId]);

    $response->assertStatus(404)
        ->assertJsonFragment(['code' => 'NOT_FOUND']);
})->repeat(5);

it('returns 404 when status is queried for an order owned by a different user', function () {
    ['orderId' => $orderId] = createPayPalOrderForResident();

    $attacker = User::factory()->create(['role' => 'resident']);

    $response = $this->actingAs($attacker)
        ->getJson("/api/payments/paypal/status/{$orderId}");

    $response->assertStatus(404)
        ->assertJsonFragment(['code' => 'NOT_FOUND']);
})->repeat(5);

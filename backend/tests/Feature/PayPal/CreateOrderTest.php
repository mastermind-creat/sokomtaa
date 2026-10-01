<?php

// Feature: paypal-payment-integration
// Tests: create-order endpoint, migration schema
// Requirements: 2.1, 2.2, 2.7, 8.1, 8.2, 8.3, 8.5

use App\Models\Payment;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\Trader;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

// ── Helpers ────────────────────────────────────────────────────────────────

function fakePayPalSuccess(): void
{
    Http::fake([
        '*/v1/oauth2/token'    => Http::response(['access_token' => 'fake_token'], 200),
        '*/v2/checkout/orders' => Http::response([
            'id'    => 'ORDER_TEST_' . rand(1000, 9999),
            'links' => [
                ['rel' => 'approve', 'href' => 'https://www.sandbox.paypal.com/checkoutnow?token=TEST'],
            ],
        ], 200),
    ]);
}

function makeResidentWithReservation(string $status = 'pending'): array
{
    $resident = User::factory()->create(['role' => 'resident']);
    $trader   = Trader::factory()->create();
    $product  = Product::factory()->create(['trader_id' => $trader->id, 'price' => 250]);
    $reservation = Reservation::factory()->create([
        'resident_id'  => $resident->id,
        'trader_id'    => $trader->id,
        'product_id'   => $product->id,
        'status'       => $status,
        'total_amount' => 250,
    ]);

    return compact('resident', 'reservation');
}

// ── Tests ──────────────────────────────────────────────────────────────────

it('test_create_order_endpoint_exists_and_requires_auth', function () {
    // Unauthenticated request must return 401
    $response = $this->postJson('/api/payments/paypal/create-order', [
        'reservation_ids' => [1],
        'currency'        => 'KES',
    ]);

    $response->assertStatus(401);
});

it('test_create_order_fails_for_reservations_not_owned_by_user', function () {
    fakePayPalSuccess();

    $owner = User::factory()->create(['role' => 'resident']);
    $other = User::factory()->create(['role' => 'resident']);

    $trader  = Trader::factory()->create();
    $product = Product::factory()->create(['trader_id' => $trader->id, 'price' => 100]);

    $reservation = Reservation::factory()->create([
        'resident_id'  => $other->id, // owned by a DIFFERENT user
        'trader_id'    => $trader->id,
        'product_id'   => $product->id,
        'status'       => 'pending',
        'total_amount' => 100,
    ]);

    $response = $this->actingAs($owner)
        ->postJson('/api/payments/paypal/create-order', [
            'reservation_ids' => [$reservation->id],
            'currency'        => 'KES',
        ]);

    $response->assertStatus(422)
        ->assertJsonFragment(['code' => 'VALIDATION_ERROR']);

    expect(Payment::where('payment_method', 'paypal')->count())->toBe(0);
});

it('test_create_order_fails_for_non_pending_reservations', function () {
    fakePayPalSuccess();

    ['resident' => $resident, 'reservation' => $reservation] = makeResidentWithReservation('paid');

    $response = $this->actingAs($resident)
        ->postJson('/api/payments/paypal/create-order', [
            'reservation_ids' => [$reservation->id],
            'currency'        => 'KES',
        ]);

    $response->assertStatus(422)
        ->assertJsonFragment(['code' => 'VALIDATION_ERROR']);

    expect(Payment::where('payment_method', 'paypal')->count())->toBe(0);
});

it('test_create_order_fails_with_500_on_paypal_api_error', function () {
    // Mock token OK but order creation fails
    Http::fake([
        '*/v1/oauth2/token'    => Http::response(['access_token' => 'fake_token'], 200),
        '*/v2/checkout/orders' => Http::response(['error' => 'INTERNAL_SERVER_ERROR'], 500),
    ]);

    ['resident' => $resident, 'reservation' => $reservation] = makeResidentWithReservation();

    $response = $this->actingAs($resident)
        ->postJson('/api/payments/paypal/create-order', [
            'reservation_ids' => [$reservation->id],
            'currency'        => 'KES',
        ]);

    $response->assertStatus(500)
        ->assertJsonFragment(['code' => 'PAYMENT_FAILED']);
});

it('test_migration_adds_paypal_columns', function () {
    // Req 8.1 — paypal_order_id on payments
    expect(Schema::hasColumn('payments', 'paypal_order_id'))->toBeTrue();

    // Req 8.2 — paypal_transaction_id on payments
    expect(Schema::hasColumn('payments', 'paypal_transaction_id'))->toBeTrue();

    // Req 8.3 — payment_method on payments
    expect(Schema::hasColumn('payments', 'payment_method'))->toBeTrue();

    // Also added to reservations
    expect(Schema::hasColumn('reservations', 'paypal_order_id'))->toBeTrue();
});

it('test_migration_is_non_destructive', function () {
    // Create an M-Pesa payment without the new PayPal columns populated —
    // existing records must still be retrievable with a null paypal_order_id
    // and payment_method defaulting to 'mpesa'.
    $user = User::factory()->create();
    $reservation = Reservation::factory()->create(['resident_id' => $user->id]);

    $payment = Payment::create([
        'reservation_id' => $reservation->id,
        'user_id'        => $user->id,
        'amount'         => 100.00,
        'phone_number'   => '0712345678',
        'type'           => 'reservation',
        'status'         => 'pending',
        // Intentionally omitting all paypal_* columns
    ]);

    $payment->refresh();

    // Old record must survive with defaults
    expect($payment->paypal_order_id)->toBeNull()
        ->and($payment->paypal_transaction_id)->toBeNull()
        ->and($payment->payment_method)->toBe('mpesa');
});

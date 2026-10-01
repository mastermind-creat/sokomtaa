<?php

// Feature: paypal-payment-integration
// Property 3: Reservation Ownership and Status Validation
// Validates: Requirements 2.2

use App\Models\Payment;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

it('rejects create-order for any reservation not owned by the authenticated user', function () {
    Http::fake([
        '*/v1/oauth2/token'      => Http::response(['access_token' => 'fake_token'], 200),
        '*/v2/checkout/orders'   => Http::response(['id' => 'ORDER123', 'links' => [['rel' => 'approve', 'href' => 'https://paypal.com/approve']]], 200),
    ]);

    $owner = User::factory()->create(['role' => 'resident']);
    $other = User::factory()->create(['role' => 'resident']);

    $trader   = \App\Models\Trader::factory()->create();
    $product  = \App\Models\Product::factory()->create(['trader_id' => $trader->id, 'price' => 100]);
    $reservation = Reservation::factory()->create([
        'resident_id' => $other->id,   // owned by DIFFERENT user
        'trader_id'   => $trader->id,
        'product_id'  => $product->id,
        'status'      => 'pending',
        'total_amount' => 100,
    ]);

    $response = $this->actingAs($owner)
        ->postJson('/api/payments/paypal/create-order', [
            'reservation_ids' => [$reservation->id],
            'currency'        => 'KES',
        ]);

    $response->assertStatus(422)
        ->assertJson(['code' => 'VALIDATION_ERROR']);

    // No Payment record should have been created
    expect(Payment::where('payment_method', 'paypal')->count())->toBe(0);
})->repeat(5);

it('rejects create-order for any reservation not in pending status', function () {
    Http::fake([
        '*/v1/oauth2/token'    => Http::response(['access_token' => 'fake_token'], 200),
        '*/v2/checkout/orders' => Http::response(['id' => 'ORDER123', 'links' => []], 200),
    ]);

    $user    = User::factory()->create(['role' => 'resident']);
    $trader  = \App\Models\Trader::factory()->create();
    $product = \App\Models\Product::factory()->create(['trader_id' => $trader->id, 'price' => 100]);

    foreach (['paid', 'cancelled', 'expired', 'completed'] as $status) {
        $reservation = Reservation::factory()->create([
            'resident_id'  => $user->id,
            'trader_id'    => $trader->id,
            'product_id'   => $product->id,
            'status'       => $status,
            'total_amount' => 100,
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/payments/paypal/create-order', [
                'reservation_ids' => [$reservation->id],
                'currency'        => 'KES',
            ]);

        $response->assertStatus(422)
            ->assertJson(['code' => 'VALIDATION_ERROR']);
    }

    expect(Payment::where('payment_method', 'paypal')->count())->toBe(0);
});

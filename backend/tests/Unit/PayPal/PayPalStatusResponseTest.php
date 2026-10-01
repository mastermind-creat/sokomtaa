<?php

// Feature: paypal-payment-integration
// Property 10: Status Endpoint Response Shape
// Validates: Requirements 7.2, 7.3

use App\Models\Payment;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('always returns all four required fields in the status response for any payment state', function () {
    $statuses = ['pending', 'completed', 'failed'];

    foreach ($statuses as $status) {
        $orderId  = 'ORDER_' . strtoupper(uniqid());
        $resident = User::factory()->create(['role' => 'resident']);
        $trader   = \App\Models\Trader::factory()->create();
        $product  = \App\Models\Product::factory()->create(['trader_id' => $trader->id, 'price' => 100]);

        $reservation = Reservation::factory()->create([
            'resident_id'     => $resident->id,
            'trader_id'       => $trader->id,
            'product_id'      => $product->id,
            'status'          => $status === 'pending' ? 'pending' : ($status === 'completed' ? 'paid' : 'cancelled'),
            'total_amount'    => 100,
            'paypal_order_id' => $orderId,
        ]);

        $payment = Payment::factory()->create([
            'reservation_id'        => $reservation->id,
            'user_id'               => $resident->id,
            'paypal_order_id'       => $orderId,
            'status'                => $status,
            'payment_method'        => 'paypal',
            'amount'                => 100,
            'paypal_transaction_id' => $status === 'completed' ? 'TXN_' . uniqid() : null,
            'paid_at'               => $status === 'completed' ? now() : null,
        ]);

        $response = $this->actingAs($resident)
            ->getJson('/api/payments/paypal/status/' . $orderId);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'status',
                    'paypal_transaction_id',
                    'amount',
                    'paid_at',
                ],
            ]);

        // All four keys must be present (null is acceptable for unset fields)
        $data = $response->json('data');
        expect($data)->toHaveKey('status');
        expect($data)->toHaveKey('paypal_transaction_id');
        expect($data)->toHaveKey('amount');
        expect($data)->toHaveKey('paid_at');

        // Values must match what's in the Payment record
        expect($data['status'])->toBe($status);
        expect($data['amount'])->toBe($payment->amount);
    }
})->repeat(5);

it('returns 404 when the order_id belongs to a different user', function () {
    $owner = User::factory()->create(['role' => 'resident']);
    $other = User::factory()->create(['role' => 'resident']);

    $orderId = 'ORDER_' . strtoupper(uniqid());
    $trader  = \App\Models\Trader::factory()->create();
    $product = \App\Models\Product::factory()->create(['trader_id' => $trader->id, 'price' => 100]);

    $reservation = Reservation::factory()->create([
        'resident_id'     => $owner->id,
        'trader_id'       => $trader->id,
        'product_id'      => $product->id,
        'total_amount'    => 100,
        'paypal_order_id' => $orderId,
    ]);

    Payment::factory()->create([
        'reservation_id'  => $reservation->id,
        'user_id'         => $owner->id,
        'paypal_order_id' => $orderId,
        'status'          => 'pending',
    ]);

    // Requesting as `other` — must return 404 (ownership enforced)
    $this->actingAs($other)
        ->getJson('/api/payments/paypal/status/' . $orderId)
        ->assertStatus(404)
        ->assertJson(['code' => 'NOT_FOUND']);
})->repeat(3);

it('returns 401 when the status endpoint is called without authentication', function () {
    $this->getJson('/api/payments/paypal/status/ORDER_FAKE')
        ->assertStatus(401);
});

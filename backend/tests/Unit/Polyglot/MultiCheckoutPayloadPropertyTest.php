<?php

// Feature: polyglot-architecture-upgrade, Property 21: Multi-Merchant Checkout Payload Contains All Items
// Validates: Requirements 9.3

use App\Models\User;
use App\Services\DeliveryFeeCalculator;
use App\Services\MpesaService;
use App\Services\MultiCheckoutService;
use App\Services\NotificationService;

function createMultiCheckoutService(): MultiCheckoutService
{
    $mpesa = Mockery::mock(MpesaService::class);
    $notification = Mockery::mock(NotificationService::class);
    $deliveryCalc = new DeliveryFeeCalculator();

    return new MultiCheckoutService($mpesa, $notification, $deliveryCalc);
}

it('assembles multi-merchant payload preserving all N items and subtotal invariants across 100 randomized cases', function (int $itemCount, array $items, string $deliveryType) {
    $service = createMultiCheckoutService();
    $resident = new User();
    $resident->id = rand(1, 9999);
    $resident->phone = '0712345678';

    $residentLocation = [
        'lat' => -0.0917,
        'lon' => 34.7679,
    ];

    $payload = $service->assemblePayload($resident, $items, $deliveryType, $residentLocation);

    // Invariant 1: Exactly N line items
    expect($payload['items'])->toHaveCount($itemCount);

    // Invariant 2: resident_id and delivery_type preserved
    expect($payload['resident_id'])->toBe($resident->id);
    expect($payload['delivery_type'])->toBe($deliveryType);

    // Invariant 3: Line items fields and subtotal correctness
    $expectedItemsTotal = 0.0;
    foreach ($items as $idx => $originalItem) {
        $assembledItem = $payload['items'][$idx];

        expect($assembledItem['trader_id'])->toBe((int) $originalItem['trader_id']);
        expect($assembledItem['product_id'])->toBe((int) $originalItem['product_id']);
        expect($assembledItem['quantity'])->toBe((float) $originalItem['quantity']);
        expect($assembledItem['unit_price'])->toBe((float) $originalItem['unit_price']);

        $expectedSubtotal = round((float) $originalItem['quantity'] * (float) $originalItem['unit_price'], 2);
        expect($assembledItem['subtotal'])->toBe($expectedSubtotal);

        $expectedItemsTotal += $expectedSubtotal;
    }

    // Invariant 4: total_amount = itemsTotal + deliveryFee
    $expectedTotal = round($expectedItemsTotal + (float) $payload['delivery_fee'], 2);
    expect($payload['total_amount'])->toBe($expectedTotal);
})->with(function () {
    $cases = [];
    for ($i = 0; $i < 100; $i++) {
        $count = rand(1, 15);
        $items = [];
        for ($j = 0; $j < $count; $j++) {
            $items[] = [
                'trader_id' => rand(1, 100),
                'product_id' => rand(1, 500),
                'product_name' => 'Product '.$j,
                'quantity' => rand(1, 20),
                'unit_price' => rand(10, 500) * 1.0,
                'lat' => -0.0917 + (rand(-20, 20) / 1000.0),
                'lon' => 34.7679 + (rand(-20, 20) / 1000.0),
            ];
        }

        $deliveryType = rand(0, 1) === 1 ? 'rider' : 'pickup';
        $cases[] = [$count, $items, $deliveryType];
    }
    return $cases;
});

<?php

namespace App\Services;

use App\Exceptions\PaymentFailedException;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\Trader;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MultiCheckoutService
{
    public function __construct(
        private MpesaService $mpesaService,
        private NotificationService $notificationService,
        private DeliveryFeeCalculator $deliveryFeeCalculator,
    ) {}

    /**
     * Assemble a checkout payload with one line item per commodity-trader pair.
     *
     * @param  array<int, array<string, mixed>>  $items
     * @return array<string, mixed>
     */
    public function assemblePayload(User $resident, array $items, string $deliveryType = 'pickup', array $residentLocation = []): array
    {
        $lineItems = [];
        $traderPositions = [];

        foreach ($items as $item) {
            $quantity = (float) $item['quantity'];
            $unitPrice = (float) $item['unit_price'];
            $lineItems[] = [
                'trader_id' => (int) $item['trader_id'],
                'product_id' => (int) $item['product_id'],
                'product_name' => (string) ($item['product_name'] ?? ''),
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'subtotal' => round($quantity * $unitPrice, 2),
            ];

            if (isset($item['lat'], $item['lon'])) {
                $traderPositions[] = ['lat' => (float) $item['lat'], 'lon' => (float) $item['lon']];
            }
        }

        $deliveryFee = 0.0;
        if ($deliveryType === 'rider' && isset($residentLocation['lat'], $residentLocation['lon'])) {
            $deliveryFee = $this->deliveryFeeCalculator->calculate(
                (float) $residentLocation['lat'],
                (float) $residentLocation['lon'],
                $traderPositions
            );
        }

        $itemsTotal = array_sum(array_column($lineItems, 'subtotal'));

        return [
            'resident_id' => $resident->id,
            'delivery_type' => $deliveryType,
            'delivery_fee' => $deliveryFee,
            'total_amount' => round($itemsTotal + $deliveryFee, 2),
            'items' => $lineItems,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function checkout(array $payload, User $resident): array
    {
        return DB::transaction(function () use ($payload, $resident) {
            $payment = $this->mpesaService->stkPush(
                $resident->phone,
                (float) $payload['total_amount'],
                'MULTI-'.Str::uuid(),
                'Soko Mtaa multi-trader order'
            );

            if (! is_array($payment) || (string) ($payment['ResponseCode'] ?? '') !== '0') {
                throw new PaymentFailedException($payment['ResponseDescription'] ?? 'STK Push failed');
            }

            $codes = [];
            $notifiedTraders = [];

            foreach ($payload['items'] as $item) {
                $reservation = Reservation::create([
                    'reservation_code' => 'SM-'.strtoupper(Str::random(8)),
                    'resident_id' => $resident->id,
                    'trader_id' => $item['trader_id'],
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_amount' => $item['subtotal'],
                    'status' => 'paid',
                    'pickup_deadline' => now()->addHours(24),
                ]);
                $codes[] = $reservation->reservation_code;
                $notifiedTraders[$item['trader_id']] = true;
            }

            foreach (array_keys($notifiedTraders) as $traderId) {
                $trader = Trader::with('user')->find($traderId);
                if ($trader?->user) {
                    $productName = collect($payload['items'])
                        ->firstWhere('trader_id', $traderId)['product_name'] ?? 'order';
                    $this->notificationService->send(
                        $trader->user,
                        "🛒 New Order! #{$codes[0]}",
                        "{$resident->name} reserved {$productName}. Prepare this item. Pickup window: 24 hours.",
                        'reservation',
                        ['template' => 'T07'],
                        true
                    );
                }
            }

            return [
                'status' => 'paid',
                'reservation_count' => count($payload['items']),
                'reservation_codes' => $codes,
            ];
        });
    }
}

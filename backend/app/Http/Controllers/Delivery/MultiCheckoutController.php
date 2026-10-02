<?php

namespace App\Http\Controllers\Delivery;

use App\Exceptions\PaymentFailedException;
use App\Http\Controllers\Controller;
use App\Services\MultiCheckoutService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MultiCheckoutController extends Controller
{
    use ApiResponse;

    public function __construct(private MultiCheckoutService $checkoutService) {}

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.trader_id' => 'required|integer',
            'items.*.product_id' => 'required|integer',
            'items.*.product_name' => 'nullable|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.lat' => 'nullable|numeric',
            'items.*.lon' => 'nullable|numeric',
            'delivery_type' => 'nullable|in:pickup,rider',
            'resident_lat' => 'nullable|numeric',
            'resident_lon' => 'nullable|numeric',
        ]);

        $payload = $this->checkoutService->assemblePayload(
            $request->user(),
            $validated['items'],
            $validated['delivery_type'] ?? 'pickup',
            [
                'lat' => $validated['resident_lat'] ?? null,
                'lon' => $validated['resident_lon'] ?? null,
            ]
        );

        try {
            $result = $this->checkoutService->checkout($payload, $request->user());
        } catch (PaymentFailedException $e) {
            return $this->error($e->getMessage(), 'PAYMENT_FAILED', 402);
        }

        return $this->success($result, 'Multi-merchant checkout initiated');
    }
}

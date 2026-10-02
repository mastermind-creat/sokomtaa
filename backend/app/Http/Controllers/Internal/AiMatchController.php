<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\StallLocationConverter;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiMatchController extends Controller
{
    use ApiResponse;

    public function match(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'commodities' => 'required|array|min:1',
            'commodities.*.name' => 'required|string',
            'commodities.*.quantity' => 'required|numeric',
            'commodities.*.unit' => 'required|string',
            'resident_lat' => 'required|numeric|between:-90,90',
            'resident_lon' => 'required|numeric|between:-180,180',
            'radius_km' => 'nullable|numeric|min:0.1|max:50',
        ]);

        $radiusKm = (float) ($validated['radius_km'] ?? 5.0);
        $matches = [];

        foreach ($validated['commodities'] as $commodity) {
            $name = $commodity['name'];

            $products = Product::query()
                ->with(['trader.stall', 'trader'])
                ->where('is_active', true)
                ->where('stock_status', '!=', 'out_of_stock')
                ->where(function ($q) use ($name) {
                    $q->where('name', 'like', '%'.$name.'%')
                        ->orWhere('name_sw', 'like', '%'.$name.'%');
                })
                ->whereHas('trader', fn ($q) => $q->where('is_open', true)->where('verification_status', 'verified'))
                ->get()
                ->filter(function (Product $product) use ($validated, $radiusKm) {
                    $stall = $product->trader?->stall;
                    if (! $stall) {
                        return false;
                    }
                    $coords = $stall->coordinatePair();
                    if ($coords === null) {
                        return false;
                    }

                    $km = StallLocationConverter::haversineKm(
                        (float) $validated['resident_lat'],
                        (float) $validated['resident_lon'],
                        $coords['lat'],
                        $coords['lon'],
                    );

                    return $km <= $radiusKm;
                })
                ->sortBy(fn (Product $product) => (float) $product->price)
                ->values();

            $matches[] = [
                'commodity' => $name,
                'traders' => $products->map(function (Product $product) {
                    return [
                        'trader_id' => $product->trader_id,
                        'business_name' => $product->trader->business_name,
                        'product_id' => $product->id,
                        'price' => (float) $product->price,
                        'average_rating' => (float) ($product->trader->average_rating ?? 0),
                        'stall_number' => $product->trader->stall?->stall_number,
                    ];
                })->all(),
            ];
        }

        return $this->success($matches, 'Trader matches retrieved successfully');
    }
}

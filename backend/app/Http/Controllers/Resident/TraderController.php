<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\Trader;
use App\Models\Product;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TraderController extends Controller
{
    use ApiResponse;

    /**
     * Display a trader's public storefront.
     */
    public function show(Trader $trader): JsonResponse
    {
        // Only show verified traders
        if ($trader->verification_status !== 'verified') {
            return $this->error('Mfanyabiashara huyu bado hakuhakikiwa. (This trader is not yet verified.)', 'NOT_VERIFIED', 403);
        }

        $trader->load(['stall', 'market']);

        // Get trader's active products
        $products = Product::where('trader_id', $trader->id)
            ->where('is_active', true)
            ->with('category')
            ->latest()
            ->paginate(12);

        return $this->success([
            'trader' => $trader,
            'products' => $products
        ]);
    }

    /**
     * Search for traders / discovery.
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->input('q');
        $categoryId = $request->input('category_id');
        $marketId = $request->input('market_id');

        $traders = Trader::where('verification_status', 'verified')
            ->when($query, function ($q) use ($query) {
                $q->where('business_name', 'like', "%{$query}%")
                  ->orWhere('business_name_sw', 'like', "%{$query}%");
            })
            ->when($marketId, function ($q) use ($marketId) {
                $q->where('market_id', $marketId);
            })
            ->when($categoryId, function ($q) use ($categoryId) {
                $q->whereHas('products', function ($p) use ($categoryId) {
                    $p->where('category_id', $categoryId);
                });
            })
            ->with(['market', 'stall'])
            ->paginate(15);

        return $this->success($traders);
    }
}

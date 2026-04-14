<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\ProductWatchlist;
use App\Models\Product;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class WatchlistController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $items = ProductWatchlist::where('user_id', Auth::id())
            ->with(['product:id,name,price,unit,stock_status,image_url,is_active,trader_id',
                    'product.trader:id,business_name'])
            ->latest()
            ->get();

        return $this->success($items);
    }

    public function store(Product $product): JsonResponse
    {
        $item = ProductWatchlist::firstOrCreate([
            'user_id'    => Auth::id(),
            'product_id' => $product->id,
        ], ['notify_on_available' => true]);

        return $this->success($item, 'Product added to watchlist.', 201);
    }

    public function destroy(Product $product): JsonResponse
    {
        ProductWatchlist::where('user_id', Auth::id())
            ->where('product_id', $product->id)
            ->delete();

        return $this->success(null, 'Removed from watchlist.');
    }

    public function toggleNotify(Product $product): JsonResponse
    {
        $item = ProductWatchlist::where('user_id', Auth::id())
            ->where('product_id', $product->id)
            ->firstOrFail();

        $item->update(['notify_on_available' => !$item->notify_on_available]);

        return $this->success($item, 'Notification preference updated.');
    }
}

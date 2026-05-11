<?php

namespace App\Http\Controllers\Trader;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Payment;
use App\Models\Product;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class TraderAnalyticsController extends Controller
{
    use ApiResponse;

    /**
     * Get high-level dashboard metrics for the trader.
     */
    public function dashboardStats(): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $traderId = $user->trader->id;

        $thisMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();

        $thisMonthRevenue = Payment::whereHas('reservation', function($q) use ($traderId) {
                $q->where('trader_id', $traderId);
            })
            ->where('status', 'completed')
            ->where('paid_at', '>=', $thisMonth)
            ->sum('amount');

        $lastMonthRevenue = Payment::whereHas('reservation', function($q) use ($traderId) {
                $q->where('trader_id', $traderId);
            })
            ->where('status', 'completed')
            ->where('paid_at', '>=', $lastMonth)
            ->where('paid_at', '<', $thisMonth)
            ->sum('amount');

        $growth = 0;
        if ($lastMonthRevenue > 0) {
            $growth = round((($thisMonthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100, 1);
        }

        $stats = [
            'total_revenue' => Payment::whereHas('reservation', function($q) use ($traderId) {
                $q->where('trader_id', $traderId);
            })->where('status', 'completed')->sum('amount'),
            
            'pending_reservations' => Reservation::where('trader_id', $traderId)->where('status', 'pending')->count(),
            
            'completed_reservations' => Reservation::where('trader_id', $traderId)->where('status', 'completed')->count(),
            
            'low_stock_items' => Product::where('trader_id', $traderId)->where('stock_status', 'low')->count(),
            
            'out_of_stock_items' => Product::where('trader_id', $traderId)->where('stock_status', 'out_of_stock')->count(),
            'profile_views' => $user->trader->profile_views,
            'growth' => ($growth >= 0 ? '+' : '') . $growth . '%',
            'has_overdue_fees' => \App\Models\MarketFee::where('trader_id', $traderId)->where('status', 'unpaid')->where('due_date', '<', now())->exists(),
        ];

        return $this->success($stats);
    }

    /**
     * Get menu counts for trader sidebar.
     */
    public function menuCounts(): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $traderId = $user->trader->id;

        return $this->success([
            'reservations' => Reservation::where('trader_id', $traderId)->where('status', 'pending')->count(),
            'low_stock' => Product::where('trader_id', $traderId)->whereIn('stock_status', ['low', 'out_of_stock'])->count(),
            'unread_notifications' => $user->notifications()->where('is_read', false)->count(),
        ]);
    }

    /**
     * Get revenue trends for the last 30 days.
     */
    public function revenueTrends(): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $traderId = $user->trader->id;

        $days = 30;
        $trends = Payment::whereHas('reservation', function($q) use ($traderId) {
                $q->where('trader_id', $traderId);
            })
            ->where('payments.status', 'completed')
            ->where('paid_at', '>=', now()->subDays($days))
            ->select([
                DB::raw('DATE(paid_at) as date'),
                DB::raw('SUM(amount) as total')
            ])
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return $this->success($trends);
    }

    /**
     * Get top-selling products by volume.
     */
    public function topProducts(): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $traderId = $user->trader->id;

        $top = Product::where('trader_id', $traderId)
            ->where('total_reservations', '>', 0)
            ->with('category')
            ->orderByDesc('total_reservations')
            ->limit(5)
            ->get();

        return $this->success($top);
    }

    /**
     * Get price intelligence/insights compared to local market averages.
     */
    public function priceInsights(): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $trader = $user->trader;
        $marketId = $trader->market_id;

        // 1. Get average prices for each category in THIS specific market
        $marketAverages = Product::query()
            ->join('traders', 'products.trader_id', '=', 'traders.id')
            ->where('traders.market_id', $marketId)
            ->where('products.is_active', true)
            ->select('category_id', DB::raw('AVG(price) as average_price'))
            ->groupBy('category_id')
            ->get()
            ->pluck('average_price', 'category_id');

        // 2. Get trader's products and compare
        $traderProducts = Product::where('trader_id', $trader->id)
            ->where('is_active', true)
            ->get()
            ->map(function ($product) use ($marketAverages) {
                $avgPrice = $marketAverages[$product->category_id] ?? 0;
                $sentiment = 'competitive';
                $diffPercent = 0;

                if ($avgPrice > 0) {
                    $diffPercent = (($product->price - $avgPrice) / $avgPrice) * 100;
                    if ($diffPercent > 10) $sentiment = 'high';
                    if ($diffPercent < -10) $sentiment = 'low';
                }

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'price' => $product->price,
                    'market_average' => round($avgPrice, 2),
                    'difference_percent' => round($diffPercent, 1),
                    'sentiment' => $sentiment
                ];
            });

        return $this->success([
            'market_id' => $marketId,
            'insights' => $traderProducts
        ]);
    }
}

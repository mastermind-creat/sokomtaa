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

        // Revenue = sum of product earnings (unit_price * quantity) for paid/ready/completed reservations
        // This works in dev without M-Pesa callbacks completing the Payment records
        $totalRevenue = Reservation::where('trader_id', $traderId)
            ->whereIn('status', ['paid', 'ready', 'completed'])
            ->selectRaw('SUM(unit_price * quantity) as total')
            ->value('total') ?? 0;

        $thisMonthRevenue = Reservation::where('trader_id', $traderId)
            ->whereIn('status', ['paid', 'ready', 'completed'])
            ->where('created_at', '>=', $thisMonth)
            ->selectRaw('SUM(unit_price * quantity) as total')
            ->value('total') ?? 0;

        $lastMonthRevenue = Reservation::where('trader_id', $traderId)
            ->whereIn('status', ['paid', 'ready', 'completed'])
            ->where('created_at', '>=', $lastMonth)
            ->where('created_at', '<', $thisMonth)
            ->selectRaw('SUM(unit_price * quantity) as total')
            ->value('total') ?? 0;

        $growth = 0;
        if ($lastMonthRevenue > 0) {
            $growth = round((($thisMonthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100, 1);
        } elseif ($thisMonthRevenue > 0) {
            $growth = 100;
        }

        // Active reservations = all statuses that need trader attention
        $activeReservations = Reservation::where('trader_id', $traderId)
            ->whereIn('status', ['pending', 'paid', 'ready'])
            ->count();

        $stats = [
            'total_revenue'           => (float) $totalRevenue,
            'active_reservations'     => $activeReservations,
            'pending_reservations'    => Reservation::where('trader_id', $traderId)->where('status', 'pending')->count(),
            'completed_reservations'  => Reservation::where('trader_id', $traderId)->where('status', 'completed')->count(),
            'low_stock_items'         => Product::where('trader_id', $traderId)->where('stock_status', 'low')->count(),
            'out_of_stock_items'      => Product::where('trader_id', $traderId)->where('stock_status', 'out_of_stock')->count(),
            'profile_views'           => (int) $user->trader->profile_views,
            'growth'                  => ($growth >= 0 ? '+' : '') . $growth . '%',
            'has_overdue_fees'        => \App\Models\MarketFee::where('trader_id', $traderId)
                                            ->where('status', 'unpaid')
                                            ->where('due_date', '<', now())
                                            ->exists(),
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

        // Use reservation amounts (product earnings only) grouped by date
        $trends = Reservation::where('trader_id', $traderId)
            ->whereIn('status', ['paid', 'ready', 'completed'])
            ->where('created_at', '>=', now()->subDays($days))
            ->select([
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(unit_price * quantity) as total')
            ])
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $summary = [
            'peak_revenue'      => $trends->max('total') ?: 0,
            'average_daily'     => $trends->count() > 0 ? $trends->avg('total') : 0,
            'total_period'      => $trends->sum('total'),
            'forecasted_growth' => 0,
        ];

        // Fill in missing dates with zero for a continuous graph
        $filledTrends = [];
        for ($i = $days; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $match = $trends->firstWhere('date', $date);
            $filledTrends[] = [
                'date'  => $date,
                'total' => $match ? (float) $match->total : 0,
            ];
        }

        return $this->success([
            'trends'  => $filledTrends,
            'summary' => $summary,
        ]);
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

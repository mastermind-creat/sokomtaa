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

        $stats = [
            'total_revenue' => Payment::whereHas('reservation', function($q) use ($traderId) {
                $q->where('trader_id', $traderId);
            })->where('status', 'completed')->sum('amount'),
            
            'pending_reservations' => Reservation::where('trader_id', $traderId)->where('status', 'pending')->count(),
            
            'completed_reservations' => Reservation::where('trader_id', $traderId)->where('status', 'completed')->count(),
            
            'low_stock_items' => Product::where('trader_id', $traderId)->where('stock_status', 'low')->count(),
            
            'out_of_stock_items' => Product::where('trader_id', $traderId)->where('stock_status', 'out_of_stock')->count(),
        ];

        return $this->success($stats);
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
}

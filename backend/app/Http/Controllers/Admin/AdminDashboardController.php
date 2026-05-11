<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Trader;
use App\Models\Stall;
use App\Models\MarketFee;
use App\Models\Complaint;
use App\Models\StallApplication;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AdminDashboardController extends Controller
{
    /**
     * Get high-level statistics for the admin dashboard.
     */
    public function stats(): JsonResponse
    {
        $now = Carbon::now();
        $thisMonth = $now->format('Y-m');
        $lastMonth = $now->subMonth()->format('Y-m');

        // Revenue
        $totalRevenue = MarketFee::where('status', 'paid')->sum('amount');
        $thisMonthRevenue = MarketFee::where('status', 'paid')
            ->where('paid_at', '>=', Carbon::now()->startOfMonth())
            ->sum('amount');
        
        $target = 100000.00; // Realistic monthly target
        
        // Traders
        $activeTraders = Trader::where('verification_status', 'verified')->count();
        $pendingTraders = Trader::where('verification_status', 'pending')->count();
        
        $newTradersThisMonth = Trader::where('created_at', '>=', Carbon::now()->startOfMonth())->count();
        
        // Stalls
        $totalStalls = Stall::count();
        $occupiedStalls = Stall::where('status', 'occupied')->count();
        $occupancyRate = $totalStalls > 0 ? round(($occupiedStalls / $totalStalls) * 100, 1) : 0;
        
        // Complaints
        $pendingComplaints = Complaint::whereIn('status', ['open', 'in_review'])->count();

        return response()->json([
            'success' => true,
            'message' => 'Admin dashboard stats retrieved successfully',
            'data' => [
                'revenue' => [
                    'total' => (float) $totalRevenue,
                    'this_month' => (float) $thisMonthRevenue,
                    'target' => $target,
                    'percentage' => $target > 0 ? round(($thisMonthRevenue / $target) * 100, 1) : 0
                ],
                'traders' => [
                    'total' => $activeTraders,
                    'pending' => $pendingTraders,
                    'new_this_month' => $newTradersThisMonth
                ],
                'stalls' => [
                    'total' => $totalStalls,
                    'occupied' => $occupiedStalls,
                    'occupancy_rate' => $occupancyRate
                ],
                'complaints' => [
                    'pending' => $pendingComplaints,
                    'urgent' => Complaint::where('priority', 3)->where('status', 'open')->count()
                ]
            ]
        ]);
    }

    /**
     * Get menu counts for sidebar badges.
     */
    public function menuCounts(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'applications' => StallApplication::where('status', 'pending')->count(),
                'complaints' => Complaint::where('status', 'open')->count(),
                'traders_pending' => Trader::where('verification_status', 'pending')->count(),
                'fees_overdue' => MarketFee::where('status', 'unpaid')
                    ->where('due_date', '<', Carbon::now())
                    ->count()
            ]
        ]);
    }

    /**
     * Get revenue trends for the last 6 months.
     */
    public function revenueTrends(): JsonResponse
    {
        $trends = MarketFee::where('status', 'paid')
            ->select(
                DB::raw("SUM(amount) as total"),
                DB::raw("period as month")
            )
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->take(6)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $trends
        ]);
    }
}

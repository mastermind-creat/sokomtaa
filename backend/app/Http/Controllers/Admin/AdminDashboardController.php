<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Trader;
use App\Models\Stall;
use App\Models\MarketFee;
use App\Models\Complaint;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    /**
     * Get high-level statistics for the admin dashboard.
     */
    public function stats(): JsonResponse
    {
        $totalRevenue = MarketFee::where('status', 'paid')->sum('amount');
        $activeTraders = Trader::where('verification_status', 'verified')->count();
        $pendingTraders = Trader::where('verification_status', 'pending')->whereNotNull('id_front_url')->count();
        
        $totalStalls = Stall::count();
        $occupiedStalls = Stall::where('status', 'occupied')->count();
        $occupancyRate = $totalStalls > 0 ? round(($occupiedStalls / $totalStalls) * 100, 1) : 0;
        
        $pendingComplaints = Complaint::whereIn('status', ['open', 'in_review'])->count();

        return response()->json([
            'success' => true,
            'message' => 'Admin dashboard stats retrieved successfully',
            'data' => [
                'revenue' => [
                    'total' => (float) $totalRevenue,
                    'target' => 500000.00, // Hardcoded target for now
                    'percentage' => round(($totalRevenue / 500000) * 100, 1)
                ],
                'traders' => [
                    'total' => $activeTraders,
                    'pending' => $pendingTraders,
                    'growth' => 12 // Hardcoded mock growth
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

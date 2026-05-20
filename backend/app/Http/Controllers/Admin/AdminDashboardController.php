<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Trader;
use App\Models\Stall;
use App\Models\MarketFee;
use App\Models\Complaint;
use App\Models\StallApplication;
use App\Models\Reservation;
use App\Models\Payment;
use App\Models\DeliveryProfile;
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
        
        // Service Fees (Resident)
        $totalServiceFees = Reservation::whereIn('status', ['paid', 'ready', 'completed'])->sum('service_fee');
        $thisMonthServiceFees = Reservation::whereIn('status', ['paid', 'ready', 'completed'])
            ->where('updated_at', '>=', Carbon::now()->startOfMonth())
            ->sum('service_fee');
        
        $target = 100000.00; // Realistic monthly target
        
        // Traders
        $activeTraders = Trader::where('verification_status', 'verified')->count();
        $pendingTraders = Trader::where('verification_status', 'pending')->count();
        
        $newTradersThisMonth = Trader::where('created_at', '>=', Carbon::now()->startOfMonth())->count();
        
        // Delivery
        $pendingRiders = DeliveryProfile::where('verification_status', 'pending')->count();
        
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
                    'service_fees_total' => (float) $totalServiceFees,
                    'service_fees_month' => (float) $thisMonthServiceFees,
                    'target' => $target,
                    'percentage' => $target > 0 ? round(($thisMonthRevenue / $target) * 100, 1) : 0
                ],
                'traders' => [
                    'total' => $activeTraders,
                    'pending' => $pendingTraders,
                    'new_this_month' => $newTradersThisMonth
                ],
                'delivery' => [
                    'pending' => $pendingRiders
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
                'riders_pending' => DeliveryProfile::where('verification_status', 'pending')->count(),
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
        $months = collect(range(5, 0))->map(function($i) {
            return Carbon::now()->subMonths($i)->format('Y-m');
        })->reverse();

        $data = $months->map(function($month) {
            $date = Carbon::createFromFormat('Y-m', $month);
            
            // Market Fees (Stall Revenue)
            $marketFees = MarketFee::where('status', 'paid')
                ->where('period', $month)
                ->sum('amount');

            // Service Fees (Platform Revenue)
            $serviceFees = Payment::where('type', 'reservation')
                ->where('status', 'completed')
                ->whereMonth('paid_at', $date->month)
                ->whereYear('paid_at', $date->year)
                ->sum('amount');

            return [
                'month' => $date->format('M'),
                'market_fees' => (float)$marketFees,
                'service_fees' => (float)$serviceFees,
                'total' => (float)($marketFees + $serviceFees)
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }
}

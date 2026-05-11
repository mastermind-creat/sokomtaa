<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReservationController extends Controller
{
    /**
     * Display a listing of all reservations.
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status', 'all');
        
        $query = Reservation::with(['resident', 'trader', 'product']);

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $reservations = $query->latest()
            ->get()
            ->map(function ($r) {
                return [
                    'id' => $r->id,
                    'reservation_code' => $r->reservation_code,
                    'resident' => [
                        'id' => $r->resident->id,
                        'name' => $r->resident->name,
                    ],
                    'trader' => [
                        'id' => $r->trader->id,
                        'business_name' => $r->trader->business_name,
                    ],
                    'product' => [
                        'id' => $r->product->id,
                        'name' => $r->product->name,
                    ],
                    'quantity' => $r->quantity,
                    'status' => $r->status,
                    'total_amount' => (float) $r->total_amount,
                    'pickup_deadline' => $r->pickup_deadline ? $r->pickup_deadline->toIso8601String() : null,
                    'created_at' => $r->created_at->toIso8601String()
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Reservations retrieved successfully.',
            'data' => $reservations
        ]);
    }

    /**
     * Get reservation statistics for the commercial ledger.
     */
    public function stats(): JsonResponse
    {
        $thisMonth = Carbon::now()->startOfMonth();
        
        // Active Revenue (Paid + Ready + Completed this month)
        $activeRev = Reservation::whereIn('status', ['paid', 'ready', 'completed'])
            ->where('created_at', '>=', $thisMonth)
            ->sum('total_amount');

        // Pickup Ready count
        $pickupReady = Reservation::where('status', 'ready')->count();

        // Integrity (Successful fulfillment rate)
        $completed = Reservation::where('status', 'completed')->count();
        $failed = Reservation::whereIn('status', ['cancelled', 'expired'])->count();
        $totalEnded = $completed + $failed;
        
        $integrity = $totalEnded > 0 ? round(($completed / $totalEnded) * 100, 1) : 100;

        return response()->json([
            'success' => true,
            'data' => [
                'active_rev' => (float) $activeRev,
                'pickup_ready' => $pickupReady,
                'integrity' => $integrity
            ]
        ]);
    }

    /**
     * Propagate revenue report to all relevant stakeholders (Admins).
     */
    public function propagateReport(Request $request): JsonResponse
    {
        // 1. Calculate the report data
        $thisMonth = Carbon::now()->startOfMonth();
        $totalRevenue = Reservation::where('status', 'completed')
            ->where('created_at', '>=', $thisMonth)
            ->sum('total_amount');
        
        $orderCount = Reservation::where('created_at', '>=', $thisMonth)->count();

        // 2. Identify stakeholders (all Admins)
        $admins = User::where('role', 'admin')->get();

        // 3. Dispatch internal notifications
        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'title' => 'Monthly Revenue Report Propagated',
                'body' => "The commercial ledger report for " . Carbon::now()->format('F Y') . " has been generated. Total Revenue: KES " . number_format($totalRevenue) . " across " . $orderCount . " reservations.",
                'type' => 'report',
                'data' => [
                    'revenue' => $totalRevenue,
                    'orders' => $orderCount,
                    'period' => Carbon::now()->format('Y-m')
                ]
            ]);
        }

        // 4. In a real scenario, we might trigger an email or SMS here
        // For now, we return success with the summary

        return response()->json([
            'success' => true,
            'message' => 'Revenue report propagated to all administrative stakeholders successfully. (Ripoti ya mapato imetumwa kwa wasimamizi wote.)',
            'summary' => [
                'total_revenue' => (float) $totalRevenue,
                'orders' => $orderCount,
                'stakeholders_notified' => $admins->count()
            ]
        ]);
    }
}

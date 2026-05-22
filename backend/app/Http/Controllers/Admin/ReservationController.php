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
                    'quantity'        => $r->quantity,
                    'status'          => $r->status,
                    'total_amount'    => (float) $r->total_amount,
                    // Trader's product earnings only (excludes delivery fee & service fee)
                    'product_subtotal'=> round((float) $r->unit_price * $r->quantity, 2),
                    'delivery_fee'    => (float) $r->delivery_fee,
                    'service_fee'     => (float) $r->service_fee,
                    'pickup_deadline' => $r->pickup_deadline ? $r->pickup_deadline->toIso8601String() : null,
                    'created_at'      => $r->created_at->toIso8601String()
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
     *
     * Revenue breakdown:
     *   product_rev  = SUM(unit_price * quantity)  — trader product earnings
     *   delivery_rev = SUM(delivery_fee)           — total delivery fees collected
     *   service_rev  = SUM(service_fee)            — platform service fees
     *   total_rev    = sum of all three above      — total transaction volume
     */
    public function stats(): JsonResponse
    {
        $thisMonth = Carbon::now()->startOfMonth();

        $base = Reservation::whereIn('status', ['paid', 'ready', 'completed'])
            ->where('created_at', '>=', $thisMonth);

        // Trader product revenue only (excludes delivery fee & service fee)
        $productRev  = $base->clone()->selectRaw('SUM(unit_price * quantity) as total')->value('total') ?? 0;
        $deliveryRev = $base->clone()->sum('delivery_fee');
        $serviceRev  = $base->clone()->sum('service_fee');

        // Pickup Ready count
        $pickupReady = Reservation::where('status', 'ready')->count();

        // Integrity (Successful fulfillment rate)
        $completed  = Reservation::where('status', 'completed')->count();
        $failed     = Reservation::whereIn('status', ['cancelled', 'expired'])->count();
        $totalEnded = $completed + $failed;
        $integrity  = $totalEnded > 0 ? round(($completed / $totalEnded) * 100, 1) : 100;

        return response()->json([
            'success' => true,
            'data' => [
                // Trader earnings (product sales only)
                'active_rev'   => (float) $productRev,
                // Full breakdown for admin ledger
                'product_rev'  => (float) $productRev,
                'delivery_rev' => (float) $deliveryRev,
                'service_rev'  => (float) $serviceRev,
                'total_rev'    => round((float) $productRev + (float) $deliveryRev + (float) $serviceRev, 2),
                'pickup_ready' => $pickupReady,
                'integrity'    => $integrity,
            ]
        ]);
    }

    /**
     * Propagate revenue report to all relevant stakeholders (Admins).
     *
     * Uses product-only revenue (unit_price × quantity) as the trader earnings
     * figure, keeping delivery fees and service fees separate so the report
     * is not inflated by fees that never reach the trader.
     */
    public function propagateReport(Request $request): JsonResponse
    {
        $thisMonth = Carbon::now()->startOfMonth();

        $base = Reservation::where('status', 'completed')
            ->where('created_at', '>=', $thisMonth);

        // Trader product revenue only — excludes delivery & service fees
        $productRevenue  = $base->clone()->selectRaw('SUM(unit_price * quantity) as total')->value('total') ?? 0;
        $deliveryRevenue = $base->clone()->sum('delivery_fee');
        $serviceRevenue  = $base->clone()->sum('service_fee');
        $totalRevenue    = round((float) $productRevenue + (float) $deliveryRevenue + (float) $serviceRevenue, 2);

        $orderCount = Reservation::where('created_at', '>=', $thisMonth)->count();

        $admins = User::where('role', 'admin')->get();

        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'title'   => 'Monthly Revenue Report Propagated',
                'body'    => "Commercial ledger for " . Carbon::now()->format('F Y') .
                             " — Trader Sales: KES " . number_format($productRevenue) .
                             " | Delivery: KES " . number_format($deliveryRevenue) .
                             " | Service Fees: KES " . number_format($serviceRevenue) .
                             " | Total Volume: KES " . number_format($totalRevenue) .
                             " across " . $orderCount . " reservations.",
                'type' => 'report',
                'data' => [
                    'product_revenue'  => (float) $productRevenue,
                    'delivery_revenue' => (float) $deliveryRevenue,
                    'service_revenue'  => (float) $serviceRevenue,
                    'total_revenue'    => $totalRevenue,
                    'orders'           => $orderCount,
                    'period'           => Carbon::now()->format('Y-m'),
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Revenue report propagated to all administrative stakeholders successfully.',
            'summary' => [
                'product_revenue'         => (float) $productRevenue,
                'delivery_revenue'        => (float) $deliveryRevenue,
                'service_revenue'         => (float) $serviceRevenue,
                'total_revenue'           => $totalRevenue,
                'orders'                  => $orderCount,
                'stakeholders_notified'   => $admins->count(),
            ],
        ]);
    }
}

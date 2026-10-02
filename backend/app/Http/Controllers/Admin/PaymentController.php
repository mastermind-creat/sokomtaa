<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Payment;
use App\Models\MarketFee;
use App\Models\Reservation;
use Carbon\Carbon;

class PaymentController extends Controller
{
    /**
     * Return transaction records for Dispute resolutions and fee ledgers.
     */
    public function index(Request $request): JsonResponse
    {
        $type = $request->query('type', 'fees'); // 'fees' or 'reservations'
        
        $query = Payment::with(['user']);

        if ($type === 'fees') {
            $query->where('type', 'market_fee');
            
            // Calculate total volume for this type (all time or filtered)
            $totalVolume = Payment::where('type', 'market_fee')->where('status', 'completed')->sum('amount');
            $pendingCount = Payment::where('type', 'market_fee')->where('status', 'pending')->count();

            $payments = $query->latest()->paginate(20);
            
            $data = collect($payments->items())->map(function ($p) {
                $fee = MarketFee::with(['trader.stall', 'market'])
                    ->where('payment_id', $p->id)
                    ->first();

                return [
                    'id' => $p->id,
                    'ref' => $p->mpesa_transaction_id ?: "REF-{$p->id}",
                    'mpesa_id' => $p->mpesa_transaction_id,
                    'trader_name' => $fee ? ($fee->trader ? $fee->trader->business_name : 'N/A') : ($p->user ? $p->user->name : 'Unknown'),
                    'stall' => ($fee && $fee->trader && $fee->trader->stall) ? $fee->trader->stall->stall_number : 'N/A',
                    'period' => $fee ? $fee->period : ($p->created_at ? $p->created_at->format('M Y') : 'N/A'),
                    'amount' => (float) $p->amount,
                    'paid_at' => $p->paid_at ?: $p->created_at,
                    'status' => $p->status
                ];
            });
        } else {
            $query->where('type', 'reservation')->with(['reservation.trader', 'reservation.product']);
            
            $totalVolume = Payment::where('type', 'reservation')->where('status', 'completed')->sum('amount');
            $pendingCount = Payment::where('type', 'reservation')->where('status', 'pending')->count();

            $payments = $query->latest()->paginate(20);

            $data = collect($payments->items())->map(function ($p) {
                return [
                    'id' => $p->id,
                    'ref' => $p->mpesa_transaction_id ?: "REF-{$p->id}",
                    'code' => $p->reservation ? $p->reservation->reservation_code : 'N/A',
                    'resident' => $p->user ? $p->user->name : 'Unknown',
                    'trader' => ($p->reservation && $p->reservation->trader) ? $p->reservation->trader->business_name : 'Unknown',
                    'product' => ($p->reservation && $p->reservation->product) ? $p->reservation->product->name : 'Unknown',
                    'amount' => (float) $p->amount,
                    'paid_at' => $p->paid_at ?: $p->created_at,
                    'status' => $p->status,
                    'mpesa_id' => $p->mpesa_transaction_id
                ];
            });
        }

        return response()->json([
            'success' => true,
            'message' => 'Payments ledger retrieved.',
            'data' => [
                'data' => $data,
                'summary' => [
                    'total_volume' => (float) $totalVolume,
                    'pending_count' => $pendingCount,
                ],
                'meta' => [
                    'current_page' => $payments->currentPage(),
                    'last_page' => $payments->lastPage(),
                    'total' => $payments->total(),
                ]
            ]
        ]);
    }
}

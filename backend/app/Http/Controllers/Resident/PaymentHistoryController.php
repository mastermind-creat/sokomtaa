<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class PaymentHistoryController extends Controller
{
    use ApiResponse;

    /** Paginated list of this resident's payments. */
    public function index(): JsonResponse
    {
        $payments = Payment::where('user_id', Auth::id())
            ->with(['reservation:id,reservation_code,product_id', 'reservation.product:id,name'])
            ->latest()
            ->paginate(20);

        return $this->success($payments);
    }

    /** Summary: total spent this year + transaction count. */
    public function summary(): JsonResponse
    {
        $userId = Auth::id();
        $year = now()->year;

        $summary = [
            'total_spent_this_year' => Payment::where('user_id', $userId)
                ->where('status', 'completed')
                ->whereYear('paid_at', $year)
                ->sum('amount'),
            'transaction_count' => Payment::where('user_id', $userId)
                ->where('status', 'completed')
                ->count(),
        ];

        return $this->success($summary);
    }
}

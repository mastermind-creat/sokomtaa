<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use App\Models\MarketFee;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FeeController extends Controller
{
    use ApiResponse;

    /**
     * List all market fees for the authenticated trader.
     */
    public function index(): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        if (!$user->trader) {
            return $this->error('Mtumiaji huyu si mfanyabiashara. (User is not a trader.)', 'REQUIRED_TRADER', 403);
        }

        $fees = MarketFee::where('trader_id', $user->trader->id)
            ->with('payment')
            ->latest()
            ->paginate(15);

        return $this->success($fees);
    }

    /**
     * Get summary of fees (Total Paid, Total Unpaid).
     */
    public function summary(): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!$user->trader) {
            return $this->error('Mtumiaji huyu si mfanyabiashara. (User is not a trader.)', 'REQUIRED_TRADER', 403);
        }

        $summary = [
            'unpaid_count' => MarketFee::where('trader_id', $user->trader->id)->where('status', 'unpaid')->count(),
            'unpaid_amount' => MarketFee::where('trader_id', $user->trader->id)->where('status', 'unpaid')->sum('amount'),
            'paid_amount' => MarketFee::where('trader_id', $user->trader->id)->where('status', 'paid')->sum('amount'),
            'last_payment' => MarketFee::where('trader_id', $user->trader->id)->where('status', 'paid')->latest('paid_at')->first()?->paid_at,
        ];

        return $this->success($summary);
    }
}

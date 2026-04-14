<?php

namespace App\Http\Controllers\Trader;

use App\Http\Controllers\Controller;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Services\WalletService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WalletController extends Controller
{
    use ApiResponse;

    protected $walletService;

    public function __construct(WalletService $walletService)
    {
        $this->walletService = $walletService;
    }

    /**
     * Get the authenticated trader's wallet details.
     */
    public function index(): JsonResponse
    {
        $user = Auth::user();
        $trader = $user->trader;

        if (!$trader) {
            return $this->error('Mtumiaji huyu si mfanyabiashara. (User is not a trader.)', 'REQUIRED_TRADER', 403);
        }

        $wallet = $this->walletService->getOrCreateForTrader($trader->id);

        return $this->success([
            'id' => $wallet->id,
            'balance' => $wallet->balance,
            'currency' => $wallet->currency,
            'frequency' => $trader->fee_payment_frequency,
            'last_deduction' => $trader->last_fee_deduction_at,
            'is_active' => $wallet->is_active,
        ]);
    }

    /**
     * List paginated transaction history for the wallet.
     */
    public function transactions(): JsonResponse
    {
        $user = Auth::user();
        $trader = $user->trader;

        if (!$trader) {
            return $this->error('Unauthorized', 'UNAUTHORIZED', 403);
        }

        $wallet = $this->walletService->getOrCreateForTrader($trader->id);

        $transactions = WalletTransaction::where('wallet_id', $wallet->id)
            ->latest()
            ->paginate(15);

        return $this->success($transactions);
    }

    /**
     * Update the fee deduction frequency choice.
     */
    public function updateFrequency(Request $request): JsonResponse
    {
        $request->validate([
            'frequency' => 'required|in:daily,weekly,monthly',
        ]);

        $user = Auth::user();
        $trader = $user->trader;

        if (!$trader) {
            return $this->error('Unauthorized', 'UNAUTHORIZED', 403);
        }

        $trader->update([
            'fee_payment_frequency' => $request->frequency
        ]);

        return $this->success(null, 'Upendeleo wa malipo umebadilishwa. (Payment preference updated.)');
    }
}

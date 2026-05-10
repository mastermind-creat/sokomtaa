<?php

namespace App\Http\Controllers\Trader;

use App\Http\Controllers\Controller;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Services\WalletService;
use App\Services\NotificationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class WalletController extends Controller
{
    use ApiResponse;

    protected $walletService;
    protected $notificationService;

    public function __construct(WalletService $walletService, NotificationService $notificationService)
    {
        $this->walletService = $walletService;
        $this->notificationService = $notificationService;
    }

    /**
     * Get the authenticated trader's wallet details + summary stats.
     */
    public function index(): JsonResponse
    {
        $user = Auth::user();
        $trader = $user->trader;

        if (!$trader) {
            return $this->error('User is not a trader.', 'REQUIRED_TRADER', 403);
        }

        $wallet = $this->walletService->getOrCreateForTrader($trader->id);

        // Compute summary from transactions
        $totalCredits = $wallet->transactions()->where('type', 'credit')->sum('amount');
        $totalDebits  = $wallet->transactions()->where('type', 'debit')->sum('amount');
        $pendingWithdrawals = $wallet->transactions()
            ->where('type', 'debit')
            ->where('reference_type', 'withdrawal')
            ->where('status', 'pending')
            ->sum('amount');

        return $this->success([
            'id'                  => $wallet->id,
            'balance'             => $wallet->balance,
            'currency'            => $wallet->currency,
            'frequency'           => $trader->fee_payment_frequency,
            'last_deduction'      => $trader->last_fee_deduction_at,
            'is_active'           => $wallet->is_active,
            'total_credits'       => $totalCredits,
            'total_debits'        => $totalDebits,
            'pending_withdrawals' => $pendingWithdrawals,
            'mpesa_number'        => $trader->mpesa_number,
        ]);
    }

    /**
     * List paginated transaction history for the wallet.
     */
    public function transactions(Request $request): JsonResponse
    {
        $user = Auth::user();
        $trader = $user->trader;

        if (!$trader) {
            return $this->error('Unauthorized', 'UNAUTHORIZED', 403);
        }

        $wallet = $this->walletService->getOrCreateForTrader($trader->id);

        $query = WalletTransaction::where('wallet_id', $wallet->id)->latest();

        // Optional filter by type
        if ($request->query('type') && in_array($request->query('type'), ['credit', 'debit'])) {
            $query->where('type', $request->query('type'));
        }

        $transactions = $query->paginate(15);

        return $this->success($transactions);
    }

    /**
     * Request a withdrawal to the trader's M-Pesa number.
     */
    public function requestWithdrawal(Request $request): JsonResponse
    {
        $request->validate([
            'amount'      => 'required|numeric|min:10',
            'mpesa_phone' => ['required', 'string', 'regex:/^(?:254|\+254|0)?(7|1)[0-9]{8}$/'],
        ]);

        $user = Auth::user();
        $trader = $user->trader;

        if (!$trader) {
            return $this->error('User is not a trader.', 'REQUIRED_TRADER', 403);
        }

        $wallet = $this->walletService->getOrCreateForTrader($trader->id);

        if (!$wallet->is_active) {
            return $this->error('Your wallet is suspended. Please contact support.', 'WALLET_SUSPENDED', 403);
        }

        // Normalize phone
        $phone = $request->mpesa_phone;
        $phone = str_replace('+', '', $phone);
        if (str_starts_with($phone, '0')) {
            $phone = '254' . substr($phone, 1);
        }
        if (strlen($phone) === 9) {
            $phone = '254' . $phone;
        }

        try {
            $transaction = $this->walletService->requestWithdrawal($wallet, (float) $request->amount, $phone);

            // Notify the trader
            $this->notificationService->send(
                $user,
                'Withdrawal Requested',
                "Your withdrawal of KES " . number_format($request->amount, 2) . " to {$phone} has been received and is pending processing.",
                'withdrawal',
                ['transaction_id' => $transaction->id]
            );

            // Notify admins
            $admins = \App\Models\User::where('role', 'admin')->get();
            foreach ($admins as $admin) {
                $this->notificationService->send(
                    $admin,
                    'Withdrawal Request',
                    "{$trader->business_name} has requested a withdrawal of KES " . number_format($request->amount, 2) . " to M-Pesa {$phone}.",
                    'withdrawal',
                    ['transaction_id' => $transaction->id, 'trader_id' => $trader->id]
                );
            }

            Log::info('Withdrawal request created', [
                'trader_id'  => $trader->id,
                'amount'     => $request->amount,
                'phone'      => $phone,
                'tx_id'      => $transaction->id,
            ]);

            return $this->success([
                'transaction_id' => $transaction->id,
                'amount'         => $transaction->amount,
                'status'         => $transaction->status,
                'balance_after'  => $transaction->balance_after,
            ], 'Withdrawal request submitted. Funds will be sent to your M-Pesa within 24 hours.');

        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 'WITHDRAWAL_FAILED', 422);
        }
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

        $trader->update(['fee_payment_frequency' => $request->frequency]);

        return $this->success(null, 'Payment preference updated.');
    }
}

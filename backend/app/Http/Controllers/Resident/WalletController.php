<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\Wallet;
use App\Services\MpesaService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WalletController extends Controller
{
    use ApiResponse;

    protected $mpesaService;

    public function __construct(MpesaService $mpesaService)
    {
        $this->mpesaService = $mpesaService;
    }

    /**
     * Get the resident's wallet balance.
     */
    public function index(): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $wallet = $user->wallet()->firstOrCreate(
            ['user_id' => $user->id],
            ['balance' => 0, 'currency' => 'KES']
        );

        return $this->success([
            'balance' => $wallet->balance,
            'currency' => $wallet->currency,
        ]);
    }

    /**
     * Get the resident's wallet transaction history.
     */
    public function transactions(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        $wallet = $user->wallet()->firstOrCreate(
            ['user_id' => $user->id],
            ['balance' => 0, 'currency' => 'KES']
        );

        $transactions = $wallet->transactions()
            ->latest()
            ->paginate(15);

        return $this->success($transactions);
    }

    /**
     * Request a withdrawal from the wallet to M-Pesa.
     */
    public function withdraw(Request $request): JsonResponse
    {
        $request->validate([
            'amount' => 'required|numeric|min:50',
            'phone' => 'required|string',
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();
        $wallet = $user->wallet;

        if (!$wallet || $wallet->balance < $request->amount) {
            return $this->error('Insufficient wallet balance.', 'INSUFFICIENT_FUNDS', 422);
        }

        return DB::transaction(function () use ($request, $user, $wallet) {
            // 1. Deduct from wallet
            $wallet->balance -= $request->amount;
            $wallet->save();

            // 2. Log withdrawal transaction
            $transaction = $wallet->transactions()->create([
                'amount' => -$request->amount,
                'type' => 'withdrawal',
                'description' => 'M-Pesa Withdrawal',
                'reference_type' => 'mpesa_b2c',
                'status' => 'pending',
                'balance_after' => $wallet->balance,
            ]);

            // 3. Initiate B2C Payment via M-Pesa Service
            $b2cResponse = $this->mpesaService->b2cTransfer(
                $request->phone,
                $request->amount,
                "WD-" . Str::random(6)
            );

            if ($b2cResponse && isset($b2cResponse['ConversationID'])) {
                $transaction->update([
                    'reference_id' => $b2cResponse['ConversationID'],
                ]);

                // The actual success/fail status will be updated via Mpesa B2C Callback.
                return $this->success([
                    'transaction' => $transaction,
                    'message' => 'Withdrawal request initiated successfully. Funds will be sent to your M-Pesa shortly.'
                ]);
            } else {
                // Refund wallet if initiation failed
                $wallet->balance += $request->amount;
                $wallet->save();
                
                $transaction->update([
                    'status' => 'failed',
                    'balance_after' => $wallet->balance,
                    'description' => 'M-Pesa Withdrawal (Failed)',
                ]);

                return $this->error('Failed to initiate M-Pesa withdrawal. Please try again later.', 'B2C_FAILED', 500);
            }
        });
    }
}

<?php

namespace App\Http\Controllers\Trader;

use App\Http\Controllers\Controller;
use App\Models\Withdrawal;
use App\Models\SystemSetting;
use App\Services\MpesaService;
use App\Services\NotificationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WithdrawalController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected MpesaService       $mpesa,
        protected NotificationService $notifications,
    ) {}

    /**
     * Request an instant withdrawal via M-Pesa B2C.
     * POST /trader/wallet/withdraw
     */
    public function requestWithdrawal(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user   = Auth::user();
        $trader = $user->trader;

        if (!$trader) {
            return $this->error('Trader profile not found.', 'NOT_TRADER', 403);
        }

        $minAmount  = (float) SystemSetting::get('min_withdrawal_amount', 100);
        $fee        = (float) SystemSetting::get('withdrawal_fee', 5);

        $request->validate([
            'amount'       => "required|numeric|min:{$minAmount}",
            'mpesa_number' => 'nullable|string|max:20',
        ]);

        $amount     = (float) $request->amount;
        $netAmount  = $amount - $fee;
        $mpesaPhone = $request->filled('mpesa_number')
            ? $request->mpesa_number
            : ($trader->mpesa_number ?? $user->phone);

        // Normalize phone: ensure it starts with 254
        $mpesaPhone = preg_replace('/^0/', '254', preg_replace('/^\+/', '', $mpesaPhone));

        // Load wallet
        $wallet = $trader->wallet;
        if (!$wallet || $wallet->balance < $amount) {
            return $this->error(
                "Insufficient wallet balance. Available: KES " . number_format($wallet?->balance ?? 0, 2),
                'INSUFFICIENT_BALANCE',
                422
            );
        }

        return DB::transaction(function () use ($trader, $wallet, $amount, $fee, $netAmount, $mpesaPhone) {
            // Pessimistically deduct balance before B2C call (refund on failure)
            $wallet->decrement('balance', $amount);

            // Create withdrawal record
            $withdrawal = Withdrawal::create([
                'trader_id'    => $trader->id,
                'amount'       => $amount,
                'fee'          => $fee,
                'net_amount'   => $netAmount,
                'mpesa_number' => $mpesaPhone,
                'status'       => 'processing',
            ]);

            // Fire B2C
            $b2cResponse = $this->mpesa->b2cTransfer(
                $mpesaPhone,
                $netAmount,
                "Soko Mtaa Withdrawal #{$withdrawal->id}"
            );

            if (!$b2cResponse || !isset($b2cResponse['ConversationID'])) {
                // B2C call failed — refund wallet and mark failed
                $wallet->increment('balance', $amount);
                $withdrawal->update([
                    'status'         => 'failed',
                    'failure_reason' => 'Could not connect to M-Pesa. Please try again.',
                ]);

                Log::error('B2C initiation failed for withdrawal #' . $withdrawal->id, [
                    'response' => $b2cResponse,
                ]);

                return $this->error(
                    'Withdrawal failed: Could not reach M-Pesa. Your balance has not been deducted.',
                    'B2C_FAILED',
                    502
                );
            }

            // Store ConversationID for callback matching
            $withdrawal->update([
                'mpesa_conversation_id' => $b2cResponse['ConversationID'],
            ]);

            return $this->success([
                'withdrawal_id'   => $withdrawal->id,
                'amount'          => $amount,
                'fee'             => $fee,
                'net_amount'      => $netAmount,
                'mpesa_number'    => $mpesaPhone,
                'status'          => 'processing',
                'conversation_id' => $b2cResponse['ConversationID'],
            ], 'Withdrawal initiated. Funds will arrive shortly.');
        });
    }

    /**
     * M-Pesa B2C Result Callback — called by Safaricom.
     * POST /payments/mpesa/b2c-callback (public, no auth)
     */
    public function b2cCallback(Request $request): JsonResponse
    {
        $payload = $request->all();
        Log::info('B2C Callback received', $payload);

        $result        = $payload['Result'] ?? null;
        $conversationId = $result['ConversationID'] ?? null;

        if (!$conversationId) {
            return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
        }

        $withdrawal = Withdrawal::where('mpesa_conversation_id', $conversationId)->first();
        if (!$withdrawal) {
            Log::warning('B2C Callback: No withdrawal found for ConversationID ' . $conversationId);
            return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
        }

        $resultCode = $result['ResultCode'] ?? -1;

        if ($resultCode == 0) {
            // Success
            $transactionId = collect($result['ResultParameters']['ResultParameter'] ?? [])
                ->firstWhere('Key', 'TransactionID')['Value'] ?? null;

            $withdrawal->update([
                'status'               => 'completed',
                'mpesa_transaction_id' => $transactionId,
                'completed_at'         => now(),
            ]);

            // Notify user/trader
            if ($withdrawal->trader_id) {
                $trader = $withdrawal->trader;
                if ($trader?->user) {
                    $this->notifications->send(
                        $trader->user,
                        'Withdrawal Successful 🎉',
                        'KES ' . number_format($withdrawal->net_amount, 2) . ' has been sent to ' . $withdrawal->mpesa_number . '.',
                        'withdrawal',
                        ['withdrawal_id' => $withdrawal->id],
                        true // also send SMS
                    );
                }
            } elseif ($withdrawal->user_id) {
                $user = $withdrawal->user;
                if ($user) {
                    $this->notifications->send(
                        $user,
                        'Withdrawal Successful 🎉',
                        'KES ' . number_format($withdrawal->net_amount, 2) . ' has been sent to ' . $withdrawal->mpesa_number . '.',
                        'withdrawal',
                        ['withdrawal_id' => $withdrawal->id],
                        true
                    );
                }
            }
        } else {
            // Failed — refund wallet
            $withdrawal->update([
                'status'         => 'failed',
                'failure_reason' => $result['ResultDesc'] ?? 'M-Pesa transfer failed.',
            ]);

            if ($withdrawal->trader_id) {
                // Refund trader
                $withdrawal->trader->wallet?->increment('balance', $withdrawal->amount);
                
                $trader = $withdrawal->trader;
                if ($trader?->user) {
                    $this->notifications->send(
                        $trader->user,
                        'Withdrawal Failed',
                        'Your withdrawal of KES ' . number_format($withdrawal->amount, 2) . ' failed. Your wallet has been refunded.',
                        'withdrawal',
                        ['withdrawal_id' => $withdrawal->id],
                        false
                    );
                }
            } elseif ($withdrawal->user_id) {
                // Refund rider
                $withdrawal->user->deliveryProfile?->increment('earnings_balance', $withdrawal->amount);
                
                $user = $withdrawal->user;
                if ($user) {
                    $this->notifications->send(
                        $user,
                        'Withdrawal Failed',
                        'Your withdrawal of KES ' . number_format($withdrawal->amount, 2) . ' failed. Your wallet has been refunded.',
                        'withdrawal',
                        ['withdrawal_id' => $withdrawal->id],
                        false
                    );
                }
            }
        }

        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
    }

    /**
     * Get withdrawal history for the trader.
     * GET /trader/wallet/withdrawals
     */
    public function history(): JsonResponse
    {
        $trader = Auth::user()->trader;

        if (!$trader) {
            return $this->error('Trader profile not found.', 'NOT_TRADER', 403);
        }

        $withdrawals = Withdrawal::where('trader_id', $trader->id)
            ->latest()
            ->paginate(20);

        return $this->success($withdrawals);
    }
}

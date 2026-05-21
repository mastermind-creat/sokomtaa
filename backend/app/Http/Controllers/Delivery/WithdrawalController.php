<?php

namespace App\Http\Controllers\Delivery;

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
     * POST /delivery/wallet/withdraw
     */
    public function requestWithdrawal(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user   = Auth::user();
        $profile = $user->deliveryProfile;

        if (!$profile) {
            return $this->error('Delivery profile not found.', 'NOT_DELIVERY', 403);
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
            : $user->phone;

        // Normalize phone: ensure it starts with 254
        $mpesaPhone = preg_replace('/^0/', '254', preg_replace('/^\+/', '', $mpesaPhone));

        if ($profile->earnings_balance < $amount) {
            return $this->error(
                "Insufficient wallet balance. Available: KES " . number_format($profile->earnings_balance ?? 0, 2),
                'INSUFFICIENT_BALANCE',
                422
            );
        }

        return DB::transaction(function () use ($user, $profile, $amount, $fee, $netAmount, $mpesaPhone) {
            // Pessimistically deduct balance before B2C call (refund on failure)
            $profile->decrement('earnings_balance', $amount);

            // Create withdrawal record
            $withdrawal = Withdrawal::create([
                'user_id'      => $user->id,
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
                $profile->increment('earnings_balance', $amount);
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
     * Get withdrawal history for the rider.
     * GET /delivery/wallet/withdrawals
     */
    public function history(): JsonResponse
    {
        $user = Auth::user();

        if (!$user->deliveryProfile) {
            return $this->error('Delivery profile not found.', 'NOT_DELIVERY', 403);
        }

        $withdrawals = Withdrawal::where('user_id', $user->id)
            ->latest()
            ->paginate(20);

        return $this->success($withdrawals);
    }
}

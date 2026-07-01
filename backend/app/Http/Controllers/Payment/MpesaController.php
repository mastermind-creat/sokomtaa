<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use App\Models\MarketFee;
use App\Models\Payment;
use App\Models\Reservation;
use App\Services\MpesaService;
use App\Services\NotificationService;
use App\Services\WalletService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class MpesaController extends Controller
{
    use ApiResponse, \App\Traits\PhoneNormalization;

    protected $mpesaService;
    protected $notificationService;

    public function __construct(MpesaService $mpesaService, NotificationService $notificationService)
    {
        $this->mpesaService        = $mpesaService;
        $this->notificationService = $notificationService;
    }

    /**
     * Initiate STK Push for a Reservation, Market Fee, Wallet Top-up, or Product Boost.
     *
     * For RESERVATIONS only: if the target trader has custom Daraja credentials
     * the STK push is made with the trader's own keys so funds land directly in
     * their M-Pesa account. The platform's service-fee share is captured in
     * payment.platform_commission and will be billed via a new market-fee record.
     *
     * All other payment types ALWAYS use the platform credentials.
     */
    public function initiateSTK(Request $request): JsonResponse
    {
        $request->validate([
            'phone_number' => ['required', 'string', 'regex:/^(?:254|\+254|0)?(7|1)[0-9]{8}$/'],
            'type'         => 'required|in:reservation,market_fee,wallet_topup,product_boost',
            'target_id'    => 'required_if:type,market_fee,product_boost|integer',
            'target_ids'   => 'required_if:type,reservation|array',
            'target_ids.*' => 'integer',
            'amount'       => 'required_if:type,wallet_topup|numeric|min:1',
            'use_wallet'   => 'nullable|boolean',
        ]);

        $phone = $this->normalizePhone($request->phone_number);

        $user             = Auth::user();
        $amount           = 0;
        $ref              = '';
        $walletDeduction  = 0;
        $platformCommission = 0;

        // ── Determine active M-Pesa service instance ─────────────────────────
        // Default: platform service (injected via DI)
        $activeService = $this->mpesaService;
        $routing       = 'platform';
        $trader        = null; // will be set for reservation payments

        // ── Calculate amount per payment type ─────────────────────────────────
        if ($request->type === 'reservation') {
            $reservationIds = $request->target_ids;
            $reservations   = Reservation::whereIn('id', $reservationIds)->get();

            foreach ($reservations as $reservation) {
                if ($reservation->status !== 'pending') {
                    return $this->error(
                        "Reservation {$reservation->reservation_code} has already been paid or cancelled.",
                        'INVALID_STATUS',
                        422
                    );
                }
                $amount += $reservation->total_amount;
            }

            // Wallet partial/full coverage
            if ($request->boolean('use_wallet') && $user->wallet && $user->wallet->balance > 0) {
                if ($user->wallet->balance >= $amount) {
                    $walletDeduction = $amount;
                    $amount          = 0; // Fully covered by wallet
                } else {
                    $walletDeduction = $user->wallet->balance;
                    $amount         -= $walletDeduction;
                }
            }

            $ref = $reservations->first()->reservation_code . ($reservations->count() > 1 ? '+' : '');

            // ── Route to trader's own M-Pesa if configured ───────────────────
            // Only switch routing when STK is still needed (amount > 0)
            if ($amount > 0) {
                $trader = $reservations->first()->trader;
                if ($trader && $trader->hasValidCustomMpesa()) {
                    $activeService = MpesaService::forTrader($trader);
                    $routing       = 'custom_trader';

                    // Calculate platform's service-fee share to bill later
                    $platformCommission = $reservations->sum('service_fee');
                }
            }

        } elseif ($request->type === 'market_fee') {
            $fee = MarketFee::findOrFail($request->target_id);
            if ($fee->status === 'paid') {
                return $this->error('This fee has already been paid.', 'ALREADY_PAID', 422);
            }
            $amount = $fee->amount;
            $ref    = 'FEE-' . $fee->id;
            // Market fees always use platform credentials (routing stays 'platform')

        } elseif ($request->type === 'product_boost') {
            $product = \App\Models\Product::findOrFail($request->target_id);
            $amount  = 20.00;
            $ref     = 'BOOST-' . $product->id;

        } else {
            // Wallet top-up
            $amount = $request->amount;
            $ref    = 'TOPUP-' . $user->id;
        }

        // ── Wallet-only path (no STK needed) ─────────────────────────────────
        if ($amount == 0 && $walletDeduction > 0) {
            $checkoutRequestId = 'WALLET-' . Str::random(10);

            $payment = Payment::create([
                'reservation_id'          => $request->type === 'reservation' ? $request->target_ids[0] : null,
                'user_id'                 => $user->id,
                'mpesa_checkout_request_id' => $checkoutRequestId,
                'amount'                  => 0,
                'wallet_deduction'        => $walletDeduction,
                'platform_commission'     => 0,
                'routing'                 => 'platform',
                'phone_number'            => $phone,
                'type'                    => $request->type,
                'status'                  => 'pending',
            ]);

            Reservation::whereIn('id', $request->target_ids)->update([
                'mpesa_checkout_request_id' => $checkoutRequestId
            ]);

            $this->processSuccessfulPayment($payment, $checkoutRequestId, 'WALLET-TXN');

            return $this->success([
                'checkout_request_id' => $checkoutRequestId,
                'customer_message'    => 'Payment fully covered by wallet balance.',
                'status'              => 'completed',
            ], 'Payment successful using wallet balance.');
        }

        // ── STK Push ──────────────────────────────────────────────────────────
        $stkResponse = $activeService->stkPush(
            $phone,
            $amount,
            $ref,
            'Soko Mtaa ' . ucfirst($request->type)
        );

        // If trader's custom credentials fail, fall back to platform and log
        if ((!$stkResponse || $stkResponse['ResponseCode'] != '0') && $routing === 'custom_trader') {
            Log::warning('Trader custom M-Pesa failed; falling back to platform credentials', [
                'trader_id' => $trader?->id,
                'ref'       => $ref,
            ]);

            $activeService      = $this->mpesaService; // platform
            $routing            = 'platform';
            $platformCommission = 0; // wallet will be credited normally
            $stkResponse        = $activeService->stkPush(
                $phone, $amount, $ref, 'Soko Mtaa ' . ucfirst($request->type)
            );
        }

        if (!$stkResponse || $stkResponse['ResponseCode'] != '0') {
            return $this->error('M-Pesa initiation failed. Please try again.', 'MPESA_INIT_FAILED', 500);
        }

        // ── Persist payment record ────────────────────────────────────────────
        Payment::create([
            'reservation_id'          => $request->type === 'reservation' ? $request->target_ids[0] : null,
            'product_id'              => $request->type === 'product_boost' ? $request->target_id : null,
            'user_id'                 => $user->id,
            'mpesa_checkout_request_id' => $stkResponse['CheckoutRequestID'],
            'amount'                  => $amount,
            'wallet_deduction'        => $walletDeduction,
            'platform_commission'     => $platformCommission,
            'routing'                 => $routing,
            'phone_number'            => $phone,
            'type'                    => $request->type,
            'status'                  => 'pending',
        ]);

        if ($request->type === 'reservation') {
            Reservation::whereIn('id', $request->target_ids)->update([
                'mpesa_checkout_request_id' => $stkResponse['CheckoutRequestID']
            ]);
        }

        return $this->success([
            'checkout_request_id' => $stkResponse['CheckoutRequestID'],
            'customer_message'    => $stkResponse['CustomerMessage'],
            'routing'             => $routing,
        ], 'Payment request sent to your phone. Please enter your M-Pesa PIN.');
    }

    /**
     * Internal helper: finalise a successful payment.
     *
     * Custom-trader reservation payments:
     *   - Money already landed directly in the trader's M-Pesa → no wallet credit
     *   - A market-fee record is created for the platform's service-fee share
     *
     * Platform reservation payments (default):
     *   - Trader's wallet is credited as before
     */
    protected function processSuccessfulPayment(Payment $payment, $checkoutRequestId, $transactionId, $responseData = [])
    {
        $payment->update([
            'status'              => 'completed',
            'mpesa_transaction_id' => $transactionId,
            'mpesa_response'      => empty($responseData) ? null : collect($responseData)->toJson(),
            'paid_at'             => now(),
        ]);

        // Deduct wallet balance if partial wallet was used
        if ($payment->wallet_deduction > 0) {
            $userWallet = $payment->user->wallet;
            if ($userWallet) {
                $userWallet->balance -= $payment->wallet_deduction;
                $userWallet->save();

                \App\Models\WalletTransaction::create([
                    'wallet_id'      => $userWallet->id,
                    'amount'         => -$payment->wallet_deduction,
                    'type'           => 'payment',
                    'description'    => 'Wallet payment for reservation(s)',
                    'reference_type' => 'payment',
                    'reference_id'   => $payment->id,
                    'status'         => 'completed',
                    'balance_after'  => $userWallet->balance,
                ]);
            }
        }

        // ── Reservation-specific logic ────────────────────────────────────────
        if ($payment->type === 'reservation') {
            $reservations = Reservation::where('mpesa_checkout_request_id', $checkoutRequestId)->get();
            $walletService = app(WalletService::class);

            foreach ($reservations as $reservation) {
                $reservation->update(['status' => 'paid']);

                $trader = $reservation->trader;

                if ($payment->routing === 'custom_trader') {
                    // ── Custom routing: money went directly to trader's M-Pesa ─
                    // Do NOT credit the trader's Soko Mtaa wallet.
                    // Instead, create a market-fee record so the platform can collect
                    // its service-fee share from the trader's next fee cycle.
                    if ($trader && $payment->platform_commission > 0) {
                        $this->billPlatformCommission($trader, $payment, $reservation);
                    }
                } else {
                    // ── Platform routing: credit trader's wallet as usual ──────
                    if ($trader) {
                        $wallet      = $walletService->getOrCreateForTrader($trader->id);
                        $creditAmount = $reservation->unit_price * $reservation->quantity;
                        $productName  = $reservation->product->name ?? 'Product';

                        $walletService->credit(
                            $wallet,
                            $creditAmount,
                            "Sale: {$reservation->reservation_code} — {$productName}",
                            'reservation',
                            (string) $reservation->id
                        );
                    }
                }

                // Notify resident regardless of routing
                $this->notificationService->notifyReservationUpdate(
                    $payment->user,
                    $reservation,
                    'paid'
                );
            }

        } elseif ($payment->type === 'product_boost' && $payment->product_id) {
            $payment->product->update([
                'is_boosted'    => true,
                'boosted_until' => now()->addHours(24),
            ]);

            $this->notificationService->send(
                $payment->user,
                'Product Boosted!',
                "Your product '{$payment->product->name}' is now appearing at the top of search results for the next 24 hours.",
                'promotion',
                ['product_id' => $payment->product_id],
                true
            );

        } elseif ($payment->type === 'market_fee' || $payment->type === 'wallet_topup') {
            $walletService = app(WalletService::class);
            $wallet        = $walletService->getOrCreateForUser($payment->user_id);

            $walletService->credit(
                $wallet,
                $payment->amount,
                "M-Pesa Top-up: {$transactionId}",
                'mpesa',
                $transactionId
            );

            $this->notificationService->send(
                $payment->user,
                'Wallet Topped Up',
                "Your wallet balance has been credited with KES {$payment->amount}. Thank you.",
                'payment',
                ['transaction_id' => $transactionId],
                true
            );
        }
    }

    /**
     * Create a platform-commission market-fee record so Soko Mtaa can bill
     * the trader for the service fee that was included in a custom-routed payment.
     */
    protected function billPlatformCommission(
        \App\Models\Trader  $trader,
        Payment             $payment,
        Reservation         $reservation
    ): void {
        try {
            // Use the current month as the billing period
            $period = now()->format('Y-m');

            // Check if a commission fee for this payment already exists (idempotent)
            $exists = MarketFee::where('trader_id', $trader->id)
                ->where('period', $period)
                ->where('notes', 'LIKE', '%COMMISSION-' . $payment->id . '%')
                ->exists();

            if ($exists) return;

            $marketId = $trader->market_id ?? optional($trader->stall)->market_id;

            if (!$marketId) {
                Log::warning('Cannot bill platform commission — trader has no market_id', [
                    'trader_id'  => $trader->id,
                    'payment_id' => $payment->id,
                ]);
                return;
            }

            MarketFee::create([
                'trader_id'  => $trader->id,
                'market_id'  => $marketId,
                'amount'     => $payment->platform_commission,
                'period'     => $period,
                'status'     => 'unpaid',
                'due_date'   => now()->addDays(7),
                'notes'      => "Platform service fee for custom-M-Pesa reservation(s). "
                              . "Reservation: {$reservation->reservation_code}. "
                              . "COMMISSION-{$payment->id}",
            ]);

            Log::info('Platform commission fee created for custom-mpesa trader', [
                'trader_id'   => $trader->id,
                'amount'      => $payment->platform_commission,
                'reservation' => $reservation->reservation_code,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to create platform commission fee', [
                'trader_id'  => $trader->id,
                'payment_id' => $payment->id,
                'error'      => $e->getMessage(),
            ]);
        }
    }

    /**
     * M-Pesa Callback from Safaricom.
     * This endpoint handles both platform and custom-trader STK responses.
     * The routing is determined from the stored payment record, not from the callback.
     */
    public function callback(Request $request): JsonResponse
    {
        $data = $request->all();
        Log::info('M-Pesa Callback Received:', $data);

        $body             = $data['Body']['stkCallback'];
        $checkoutRequestId = $body['CheckoutRequestID'];
        $resultCode       = $body['ResultCode'];

        $payment = Payment::where('mpesa_checkout_request_id', $checkoutRequestId)->first();
        if (!$payment) {
            Log::warning('M-Pesa Callback: Payment record not found for ' . $checkoutRequestId);
            return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Success']);
        }

        if ($resultCode == 0) {
            $meta          = $body['CallbackMetadata']['Item'];
            $transactionId = collect($meta)->firstWhere('Name', 'MpesaReceiptNumber')['Value'];

            $this->processSuccessfulPayment($payment, $checkoutRequestId, $transactionId, $data);

            Log::info('M-Pesa Payment Successful', [
                'txn'     => $transactionId,
                'routing' => $payment->routing,
            ]);
        } else {
            $payment->update([
                'status'         => 'failed',
                'mpesa_response' => $data,
            ]);

            if ($payment->type === 'reservation') {
                Reservation::where('mpesa_checkout_request_id', $checkoutRequestId)
                    ->update(['status' => 'cancelled']);
            }

            Log::warning('M-Pesa Payment Failed for ' . $checkoutRequestId);
        }

        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Success']);
    }

    /**
     * Check the status of a specific M-Pesa transaction (polling endpoint).
     */
    public function checkStatus(string $checkoutRequestId): JsonResponse
    {
        $payment = Payment::where('mpesa_checkout_request_id', $checkoutRequestId)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        Log::info('Checking M-Pesa Status:', [
            'checkout_id' => $checkoutRequestId,
            'status'      => $payment->status,
            'routing'     => $payment->routing,
            'user_id'     => Auth::id(),
        ]);

        return $this->success([
            'status'               => $payment->status,
            'mpesa_transaction_id' => $payment->mpesa_transaction_id,
            'amount'               => $payment->amount,
            'routing'              => $payment->routing,
            'paid_at'              => $payment->paid_at,
        ]);
    }

    /**
     * Simulate a successful callback — development only.
     */
    public function simulateSuccess(string $checkoutRequestId): JsonResponse
    {
        if (app()->environment('production')) {
            return $this->error('Simulation not allowed in production.', 'FORBIDDEN', 403);
        }

        $payment = Payment::where('mpesa_checkout_request_id', $checkoutRequestId)->first();

        if (!$payment) {
            return $this->error('Payment record not found.', 'NOT_FOUND', 404);
        }

        if ($payment->status === 'completed') {
            return $this->success(null, 'Payment already completed.');
        }

        $transactionId = 'MOCK' . strtoupper(bin2hex(random_bytes(4)));

        $payment->update([
            'status'               => 'completed',
            'mpesa_transaction_id' => $transactionId,
            'mpesa_response'       => ['simulated' => true],
            'paid_at'              => now(),
        ]);

        // Mirror real callback logic (respects routing)
        if ($payment->type === 'reservation') {
            $reservations  = Reservation::where('mpesa_checkout_request_id', $checkoutRequestId)->get();
            $walletService = app(WalletService::class);

            foreach ($reservations as $reservation) {
                $reservation->update(['status' => 'paid']);
                $trader = $reservation->trader;

                if ($payment->routing === 'custom_trader') {
                    if ($trader && $payment->platform_commission > 0) {
                        $this->billPlatformCommission($trader, $payment, $reservation);
                    }
                } else {
                    if ($trader) {
                        $wallet       = $walletService->getOrCreateForTrader($trader->id);
                        $creditAmount = $reservation->unit_price * $reservation->quantity;
                        $walletService->credit(
                            $wallet,
                            $creditAmount,
                            "[Simulated] Sale: {$reservation->reservation_code}",
                            'reservation',
                            (string) $reservation->id
                        );
                    }
                }

                $this->notificationService->notifyReservationUpdate(
                    $payment->user,
                    $reservation,
                    'paid'
                );
            }
        } elseif ($payment->type === 'product_boost' && $payment->product_id) {
            $payment->product->update([
                'is_boosted'    => true,
                'boosted_until' => now()->addHours(24),
            ]);
        } elseif (in_array($payment->type, ['market_fee', 'wallet_topup'])) {
            $walletService = app(WalletService::class);
            $wallet        = $walletService->getOrCreateForUser($payment->user_id);
            $walletService->credit(
                $wallet,
                $payment->amount,
                "Simulated M-Pesa Top-up: {$transactionId}",
                'mpesa',
                $transactionId
            );
        }

        return $this->success([
            'status'               => 'completed',
            'mpesa_transaction_id' => $transactionId,
            'routing'              => $payment->routing,
        ], 'Payment simulation successful.');
    }
}

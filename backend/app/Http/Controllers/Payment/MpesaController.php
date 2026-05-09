<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\MarketFee;
use App\Services\MpesaService;
use App\Services\NotificationService;
use App\Services\WalletService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class MpesaController extends Controller
{
    use ApiResponse;

    protected $mpesaService;
    protected $notificationService;

    public function __construct(MpesaService $mpesaService, NotificationService $notificationService)
    {
        $this->mpesaService = $mpesaService;
        $this->notificationService = $notificationService;
    }

    /**
     * Initiate STK Push for a Reservation or Market Fee.
     */
    public function initiateSTK(Request $request): JsonResponse
    {
        $request->validate([
            'phone_number' => ['required', 'string', 'regex:/^(?:254|\+254|0)?(7|1)[0-9]{8}$/'],
            'type' => 'required|in:reservation,market_fee,wallet_topup,product_boost',
            'target_id' => 'required_if:type,reservation,market_fee,product_boost|integer',
            'amount' => 'required_if:type,wallet_topup|numeric|min:1',
        ]);

        // Normalize Phone Number to 254XXXXXXXXX
        $phone = $request->phone_number;
        $phone = str_replace('+', '', $phone);
        if (str_starts_with($phone, '0')) {
            $phone = '254' . substr($phone, 1);
        }
        if (strlen($phone) === 9 && (str_starts_with($phone, '7') || str_starts_with($phone, '1'))) {
            $phone = '254' . $phone;
        }

        $user = Auth::user();
        $amount = 0;
        $ref = '';

        if ($request->type === 'reservation') {
            $reservation = Reservation::findOrFail($request->target_id);
            if ($reservation->status !== 'pending') {
                return $this->error('This reservation has already been paid or was cancelled.', 'INVALID_STATUS', 422);
            }
            $amount = $reservation->total_amount;
            $ref = $reservation->reservation_code;
        } elseif ($request->type === 'market_fee') {
            $fee = MarketFee::findOrFail($request->target_id);
            if ($fee->status === 'paid') {
                return $this->error('This fee has already been paid.', 'ALREADY_PAID', 422);
            }
            $amount = $fee->amount;
            $ref = 'FEE-' . $fee->id;
        } elseif ($request->type === 'product_boost') {
            $product = \App\Models\Product::findOrFail($request->target_id);
            $amount = 20.00; // Micro-Ad fee (e.g., 24hr boost)
            $ref = 'BOOST-' . $product->id;
        } else {
            // Wallet Top-up
            $amount = $request->amount;
            $ref = 'TOPUP-' . $user->id;
        }

        $stkResponse = $this->mpesaService->stkPush(
            $phone,
            $amount,
            $ref,
            'Soko Mtaa ' . ucfirst($request->type)
        );

        if (!$stkResponse || $stkResponse['ResponseCode'] != '0') {
            return $this->error('M-Pesa initiation failed. Please try again.', 'MPESA_INIT_FAILED', 500);
        }

        // Create initial payment record
        Payment::create([
            'reservation_id' => $request->type === 'reservation' ? $request->target_id : null,
            'product_id' => $request->type === 'product_boost' ? $request->target_id : null,
            'user_id' => $user->id,
            'mpesa_checkout_request_id' => $stkResponse['CheckoutRequestID'],
            'amount' => $amount,
            'phone_number' => $phone,
            'type' => $request->type,
            'status' => 'pending',
        ]);

        return $this->success([
            'checkout_request_id' => $stkResponse['CheckoutRequestID'],
            'customer_message' => $stkResponse['CustomerMessage']
        ], 'Payment request sent to your phone. Please enter your M-Pesa PIN.');
    }

    /**
     * M-Pesa Callback from Safaricom.
     * This endpoint must be public (excluded from CSRF).
     */
    public function callback(Request $request): JsonResponse
    {
        $data = $request->all();
        Log::info('M-Pesa Callback Received:', $data);

        $body = $data['Body']['stkCallback'];
        $checkoutRequestId = $body['CheckoutRequestID'];
        $resultCode = $body['ResultCode'];

        $payment = Payment::where('mpesa_checkout_request_id', $checkoutRequestId)->first();
        if (!$payment) {
            Log::warning('M-Pesa Callback: Payment record not found for ' . $checkoutRequestId);
            return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Success']);
        }

        if ($resultCode == 0) {
            // Success
            $meta = $body['CallbackMetadata']['Item'];
            $transactionId = collect($meta)->firstWhere('Name', 'MpesaReceiptNumber')['Value'];

            $payment->update([
                'status' => 'completed',
                'mpesa_transaction_id' => $transactionId,
                'mpesa_response' => $data,
                'paid_at' => now(),
            ]);

            // Update associated entities
            if ($payment->type === 'reservation' && $payment->reservation_id) {
                $payment->reservation->update(['status' => 'paid']);
                
                // Trigger Notification
                $this->notificationService->notifyReservationUpdate(
                    $payment->user, 
                    $payment->reservation, 
                    'paid'
                );
            } elseif ($payment->type === 'product_boost' && $payment->product_id) {
                $payment->product->update([
                    'is_boosted' => true,
                    'boosted_until' => now()->addHours(24),
                ]);

                // Notify Trader
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
                $wallet = $walletService->getOrCreateForTrader($payment->user->trader?->id);
                
                // Credit the wallet
                $walletService->credit(
                    $wallet, 
                    $payment->amount, 
                    "M-Pesa Top-up: {$transactionId}",
                    'mpesa',
                    $transactionId
                );

                // Notify Trader
                $this->notificationService->send(
                    $payment->user,
                    'Wallet Topped Up',
                    "Your wallet balance has been credited with KES {$payment->amount}. Thank you.",
                    'payment',
                    ['transaction_id' => $transactionId],
                    true
                );
            }

            Log::info('M-Pesa Payment Successful and Notifications Sent: ' . $transactionId);
        } else {
            // Failed (Cancelled, Timeout, etc.)
            $payment->update([
                'status' => 'failed',
                'mpesa_response' => $data,
            ]);
            Log::warning('M-Pesa Payment Failed for ' . $checkoutRequestId);
        }

        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Success']);
    }

    /**
     * Check the status of a specific M-Pesa transaction.
     * Used for polling from the frontend.
     */
    public function checkStatus(string $checkoutRequestId): JsonResponse
    {
        $payment = Payment::where('mpesa_checkout_request_id', $checkoutRequestId)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        return $this->success([
            'status' => $payment->status,
            'mpesa_transaction_id' => $payment->mpesa_transaction_id,
            'amount' => $payment->amount,
            'paid_at' => $payment->paid_at,
        ]);
    }

    /**
     * Simulate a successful callback for development purposes.
     */
    public function simulateSuccess(string $checkoutRequestId): JsonResponse
    {
        // Only allow in local environment
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

        // Generate a mock M-Pesa receipt number
        $transactionId = 'MOCK' . strtoupper(bin2hex(random_bytes(4)));

        $payment->update([
            'status' => 'completed',
            'mpesa_transaction_id' => $transactionId,
            'mpesa_response' => ['simulated' => true],
            'paid_at' => now(),
        ]);

        // Update associated entities (Mirroring callback logic)
        if ($payment->type === 'reservation' && $payment->reservation_id) {
            $payment->reservation->update(['status' => 'paid']);
            
            $this->notificationService->notifyReservationUpdate(
                $payment->user, 
                $payment->reservation, 
                'paid'
            );
        } elseif ($payment->type === 'product_boost' && $payment->product_id) {
            $payment->product->update([
                'is_boosted' => true,
                'boosted_until' => now()->addHours(24),
            ]);
        } elseif ($payment->type === 'market_fee' || $payment->type === 'wallet_topup') {
            $walletService = app(WalletService::class);
            $wallet = $walletService->getOrCreateForTrader($payment->user->trader?->id);
            
            $walletService->credit(
                $wallet, 
                $payment->amount, 
                "Simulated M-Pesa Top-up: {$transactionId}",
                'mpesa',
                $transactionId
            );
        }

        return $this->success([
            'status' => 'completed',
            'mpesa_transaction_id' => $transactionId
        ], 'Payment simulation successful.');
    }
}

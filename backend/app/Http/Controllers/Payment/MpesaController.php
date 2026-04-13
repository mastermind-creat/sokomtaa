<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\MarketFee;
use App\Services\MpesaService;
use App\Services\NotificationService;
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
            'phone_number' => 'required|string|regex:/^2547[0-9]{8}$/',
            'type' => 'required|in:reservation,market_fee',
            'target_id' => 'required|integer',
        ]);

        $user = Auth::user();
        $amount = 0;
        $ref = '';

        if ($request->type === 'reservation') {
            $reservation = Reservation::findOrFail($request->target_id);
            if ($reservation->status !== 'pending') {
                return $this->error('Uhifadhi huu tayari umeshalipiwa au ulighairiwa. (Already paid or cancelled.)', 'INVALID_STATUS', 422);
            }
            $amount = $reservation->total_amount;
            $ref = $reservation->reservation_code;
        } else {
            $fee = MarketFee::findOrFail($request->target_id);
            if ($fee->status === 'paid') {
                return $this->error('Ada hii tayari imeshalipiwa. (Fee already paid.)', 'ALREADY_PAID', 422);
            }
            $amount = $fee->amount;
            $ref = 'FEE-' . $fee->id;
        }

        $stkResponse = $this->mpesaService.stkPush(
            $request->phone_number,
            $amount,
            $ref,
            'Soko Mtaa ' . ucfirst($request->type)
        );

        if (!$stkResponse || $stkResponse['ResponseCode'] != '0') {
            return $this->error('M-Pesa imeshindwa kuanza. Jaribu tena. (M-Pesa STK failed to initiate.)', 'MPESA_INIT_FAILED', 500);
        }

        // Create initial payment record
        Payment::create([
            'reservation_id' => $request->type === 'reservation' ? $request->target_id : null,
            'user_id' => $user->id,
            'mpesa_checkout_request_id' => $stkResponse['CheckoutRequestID'],
            'amount' => $amount,
            'phone_number' => $request->phone_number,
            'type' => $request->type,
            'status' => 'pending',
        ]);

        return $this->success([
            'checkout_request_id' => $stkResponse['CheckoutRequestID'],
            'customer_message' => $stkResponse['CustomerMessage']
        ], 'Ombi limetumwa kwa simu yako. (STK Push sent to your phone.)');
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
            } elseif ($payment->type === 'market_fee') {
                $fee = MarketFee::where('payment_id', null)->where('trader_id', $payment->user?->trader?->id)->latest()->first();
                if ($fee) {
                    $fee->update([
                        'status' => 'paid',
                        'payment_id' => $payment->id,
                        'paid_at' => now(),
                    ]);

                    // Trigger Notification
                    $this->notificationService->send(
                        $payment->user,
                        'Ada Imelipwa (Fee Paid)',
                        "Ada yako ya soko ya KES {$fee->amount} ya kipindi {$fee->period} imerekodiwa kama imelipwa.",
                        'payment',
                        ['fee_id' => $fee->id],
                        true
                    );
                }
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
}

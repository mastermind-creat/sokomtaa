<?php

namespace App\Http\Controllers\Payment;

use App\Exceptions\PaymentFailedException;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Reservation;
use App\Services\NotificationService;
use App\Services\PayPalService;
use App\Services\WalletService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class PayPalController extends Controller
{
    use ApiResponse;

    public function __construct(
        private PayPalService      $paypalService,
        private WalletService      $walletService,
        private NotificationService $notificationService,
    ) {}

    /**
     * POST /api/payments/paypal/create-order
     * Creates a PayPal Orders v2 resource and stores a pending Payment record.
     */
    public function createOrder(Request $request): JsonResponse
    {
        $request->validate([
            'reservation_ids'   => 'required|array|min:1',
            'reservation_ids.*' => 'integer',
            'currency'          => 'required|in:USD,KES',
        ]);

        $user           = Auth::user();
        $reservationIds = $request->reservation_ids;

        // Validate ownership and status for each reservation
        $reservations = Reservation::whereIn('id', $reservationIds)->get();

        if ($reservations->count() !== count($reservationIds)) {
            return $this->error('One or more reservations were not found.', 'VALIDATION_ERROR', 422);
        }

        foreach ($reservations as $reservation) {
            if ($reservation->resident_id !== $user->id) {
                return $this->error(
                    "Reservation {$reservation->reservation_code} does not belong to you or is not pending.",
                    'VALIDATION_ERROR',
                    422
                );
            }
            if ($reservation->status !== 'pending') {
                return $this->error(
                    "Reservation {$reservation->reservation_code} does not belong to you or is not pending.",
                    'VALIDATION_ERROR',
                    422
                );
            }
        }

        $totalKes = $reservations->sum('total_amount');

        try {
            $totalUsd = $this->paypalService->convertKesToUsd((float) $totalKes);
        } catch (PaymentFailedException $e) {
            return $this->error($e->getMessage(), 'PAYMENT_FAILED', 500);
        }

        $reservationRef = $reservations->first()->reservation_code
            . ($reservations->count() > 1 ? '+' : '');

        try {
            $orderData = $this->paypalService->createOrder($totalUsd, $reservationRef);
        } catch (PaymentFailedException $e) {
            return $this->error('PayPal order creation failed. Please try again.', 'PAYMENT_FAILED', 500);
        }

        $orderId    = $orderData['order_id'];
        $approveUrl = $orderData['approve_url'];

        // Persist pending Payment record
        Payment::create([
            'reservation_id'  => $reservations->first()->id,
            'user_id'         => $user->id,
            'paypal_order_id' => $orderId,
            'payment_method'  => 'paypal',
            'amount'          => $totalKes,
            'phone_number'    => '',   // Not applicable for PayPal
            'type'            => 'reservation',
            'status'          => 'pending',
        ]);

        // Link each reservation to this PayPal order
        Reservation::whereIn('id', $reservationIds)->update([
            'paypal_order_id' => $orderId,
        ]);

        return $this->success([
            'order_id'    => $orderId,
            'approve_url' => $approveUrl,
            'amount_kes'  => $totalKes,
            'amount_usd'  => $totalUsd,
        ], 'PayPal order created. Redirect resident to approve.');
    }

    /**
     * POST /api/payments/paypal/capture-order
     * Captures funds after buyer approves in PayPal, then finalises the payment.
     */
    public function captureOrder(Request $request): JsonResponse
    {
        $request->validate([
            'order_id' => 'required|string',
        ]);

        $user    = Auth::user();
        $orderId = $request->order_id;

        $payment = Payment::where('paypal_order_id', $orderId)
            ->where('user_id', $user->id)
            ->first();

        if (!$payment) {
            return $this->error('Payment record not found.', 'NOT_FOUND', 404);
        }

        // Idempotency: already completed
        if ($payment->status === 'completed') {
            return $this->success(['status' => 'completed'], 'Payment already completed.');
        }

        try {
            $captureData = $this->paypalService->captureOrder($orderId);
        } catch (PaymentFailedException $e) {
            $payment->update(['status' => 'failed']);
            Reservation::where('paypal_order_id', $orderId)->update(['status' => 'cancelled']);
            return $this->error('PayPal capture failed. Please try again.', 'PAYMENT_FAILED', 402);
        }

        $captureStatus = $captureData['purchase_units'][0]['payments']['captures'][0]['status'] ?? null;

        if ($captureStatus === 'COMPLETED') {
            $transactionId = $captureData['purchase_units'][0]['payments']['captures'][0]['id'];
            $this->processSuccessfulPayPalPayment($payment, $orderId, $transactionId);

            return $this->success([
                'status'                => 'completed',
                'paypal_transaction_id' => $transactionId,
                'amount'                => $payment->amount,
                'paid_at'               => $payment->fresh()->paid_at,
            ], 'Payment captured successfully.');
        }

        // Non-COMPLETED capture (VOIDED, DECLINED, etc.)
        $payment->update(['status' => 'failed']);
        Reservation::where('paypal_order_id', $orderId)->update(['status' => 'cancelled']);

        return $this->error(
            'PayPal capture failed. Order status: ' . ($captureStatus ?? 'UNKNOWN') . '.',
            'PAYMENT_FAILED',
            402
        );
    }

    /**
     * POST /api/payments/paypal/webhook
     * Public endpoint — receives PayPal server-side event notifications.
     */
    public function webhook(Request $request): JsonResponse
    {
        $rawBody = $request->getContent();
        $headers = $request->headers->all();

        // Normalise header keys to uppercase for consistent lookup
        $normHeaders = [];
        foreach ($headers as $key => $value) {
            $normHeaders[strtoupper($key)] = is_array($value) ? $value[0] : $value;
        }

        if (!$this->paypalService->verifyWebhookSignature($normHeaders, $rawBody)) {
            Log::channel('paypal')->warning('PayPal webhook signature verification failed');
            return $this->error('Invalid webhook signature.', 'UNAUTHORIZED', 400);
        }

        $event     = $request->json()->all();
        $eventType = $event['event_type'] ?? 'unknown';
        $resourceId = $event['resource']['id'] ?? null;

        Log::channel('paypal')->info('PayPal webhook received', [
            'event_type'  => $eventType,
            'resource_id' => $resourceId,
        ]);

        if ($eventType === 'PAYMENT.CAPTURE.COMPLETED') {
            $orderId = $event['resource']['supplementary_data']['related_ids']['order_id']
                ?? $event['resource']['id']
                ?? null;

            $payment = $orderId
                ? Payment::where('paypal_order_id', $orderId)->first()
                : null;

            if (!$payment) {
                Log::channel('paypal')->warning('PayPal webhook: no Payment record found', [
                    'order_id' => $orderId,
                ]);
                return response()->json(['status' => 'ok']); // 200 to prevent retry
            }

            if ($payment->status === 'pending') {
                $transactionId = $event['resource']['id'];
                $this->processSuccessfulPayPalPayment($payment, $orderId, $transactionId);
            }
            // Already completed — idempotent no-op
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * GET /api/payments/paypal/status/{orderId}
     * Returns current payment status for frontend polling.
     */
    public function checkStatus(string $orderId): JsonResponse
    {
        $payment = Payment::where('paypal_order_id', $orderId)
            ->where('user_id', Auth::id())
            ->first();

        if (!$payment) {
            return $this->error('Payment record not found.', 'NOT_FOUND', 404);
        }

        return $this->success([
            'status'                => $payment->status,
            'paypal_transaction_id' => $payment->paypal_transaction_id,
            'amount'                => $payment->amount,
            'paid_at'               => $payment->paid_at,
        ], 'Payment status retrieved.');
    }

    /**
     * Internal helper: finalise a successful PayPal payment.
     * Mirrors MpesaController::processSuccessfulPayment logic.
     */
    protected function processSuccessfulPayPalPayment(
        Payment $payment,
        string  $orderId,
        string  $transactionId
    ): void {
        $payment->update([
            'status'               => 'completed',
            'paypal_transaction_id' => $transactionId,
            'paid_at'              => now(),
        ]);

        $reservations = Reservation::where('paypal_order_id', $orderId)->get();

        foreach ($reservations as $reservation) {
            $reservation->update(['status' => 'paid']);

            $trader = $reservation->trader;

            if ($trader) {
                $wallet      = $this->walletService->getOrCreateForTrader($trader->id);
                $creditAmount = $reservation->unit_price * $reservation->quantity;
                $productName  = $reservation->product->name ?? 'Product';

                $this->walletService->credit(
                    $wallet,
                    (float) $creditAmount,
                    "PayPal Sale: {$reservation->reservation_code} — {$productName}",
                    'reservation',
                    (string) $reservation->id
                );

                // Notify trader (T07 equivalent — PayPal source)
                $this->notificationService->send(
                    $trader->user,
                    '✅ Malipo ya PayPal — Order Mpya / PayPal Payment Received',
                    "Malipo ya KES {$reservation->total_amount} yamepokelewa kwa {$reservation->reservation_code} ({$productName}) kupitia PayPal.",
                    'payment',
                    [
                        'reservation_id' => $reservation->id,
                        'payment_method' => 'paypal',
                    ],
                    false  // No SMS for PayPal events (Req 11.4)
                );
            }

            // Notify resident
            $resident = $reservation->resident;
            if ($resident) {
                $this->notificationService->send(
                    $resident,
                    '✅ Malipo ya PayPal Yamefanikiwa / PayPal Payment Confirmed',
                    "Umelipa KES {$reservation->total_amount} kwa {$reservation->reservation_code}. Nambari ya muamala: {$transactionId}.",
                    'payment',
                    [
                        'reservation_id'        => $reservation->id,
                        'paypal_transaction_id' => $transactionId,
                        'payment_method'        => 'paypal',
                    ],
                    false  // No SMS for PayPal events (Req 11.4)
                );
            }
        }

        Log::channel('paypal')->info('PayPal payment finalised', [
            'order_id'       => $orderId,
            'transaction_id' => $transactionId,
            'reservations'   => $reservations->pluck('reservation_code'),
        ]);
    }
}

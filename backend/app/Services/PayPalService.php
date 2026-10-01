<?php

namespace App\Services;

use App\Exceptions\PaymentFailedException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PayPalService
{
    public function __construct(
        private string $clientId,
        private string $clientSecret,
        private string $baseUrl,
        private float  $kesToUsdRate,
        private string $webhookId,
    ) {}

    /**
     * Get a cached OAuth2 access token from PayPal.
     * Cached 3000 seconds (~50 min) to avoid redundant token requests.
     *
     * @throws PaymentFailedException
     */
    public function generateToken(): string
    {
        return Cache::remember('paypal_access_token', 3000, function () {
            $response = Http::withBasicAuth($this->clientId, $this->clientSecret)
                ->asForm()
                ->post($this->baseUrl . '/v1/oauth2/token', [
                    'grant_type' => 'client_credentials',
                ]);

            if ($response->failed()) {
                Log::channel('paypal')->error('PayPal token generation failed', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                    // Never log clientSecret
                ]);
                throw new PaymentFailedException('PayPal token generation failed. Check credentials.');
            }

            return $response->json('access_token');
        });
    }

    /**
     * Convert a KES amount to USD using the configured exchange rate.
     * Rounds to 2 decimal places.
     *
     * @throws PaymentFailedException
     */
    public function convertKesToUsd(float $kesAmount): float
    {
        if (empty($this->kesToUsdRate)) {
            throw new PaymentFailedException('PayPal exchange rate is not configured');
        }

        return round($kesAmount * $this->kesToUsdRate, 2);
    }

    /**
     * Create a PayPal Orders v2 resource.
     * Returns ['order_id' => ..., 'approve_url' => ...]
     *
     * @throws PaymentFailedException
     */
    public function createOrder(float $usdAmount, string $reservationRef): array
    {
        $token    = $this->generateToken();
        $endpoint = $this->baseUrl . '/v2/checkout/orders';

        $payload = [
            'intent'         => 'CAPTURE',
            'purchase_units' => [
                [
                    'reference_id' => $reservationRef,
                    'amount'       => [
                        'currency_code' => 'USD',
                        'value'         => number_format($usdAmount, 2, '.', ''),
                    ],
                ],
            ],
        ];

        $response = Http::withToken($token)
            ->post($endpoint, $payload);

        if ($response->failed()) {
            Log::channel('paypal')->error('PayPal create order failed', [
                'endpoint' => $endpoint,
                'status'   => $response->status(),
                'body'     => $response->body(),
            ]);
            throw new PaymentFailedException('PayPal order creation failed.');
        }

        $data     = $response->json();
        $orderId  = $data['id'];
        $approveUrl = collect($data['links'])
            ->firstWhere('rel', 'approve')['href'] ?? null;

        Log::channel('paypal')->info('PayPal order created', [
            'method'    => 'POST',
            'endpoint'  => $endpoint,
            'order_id'  => $orderId,
        ]);

        return [
            'order_id'    => $orderId,
            'approve_url' => $approveUrl,
        ];
    }

    /**
     * Capture a PayPal order after buyer approval.
     * Returns the full PayPal capture response array.
     *
     * @throws PaymentFailedException
     */
    public function captureOrder(string $paypalOrderId): array
    {
        $token    = $this->generateToken();
        $endpoint = $this->baseUrl . '/v2/checkout/orders/' . $paypalOrderId . '/capture';

        $response = Http::withToken($token)
            ->post($endpoint);

        if ($response->failed()) {
            Log::channel('paypal')->error('PayPal capture order failed', [
                'order_id' => $paypalOrderId,
                'status'   => $response->status(),
                'body'     => $response->body(),
            ]);
            throw new PaymentFailedException('PayPal capture failed for order ' . $paypalOrderId);
        }

        $data = $response->json();

        Log::channel('paypal')->info('PayPal order captured', [
            'order_id' => $paypalOrderId,
            'status'   => $data['status'] ?? 'unknown',
        ]);

        return $data;
    }

    /**
     * Verify a PayPal webhook signature using PayPal's verify-webhook-signature API.
     * Returns true only when verification_status === 'SUCCESS'.
     */
    public function verifyWebhookSignature(array $headers, string $body): bool
    {
        $transmissionId = $headers['PAYPAL-TRANSMISSION-ID']
            ?? $headers['paypal-transmission-id']
            ?? '';

        try {
            $token    = $this->generateToken();
            $endpoint = $this->baseUrl . '/v1/notifications/verify-webhook-signature';

            $payload = [
                'webhook_id'        => $this->webhookId,
                'transmission_id'   => $transmissionId,
                'transmission_time' => $headers['PAYPAL-TRANSMISSION-TIME']
                    ?? $headers['paypal-transmission-time'] ?? '',
                'cert_url'          => $headers['PAYPAL-CERT-URL']
                    ?? $headers['paypal-cert-url'] ?? '',
                'auth_algo'         => $headers['PAYPAL-AUTH-ALGO']
                    ?? $headers['paypal-auth-algo'] ?? '',
                'transmission_sig'  => $headers['PAYPAL-TRANSMISSION-SIG']
                    ?? $headers['paypal-transmission-sig'] ?? '',
                'webhook_event'     => json_decode($body, true),
            ];

            $response = Http::withToken($token)
                ->post($endpoint, $payload);

            if ($response->failed()) {
                Log::channel('paypal')->warning('PayPal webhook signature verification request failed', [
                    'transmission_id' => $transmissionId,
                    'status'          => $response->status(),
                ]);
                return false;
            }

            $verified = $response->json('verification_status') === 'SUCCESS';

            if (!$verified) {
                Log::channel('paypal')->warning('PayPal webhook signature invalid', [
                    'transmission_id'     => $transmissionId,
                    'verification_status' => $response->json('verification_status'),
                ]);
            }

            return $verified;

        } catch (\Throwable $e) {
            Log::channel('paypal')->warning('PayPal webhook signature verification threw exception', [
                'transmission_id' => $transmissionId,
                'error'           => $e->getMessage(),
            ]);
            return false;
        }
    }
}

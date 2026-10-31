<?php

namespace App\Services;

use App\Models\Trader;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class MpesaService
{
    protected string $baseUrl;
    protected string $consumerKey;
    protected string $consumerSecret;
    protected string $passkey;
    protected string $shortcode;
    protected string $callbackUrl;
    protected string $transactionType;

    /**
     * Cache key prefix — differentiated per-credential set so trader tokens
     * don't collide with the platform token.
     */
    protected string $cachePrefix = 'mpesa_platform';

    public function __construct(
        ?string $consumerKey = null,
        ?string $consumerSecret = null,
        ?string $passkey = null,
        ?string $shortcode = null,
        ?string $environment = null,
        ?string $transactionType = null,
        string $cachePrefix = 'mpesa_platform'
    ) {
        // If no overrides provided, fall back to platform config
        $env = $environment ?? config('mpesa.env', 'sandbox');

        $this->baseUrl         = $env === 'production'
                                   ? 'https://api.safaricom.co.ke'
                                   : 'https://sandbox.safaricom.co.ke';
        $this->consumerKey     = $consumerKey    ?? config('mpesa.consumer_key');
        $this->consumerSecret  = $consumerSecret ?? config('mpesa.consumer_secret');
        $this->passkey         = $passkey        ?? config('mpesa.passkey');
        $this->shortcode       = $shortcode      ?? config('mpesa.shortcode');
        $this->callbackUrl     = config('mpesa.callback_url');
        $this->transactionType = $transactionType ?? 'CustomerPayBillOnline';
        $this->cachePrefix     = $cachePrefix;
    }

    /**
     * The CallBackURL handed to Daraja.
     *
     * When MPESA_CALLBACK_SECRET is configured it is appended as a token query
     * parameter, which the callback endpoint verifies before processing. An
     * empty secret leaves the URL untouched so existing deployments keep working.
     */
    protected function callbackUrlWithToken(): string
    {
        $secret = (string) config('mpesa.callback_secret', '');

        if ($secret === '' || (string) $this->callbackUrl === '') {
            return (string) $this->callbackUrl;
        }

        $separator = str_contains($this->callbackUrl, '?') ? '&' : '?';

        return $this->callbackUrl . $separator . 'token=' . urlencode($secret);
    }

    /**
     * Create an MpesaService instance pre-loaded with a trader's own Daraja credentials.
     * Falls back to the platform instance if the trader has no valid custom credentials.
     */
    public static function forTrader(Trader $trader): self
    {
        if (!$trader->hasValidCustomMpesa()) {
            return new self(); // platform defaults
        }

        return new self(
            consumerKey:     $trader->getDecryptedConsumerKey(),
            consumerSecret:  $trader->getDecryptedConsumerSecret(),
            passkey:         $trader->getDecryptedPasskey(),
            shortcode:       $trader->custom_mpesa_shortcode,
            environment:     $trader->custom_mpesa_environment,
            transactionType: $trader->custom_mpesa_transaction_type,
            cachePrefix:     'mpesa_trader_' . $trader->id,
        );
    }

    /**
     * Generate OAuth Access Token from Safaricom.
     * Tokens are cached 50 minutes (Safaricom expires at 1 hour).
     */
    public function generateToken(): ?string
    {
        return Cache::remember($this->cachePrefix . '_access_token', 3000, function () {
            $response = Http::withBasicAuth($this->consumerKey, $this->consumerSecret)
                ->get($this->baseUrl . '/oauth/v1/generate?grant_type=client_credentials');

            if ($response->failed()) {
                Log::error('Mpesa Token Generation Failed', [
                    'prefix' => $this->cachePrefix,
                    'body'   => $response->body(),
                ]);
                return null;
            }

            return $response->json()['access_token'];
        });
    }

    /**
     * Test that the stored credentials can successfully generate a token.
     * Used during credential-save to validate before persisting.
     *
     * @return bool  true = credentials are valid
     */
    public function testCredentials(): bool
    {
        // Bypass cache so we hit Safaricom live
        $response = Http::withBasicAuth($this->consumerKey, $this->consumerSecret)
            ->get($this->baseUrl . '/oauth/v1/generate?grant_type=client_credentials');

        return $response->ok() && isset($response->json()['access_token']);
    }

    /**
     * Initiate an M-Pesa STK Push (Lipa Na M-Pesa Online).
     *
     * @param string $phoneNumber (e.g. 254712345678)
     * @param float  $amount
     * @param string $accountReference (e.g. Reservation Code)
     * @param string $transactionDesc
     */
    public function stkPush(
        string $phoneNumber,
        float  $amount,
        string $accountReference,
        string $transactionDesc = 'Payment'
    ): ?array {
        $token = $this->generateToken();
        if (!$token) return null;

        $timestamp = Carbon::now()->format('YmdHis');
        $password  = base64_encode($this->shortcode . $this->passkey . $timestamp);

        $payload = [
            'BusinessShortCode' => $this->shortcode,
            'Password'          => $password,
            'Timestamp'         => $timestamp,
            'TransactionType'   => $this->transactionType,
            'Amount'            => round($amount),
            'PartyA'            => $phoneNumber,
            'PartyB'            => $this->shortcode,
            'PhoneNumber'       => $phoneNumber,
            'CallBackURL'       => $this->callbackUrlWithToken(),
            'AccountReference'  => $accountReference,
            'TransactionDesc'   => $transactionDesc,
        ];

        $response = Http::withToken($token)
            ->post($this->baseUrl . '/mpesa/stkpush/v1/processrequest', $payload);

        if ($response->failed()) {
            Log::error('Mpesa STK Push Failed', [
                'prefix' => $this->cachePrefix,
                'body'   => $response->body(),
            ]);
            return null;
        }

        return $response->json();
    }

    /**
     * Initiate a B2C (Business to Customer) payment — used for trader withdrawals.
     * Always uses the platform credentials (B2C is a platform-level operation).
     *
     * @param string $phoneNumber  Recipient phone (254XXXXXXXXX)
     * @param float  $amount       Amount to send
     * @param string $occasion     Description / reference (e.g. "Withdrawal #5")
     */
    public function b2cTransfer(string $phoneNumber, float $amount, string $occasion = 'Withdrawal'): ?array
    {
        $token = $this->generateToken();
        if (!$token) return null;

        $b2cCallbackUrl = config('app.url') . '/api/payments/mpesa/b2c-callback';

        $payload = [
            'OriginatorConversationID' => 'SOKO-' . strtoupper(uniqid()),
            'InitiatorName'            => config('mpesa.initiator_name'),
            'SecurityCredential'       => config('mpesa.security_credential'),
            'CommandID'                => 'BusinessPayment',
            'Amount'                   => round($amount),
            'PartyA'                   => $this->shortcode,
            'PartyB'                   => $phoneNumber,
            'Remarks'                  => $occasion,
            'QueueTimeOutURL'          => $b2cCallbackUrl,
            'ResultURL'                => $b2cCallbackUrl,
            'Occasion'                 => $occasion,
        ];

        $response = Http::withToken($token)
            ->post($this->baseUrl . '/mpesa/b2c/v3/paymentrequest', $payload);

        if ($response->failed()) {
            Log::error('Mpesa B2C Transfer Failed', [
                'phone'  => $phoneNumber,
                'amount' => $amount,
                'body'   => $response->body(),
            ]);
            return null;
        }

        return $response->json();
    }

    /**
     * Expose the current shortcode — used by controller to label the payment source.
     */
    public function getShortcode(): string
    {
        return $this->shortcode;
    }
}

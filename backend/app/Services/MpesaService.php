<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class MpesaService
{
    protected $baseUrl;
    protected $consumerKey;
    protected $consumerSecret;
    protected $passkey;
    protected $shortcode;
    protected $callbackUrl;

    public function __construct()
    {
        $this->baseUrl = config('mpesa.base_url');
        $this->consumerKey = config('mpesa.consumer_key');
        $this->consumerSecret = config('mpesa.consumer_secret');
        $this->passkey = config('mpesa.passkey');
        $this->shortcode = config('mpesa.shortcode');
        $this->callbackUrl = config('mpesa.callback_url');
    }

    /**
     * Generate OAuth Access Token from Safaricom.
     * Tokens are cached for 50 minutes (Expiry is 1 hour).
     */
    public function generateToken()
    {
        return Cache::remember('mpesa_access_token', 3000, function () {
            $response = Http::withBasicAuth($this->consumerKey, $this->consumerSecret)
                ->get($this->baseUrl . '/oauth/v1/generate?grant_type=client_credentials');

            if ($response->failed()) {
                Log::error('Mpesa Token Generation Failed: ' . $response->body());
                return null;
            }

            return $response->json()['access_token'];
        });
    }

    /**
     * Initiate an M-Pesa STK Push (Lipa Na M-Pesa Online).
     *
     * @param string $phoneNumber (e.g., 254712345678)
     * @param float $amount
     * @param string $accountReference (e.g., Reservation Code)
     * @param string $transactionDesc
     * @return array|null
     */
    public function stkPush(string $phoneNumber, float $amount, string $accountReference, string $transactionDesc = 'Payment')
    {
        $token = $this->generateToken();
        if (!$token) return null;

        $timestamp = Carbon::now()->format('YmdHis');
        $password = base64_encode($this->shortcode . $this->passkey . $timestamp);

        $payload = [
            'BusinessShortCode' => $this->shortcode,
            'Password' => $password,
            'Timestamp' => $timestamp,
            'TransactionType' => 'CustomerPayBillOnline',
            'Amount' => round($amount),
            'PartyA' => $phoneNumber,
            'PartyB' => $this->shortcode,
            'PhoneNumber' => $phoneNumber,
            'CallBackURL' => $this->callbackUrl,
            'AccountReference' => $accountReference,
            'TransactionDesc' => $transactionDesc,
        ];

        $response = Http::withToken($token)
            ->post($this->baseUrl . '/mpesa/stkpush/v1/processrequest', $payload);

        if ($response->failed()) {
            Log::error('Mpesa STK Push Failed: ' . $response->body());
            return null;
        }

        return $response->json();
    }

    /**
     * Initiate a B2C (Business to Customer) payment — used for trader withdrawals.
     *
     * @param string $phoneNumber   Recipient phone (254XXXXXXXXX)
     * @param float  $amount        Amount to send
     * @param string $occasion      Description / reference (e.g., "Withdrawal #5")
     * @return array|null           Daraja response with ConversationID
     */
    public function b2cTransfer(string $phoneNumber, float $amount, string $occasion = 'Withdrawal'): ?array
    {
        $token = $this->generateToken();
        if (!$token) return null;

        $b2cCallbackUrl = rtrim(config('mpesa.callback_url'), '/withdrawal-callback');
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
            Log::error('Mpesa B2C Transfer Failed: ' . $response->body(), [
                'phone'  => $phoneNumber,
                'amount' => $amount,
            ]);
            return null;
        }

        return $response->json();
    }
}

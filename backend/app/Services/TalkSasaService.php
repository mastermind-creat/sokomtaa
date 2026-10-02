<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class TalkSasaService
{
    protected $apiKey;
    protected $senderId;
    protected $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('talksasa.api_key');
        $this->senderId = config('talksasa.sender_id');
        $this->baseUrl = rtrim(config('talksasa.base_url'), '/');
    }

    /**
     * Send an SMS message.
     *
     * @param string $to
     * @param string $message
     * @return array
     */
    public function sendSms(string $to, string $message)
    {
        Log::info("TalkSasaService: Starting sendSms to {$to}");

        if (!$this->apiKey) {
            Log::error('Talk Sasa API FAILURE: TALKSASA_API_KEY is missing in .env');
            return ['status' => 'error', 'message' => 'Service not configured - Missing API Key'];
        }

        if (!$this->senderId) {
            Log::warning('Talk Sasa: TALKSASA_SENDER_ID is missing, using default.');
        }

        try {
            $phone = $this->formatPhoneNumber($to);
            Log::info("Talk Sasa: Formatted phone as {$phone}. Sending payload...");

            $baseUrl = rtrim($this->baseUrl, '/');
            $response = Http::withToken($this->apiKey)
                ->acceptJson()
                ->post("{$baseUrl}/sms/send", [
                    'recipient' => $phone,
                    'sender_id' => $this->senderId,
                    'message'   => $message,
                ]);

            if ($response->successful()) {
                Log::info("SMS sent via Talk Sasa to {$phone}", ['response' => $response->json()]);
                return [
                    'status' => 'success',
                    'data' => $response->json()
                ];
            }

            Log::error("Talk Sasa API error for {$phone}", [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            return [
                'status' => 'error',
                'message' => 'API returned error status: ' . $response->status()
            ];

        } catch (Exception $e) {
            Log::error("Failed to send SMS via Talk Sasa to {$to}", [
                'error' => $e->getMessage()
            ]);

            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Ensure phone number is in international format without the plus sign.
     * Talk Sasa usually expects 2547XXXXXXXX
     */
    protected function formatPhoneNumber(string $phone): string
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);

        if (str_starts_with($phone, '0')) {
            return '254' . substr($phone, 1);
        }

        if ((str_starts_with($phone, '7') || str_starts_with($phone, '1')) && strlen($phone) === 9) {
            return '254' . $phone;
        }

        return $phone;
    }
}

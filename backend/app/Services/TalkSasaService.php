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
        if (!$this->apiKey) {
            Log::warning('Talk Sasa API key missing.');
            return ['status' => 'error', 'message' => 'Service not configured'];
        }

        try {
            $phone = $this->formatPhoneNumber($to);

            $response = Http::withToken($this->apiKey)
                ->acceptJson()
                ->post("{$this->baseUrl}/sms/send", [
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

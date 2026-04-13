<?php

namespace App\Services;

use AfricasTalking\SDK\AfricasTalking;
use Exception;
use Illuminate\Support\Facades\Log;

class AfricasTalkingService
{
    protected $at;

    public function __construct()
    {
        $username = config('africastalking.username');
        $apiKey = config('africastalking.api_key');

        if ($username && $apiKey) {
            $this->at = new AfricasTalking($username, $apiKey);
        }
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
        if (!$this->at) {
            Log::warning('Africa\'s Talking service not initialized. Missing credentials.');
            return ['status' => 'error', 'message' => 'Service not configured'];
        }

        try {
            $sms = $this->at->sms();
            
            // Format phone number if needed (e.g. 07xx -> +2547xx)
            $to = $this->formatPhoneNumber($to);

            $options = [
                'to'      => $to,
                'message' => $message,
            ];

            if (config('africastalking.from')) {
                $options['from'] = config('africastalking.from');
            }

            $response = $sms->send($options);

            Log::info("SMS sent to {$to}", ['response' => $response]);
            
            return [
                'status' => 'success',
                'data' => $response
            ];

        } catch (Exception $e) {
            Log::error("Failed to send SMS to {$to}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Ensure phone number is in international format.
     */
    protected function formatPhoneNumber(string $phone): string
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);

        if (str_starts_with($phone, '0')) {
            return '+254' . substr($phone, 1);
        }

        if (str_starts_with($phone, '7') || str_starts_with($phone, '1')) {
            return '+254' . $phone;
        }

        if (str_starts_with($phone, '254')) {
            return '+' . $phone;
        }

        return $phone;
    }
}

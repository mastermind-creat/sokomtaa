<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    protected $smsService;

    public function __construct(TalkSasaService $smsService)
    {
        $this->smsService = $smsService;
    }

    /**
     * Send a notification to a user via database and optionally SMS.
     *
     * @param User $user
     * @param string $title
     * @param string $body
     * @param string $type
     * @param array|null $data
     * @param bool $sendSms
     * @return Notification
     */
    public function send(User $user, string $title, string $body, string $type = 'general', ?array $data = null, bool $sendSms = false)
    {
        // 1. Create In-App Notification
        $notification = Notification::create([
            'user_id' => $user->id,
            'title'   => $title,
            'body'    => $body,
            'type'    => $type,
            'data'    => $data,
        ]);

        // 2. Send SMS if requested
        if ($sendSms && $user->phone) {
            $smsContent = "{$title}: {$body}";
            
            // Log the attempt
            Log::info("Attempting to send SMS to {$user->phone} for notification: {$title}");
            
            $result = $this->smsService->sendSms($user->phone, $smsContent);
            
            if ($result['status'] === 'success') {
                Log::info("SMS successfully sent to {$user->phone}");
            } else {
                Log::error("SMS failed for {$user->phone}", ['reason' => $result['message'] ?? 'Unknown error']);
            }
        }

        // 3. Send Web Push Notification
        if (class_exists(\App\Notifications\WebPushNotification::class)) {
            $user->notify(new \App\Notifications\WebPushNotification($title, $body, $data ?? []));
        }

        return $notification;
    }

    /**
     * Convenience method for reservation updates.
     */
    public function notifyReservationUpdate(User $user, $reservation, string $status)
    {
        $stallNumber = $reservation->trader->stall->stall_number ?? 'N/A';

        $messages = [
            'paid' => [
                'title' => 'Payment Confirmed',
                'body'  => "We have received your payment of KES {$reservation->total_amount} for {$reservation->product->name}. Your reference code is {$reservation->reservation_code}.",
                'sms'   => true
            ],
            'ready' => [
                'title' => 'Your Order Is Ready',
                'body'  => "Your order ({$reservation->product->name}) is packed and ready for collection at Stall {$stallNumber}. Please come to pick it up.",
                'sms'   => true
            ],
            'cancelled' => [
                'title' => 'Order Cancelled',
                'body'  => "Your reservation {$reservation->reservation_code} has been cancelled. Please contact us if you need further assistance.",
                'sms'   => false
            ],
        ];

        if (isset($messages[$status])) {
            $msg = $messages[$status];
            return $this->send(
                $user, 
                $msg['title'], 
                $msg['body'], 
                'reservation', 
                ['reservation_id' => $reservation->id], 
                $msg['sms']
            );
        }
    }
}

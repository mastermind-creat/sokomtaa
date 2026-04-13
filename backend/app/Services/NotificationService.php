<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    protected $smsService;

    public function __construct(AfricasTalkingService $smsService)
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
            
            // To prevent SMS spam or cost overflow, we log and send in background
            // In a production app, this would be queued
            $this->smsService->sendSms($user->phone, $smsContent);
        }

        return $notification;
    }

    /**
     * Convenience method for reservation updates.
     */
    public function notifyReservationUpdate(User $user, $reservation, string $status)
    {
        $messages = [
            'paid' => [
                'title' => 'Malipo Yamethibitishwa',
                'body'  => "Tumepokea malipo yako ya KES {$reservation->total_amount} kwa ajili ya bidhaa: {$reservation->product->name}. Namba yako ya kurejelea ni {$reservation->reservation_code}.",
                'sms'   => true
            ],
            'ready' => [
                'title' => 'Bidhaa Ipo Tayari',
                'body'  => "Bidhaa yako ({$reservation->product->name}) ipo tayari kuchukuliwa katika Stall {$reservation->trader->stall->stall_number}. Karibu!",
                'sms'   => true
            ],
            'cancelled' => [
                'title' => 'Uhifadhi Umeghairiwa',
                'body'  => "Uhifadhi wako {$reservation->reservation_code} umeghairiwa. Tafadhali wasiliana nasi kwa usaidizi zaidi.",
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

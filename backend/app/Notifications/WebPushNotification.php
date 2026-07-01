<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
// Use strings instead of imports to prevent IDE errors when package isn't installed yet
// use NotificationChannels\WebPush\WebPushMessage;
// use NotificationChannels\WebPush\WebPushChannel;

class WebPushNotification extends Notification
{
    use Queueable;

    public $title;
    public $body;
    public $data;

    /**
     * Create a new notification instance.
     */
    public function __construct($title, $body, $data = [])
    {
        $this->title = $title;
        $this->body = $body;
        $this->data = $data;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        // Return the channel only if the class exists (so it doesn't crash before the package is installed)
        if (class_exists('NotificationChannels\WebPush\WebPushChannel')) {
            return ['NotificationChannels\WebPush\WebPushChannel'];
        }
        return [];
    }

    /**
     * Get the web push representation of the notification.
     */
    public function toWebPush($notifiable, $notification)
    {
        $messageClass = 'NotificationChannels\WebPush\WebPushMessage';
        return (new $messageClass)
            ->title($this->title)
            ->body($this->body)
            ->data($this->data)
            ->icon('/icons/icon-192x192.png');
    }
}

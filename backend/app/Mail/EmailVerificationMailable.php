<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmailVerificationMailable extends Mailable
{
    use Queueable, SerializesModels;

    public string $verificationUrl;

    public function __construct(
        public readonly User   $user,
        public readonly string $token,
    ) {
        $frontendUrl           = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')), '/');
        $this->verificationUrl = "{$frontendUrl}/verify-email/confirm?id={$user->id}&token={$token}";
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Verify your Soko Mtaa email address',
        );
    }

    public function content(): Content
    {
        return new Content(
            html: 'emails.verify-email-html',
            text: 'emails.verify-email',
        );
    }

    /**
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}

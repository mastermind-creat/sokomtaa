<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetMailable extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly User   $user,
        public readonly string $otp,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reset your Soko Mtaa password',
        );
    }

    public function content(): Content
    {
        return new Content(
            html: 'emails.password-reset-html',
            text: 'emails.password-reset',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}

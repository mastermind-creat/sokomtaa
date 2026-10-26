<?php

namespace App\Jobs;

use App\Mail\EmailVerificationMailable;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class SendVerificationEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     *
     * @var array<int>
     */
    public array $backoff = [10, 30, 60];

    public function __construct(public readonly User $user) {}

    /**
     * Execute the job.
     * Generates a 64-char random token, stores it in cache, and dispatches the mailable.
     */
    public function handle(): void
    {
        $token = Str::random(64);

        Cache::put(
            "email_verify_{$this->user->id}",
            $token,
            now()->addMinutes(60)
        );

        Mail::to($this->user)->send(new EmailVerificationMailable($this->user, $token));
    }

    /**
     * Handle a job failure.
     * Logs the failure without rethrowing — auth flow must not be interrupted.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Email verification dispatch failed', [
            'user_id' => $this->user->id,
            'email'   => $this->user->email,
            'error'   => $exception->getMessage(),
        ]);
    }
}

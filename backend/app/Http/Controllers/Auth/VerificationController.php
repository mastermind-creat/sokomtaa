<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\EmailVerificationMailable;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class VerificationController extends Controller
{
    use ApiResponse;

    /**
     * Verify an email address using the id + token from the verification link.
     *
     * Public route — no auth required.
     * Requirements: 1.8, 1.9
     */
    public function verify(Request $request, int $id, string $token): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->error(
                'Invalid verification link.',
                'VALIDATION_ERROR',
                422
            );
        }

        // Idempotent: already verified is a success
        if ($user->email_verified_at !== null) {
            return $this->success(null, 'Email address already verified.');
        }

        $cached = Cache::get("email_verify_{$id}");

        if ($cached === null) {
            return $this->error(
                'This verification link has expired. Please request a new one.',
                'VALIDATION_ERROR',
                422
            );
        }

        if (!hash_equals($cached, $token)) {
            return $this->error(
                'Invalid verification link.',
                'VALIDATION_ERROR',
                422
            );
        }

        $user->forceFill(['email_verified_at' => now()])->save();

        Cache::forget("email_verify_{$id}");

        return $this->success(null, 'Email address verified successfully.');
    }

    /**
     * Resend the verification email for the authenticated user.
     *
     * auth:sanctum route — rate-limited to 5 resends per hour.
     * Requirements: 1.10, 1.11
     */
    public function resend(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->email_verified_at !== null) {
            return $this->success(null, 'Email address is already verified.');
        }

        $countKey = "email_resend_count_{$user->id}";
        $count    = (int) Cache::get($countKey, 0);

        if ($count >= 5) {
            return $this->error(
                'Too many resend requests. Please wait before trying again.',
                'VALIDATION_ERROR',
                429
            );
        }

        // Increment counter — TTL 60 min (reset window each hour)
        Cache::put($countKey, $count + 1, now()->addMinutes(60));

        // Invalidate old token and send a fresh email synchronously
        Cache::forget("email_verify_{$user->id}");

        try {
            $token = Str::random(64);
            Cache::put("email_verify_{$user->id}", $token, now()->addMinutes(60));
            Mail::to($user->email)
                ->send(new EmailVerificationMailable($user, $token));
        } catch (\Throwable $e) {
            Log::error('Email verification resend failed', [
                'user_id' => $user->id,
                'error'   => $e->getMessage(),
            ]);
            return $this->error(
                'Failed to send verification email. Please try again shortly.',
                'SERVER_ERROR',
                500
            );
        }

        return $this->success(null, 'A new verification email has been sent.');
    }
}

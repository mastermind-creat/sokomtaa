<?php

namespace App\Traits;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

trait VerifyTurnstile
{
    /**
     * Verify the Cloudflare Turnstile token from the request.
     * Returns null on success, or a 422 JsonResponse on failure.
     *
     * Usage in a controller:
     *   if ($fail = $this->checkTurnstile($request)) return $fail;
     */
    protected function checkTurnstile(Request $request): ?JsonResponse
    {
        // Skip verification in local/testing environments
        if (app()->environment(['local', 'testing'])) {
            return null;
        }

        $secret = config('services.turnstile.secret');

        // If secret is not configured, skip silently rather than blocking all users
        if (empty($secret)) {
            Log::warning('Turnstile secret not configured — skipping verification. Set TURNSTILE_SECRET_KEY in .env');
            return null;
        }

        $token = $request->input('cf_turnstile_token');

        if (empty($token)) {
            return response()->json([
                'success' => false,
                'message' => 'Security verification token missing.',
                'code'    => 'TURNSTILE_MISSING',
            ], 422);
        }

        try {
            $response = Http::timeout(10)->asForm()->post(
                config('services.turnstile.verify_url'),
                [
                    'secret'   => $secret,
                    'response' => $token,
                    'remoteip' => $request->ip(),
                ]
            );

            $result = $response->json();

            if (!($result['success'] ?? false)) {
                $codes = implode(', ', $result['error-codes'] ?? []);
                Log::warning('Turnstile verification failed', [
                    'error_codes' => $codes,
                    'ip'          => $request->ip(),
                    'hostname'    => $result['hostname'] ?? 'unknown',
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Security verification failed. Please try again.',
                    'errors'  => ['turnstile' => [$codes ?: 'Verification failed']],
                    'code'    => 'TURNSTILE_FAILED',
                ], 422);
            }
        } catch (\Exception $e) {
            Log::error('Turnstile verification error: ' . $e->getMessage());
            // Fail open — don't block legitimate users on Cloudflare outage
            return null;
        }

        return null;
    }
}

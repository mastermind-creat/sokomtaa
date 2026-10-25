<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use App\Services\TalkSasaService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SocialAuthController extends Controller
{
    use ApiResponse, \App\Traits\PhoneNormalization;

    // Last deployed: v1.1 — added provider config validation

    public function redirect($provider)
    {
        if (!in_array($provider, ['google', 'apple'])) {
            return $this->error('Provider not supported.', 'VALIDATION_FAILED', 422);
        }

        $clientId = config("services.{$provider}.client_id");
        if (empty($clientId)) {
            return $this->error(
                ucfirst($provider) . ' sign-in is not configured yet.',
                'PROVIDER_NOT_CONFIGURED',
                503
            );
        }

        try {
            /** @var \Laravel\Socialite\Two\AbstractProvider $driver */
            $driver = Socialite::driver($provider);
            return $driver->stateless()->redirect();
        } catch (\Exception $e) {
            Log::error("Social redirect failed for {$provider}: " . $e->getMessage());
            return $this->error('Sign-in is temporarily unavailable. Please try again.', 'AUTH_FAILED', 503);
        }
    }

    public function callback($provider)
    {
        $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/');

        if (!in_array($provider, ['google', 'apple'])) {
            return redirect("{$frontendUrl}/auth/social-callback?error=unsupported_provider");
        }

        try {
            /** @var \Laravel\Socialite\Two\AbstractProvider $driver */
            $driver = Socialite::driver($provider);
            $socialUser = $driver->stateless()->user();
        } catch (\Exception $e) {
            Log::error("Social auth callback failed for {$provider}: " . $e->getMessage());
            return redirect("{$frontendUrl}/auth/social-callback?error=auth_failed");
        }

        $user = User::where('provider_name', $provider)
            ->where('provider_id', $socialUser->getId())
            ->first();

        if (!$user) {
            // Check if user exists by email
            $user = User::where('email', $socialUser->getEmail())->first();

            if ($user) {
                // Link the account
                $user->update([
                    'provider_name' => $provider,
                    'provider_id' => $socialUser->getId(),
                ]);
            } else {
                // Create a new user — phone/role will be completed in next step
                $user = User::create([
                    'name' => $socialUser->getName() ?? 'User',
                    'email' => $socialUser->getEmail(),
                    'provider_name' => $provider,
                    'provider_id' => $socialUser->getId(),
                    'password' => Hash::make(Str::random(24)),
                    'avatar_url' => $socialUser->getAvatar(),
                    'phone_verified' => false,
                ]);
            }
        }

        $token = $user->createToken('auth_token')->plainTextToken;
        $requiresCompletion = is_null($user->phone) || is_null($user->role) ? '1' : '0';

        return redirect("{$frontendUrl}/auth/social-callback?token={$token}&requires_completion={$requiresCompletion}");
    }

    public function completeProfile(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => 'required|string',
            'role' => 'required|in:trader,resident,delivery',
            'national_id' => 'nullable|string',
        ]);

        $user = $request->user();

        if ($user->phone) {
            return $this->error('Profile is already complete.', 'VALIDATION_FAILED', 422);
        }

        $phone = $this->normalizePhone($request->phone);

        if (User::where('phone', $phone)->exists()) {
            return $this->error('The phone number has already been taken.', 'VALIDATION_FAILED', 422);
        }

        $user->update([
            'phone' => $phone,
            'role' => $request->role,
            'national_id' => $request->national_id,
        ]);

        if ($user->role === 'delivery') {
            $user->riderProfile()->create([
                'vehicle_type' => 'motorcycle',
                'verification_status' => 'not_submitted',
                'is_available' => false,
                'earnings_balance' => 0.00,
            ]);
        }

        // Generate a 6-digit OTP to verify the newly attached phone number
        $otp = rand(100000, 999999);
        Cache::put("otp_{$user->id}", $otp, now()->addMinutes(config('otp.expiry_minutes', 10)));

        $smsService = app(TalkSasaService::class);
        $message = "Soko Mtaa: Your verification code is {$otp}. Please do not share it with anyone.";
        $smsService->sendSms($user->phone, $message);
        
        Log::info("OTP for {$user->phone}: {$otp}");

        $data = [
            'user' => $user,
        ];

        if (config('app.debug')) {
            $data['debug_otp'] = $otp;
        }

        return $this->success($data, 'Profile updated. Please verify your phone number.');
    }
}

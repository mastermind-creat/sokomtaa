<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\AbstractProvider;
use App\Services\TalkSasaService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SocialAuthController extends Controller
{
    use ApiResponse, \App\Traits\PhoneNormalization;

    public function redirect(string $provider)
    {
        if (!\in_array($provider, ['google', 'apple'])) {
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
            /** @var AbstractProvider $driver */
            $driver = Socialite::driver($provider);
            return $driver->stateless()->redirect();
        } catch (\Exception $e) {
            Log::error("Social redirect failed for {$provider}: " . $e->getMessage());
            return $this->error('Sign-in is temporarily unavailable. Please try again.', 'AUTH_FAILED', 503);
        }
    }

    public function callback(string $provider)
    {
        $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/');

        if (!\in_array($provider, ['google', 'apple'])) {
            return redirect("{$frontendUrl}/social-callback?error=unsupported_provider");
        }

        try {
            /** @var AbstractProvider $driver */
            $driver = Socialite::driver($provider);
            $socialUser = $driver->stateless()->user();
        } catch (\Exception $e) {
            Log::error("Social auth callback failed for {$provider}: " . $e->getMessage());
            return redirect("{$frontendUrl}/social-callback?error=auth_failed");
        }

        $user = User::where('provider_name', $provider)
            ->where('provider_id', $socialUser->getId())
            ->first();

        if (!$user) {
            $user = User::where('email', $socialUser->getEmail())->first();

            if ($user) {
                $user->update([
                    'provider_name' => $provider,
                    'provider_id'   => $socialUser->getId(),
                ]);
            } else {
                $user = User::create([
                    'name'          => $socialUser->getName() ?? 'User',
                    'email'         => $socialUser->getEmail(),
                    'provider_name' => $provider,
                    'provider_id'   => $socialUser->getId(),
                    'password'      => Hash::make(Str::random(24)),
                    'avatar_url'    => $socialUser->getAvatar(),
                    'phone_verified' => false,
                ]);
            }
        }

        $token              = $user->createToken('auth_token')->plainTextToken;
        $requiresCompletion = ($user->phone === null || $user->role === null) ? '1' : '0';

        return redirect("{$frontendUrl}/social-callback?token={$token}&requires_completion={$requiresCompletion}");
    }

    public function completeProfile(Request $request): JsonResponse
    {
        $request->validate([
            'phone'       => 'required|string',
            'role'        => 'required|in:trader,resident,delivery',
            'national_id' => 'nullable|string',
        ]);

        $user = $request->user();

        if ($user->phone) {
            return $this->error('Profile is already complete.', 'VALIDATION_FAILED', 422);
        }

        $phone = $this->normalizePhone($request->input('phone'));

        if (User::where('phone', $phone)->exists()) {
            return $this->error('The phone number has already been taken.', 'VALIDATION_FAILED', 422);
        }

        $user->update([
            'phone'       => $phone,
            'role'        => $request->input('role'),
            'national_id' => $request->input('national_id'),
        ]);

        if ($user->role === 'delivery') {
            $user->riderProfile()->create([
                'vehicle_type'        => 'motorcycle',
                'verification_status' => 'not_submitted',
                'is_available'        => false,
                'earnings_balance'    => 0.00,
            ]);
        }

        $otp = rand(100000, 999999);
        Cache::put("otp_{$user->id}", $otp, now()->addMinutes(config('otp.expiry_minutes', 10)));

        $smsService = app(TalkSasaService::class);
        $smsService->sendSms($user->phone, "Soko Mtaa: Your verification code is {$otp}. Do not share it.");

        Log::info("OTP for {$user->phone}: {$otp}");

        $data = ['user' => $user];
        if (config('app.debug')) {
            $data['debug_otp'] = $otp;
        }

        return $this->success($data, 'Profile updated. Please verify your phone number.');
    }
}

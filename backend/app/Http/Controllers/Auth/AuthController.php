<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Jobs\SendVerificationEmail;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use App\Services\TalkSasaService;

class AuthController extends Controller
{
    use ApiResponse, \App\Traits\PhoneNormalization, \App\Traits\VerifyTurnstile;

    public function register(RegisterRequest $request): JsonResponse
    {
        if ($fail = $this->checkTurnstile($request)) return $fail;

        $phone = $this->normalizePhone($request->phone);

        if (User::where('phone', $phone)->exists()) {
            return $this->error('This phone number is already registered.', 'ALREADY_EXISTS', 422);
        }
        if ($request->filled('email') && User::where('email', $request->email)->exists()) {
            return $this->error('This email address is already registered.', 'ALREADY_EXISTS', 422);
        }

        $user = User::create([
            'name'               => $request->name,
            'phone'              => $phone,
            'email'              => $request->filled('email') ? $request->email : null,
            'password'           => Hash::make($request->password),
            'role'               => $request->role,
            'national_id'        => $request->national_id,
            'preferred_language' => $request->preferred_language ?? 'en',
            'phone_verified'     => false,
            'email_verified_at'  => null,
        ]);

        if ($user->role === 'delivery') {
            $user->riderProfile()->create([
                'vehicle_type'        => 'motorcycle',
                'verification_status' => 'not_submitted',
                'is_available'        => false,
                'earnings_balance'    => 0.00,
            ]);
        }

        $verificationMethod = $request->verification_method;
        $debugData = [];

        if ($verificationMethod === 'email') {
            try {
                $token = \Illuminate\Support\Str::random(64);
                \Illuminate\Support\Facades\Cache::put("email_verify_{$user->id}", $token, now()->addMinutes(60));
                \Illuminate\Support\Facades\Mail::to($user->email)
                    ->send(new \App\Mail\EmailVerificationMailable($user, $token));
            } catch (\Throwable $e) {
                Log::error('Email verification send failed on registration', [
                    'user_id' => $user->id,
                    'error'   => $e->getMessage(),
                ]);
            }
            $message = 'Account created! Please check your email to verify your account.';
        } else {
            // SMS OTP
            $otp = rand(100000, 999999);
            Cache::put("otp_{$user->id}", $otp, now()->addMinutes(config('otp.expiry_minutes', 10)));
            $smsService = app(TalkSasaService::class);
            $smsService->sendSms($user->phone, "Soko Mtaa: Your verification code is {$otp}. Please do not share it with anyone.");
            Log::info("OTP for {$user->phone}: {$otp}");
            if (config('app.debug')) { $debugData['debug_otp'] = $otp; }
            $message = 'Account created! Please enter the OTP sent to your phone number.';
        }

        $data = array_merge([
            'user'                => $this->formatUser($user),
            'token'               => $user->createToken('auth_token')->plainTextToken,
            'verification_method' => $verificationMethod,
        ], $debugData);

        return $this->success($data, $message, 201);
    }

    // -------------------------------------------------------------------------
    // Login — single smart identifier field (auto-detects phone vs email)
    // -------------------------------------------------------------------------

    public function login(LoginRequest $request): JsonResponse
    {
        if ($fail = $this->checkTurnstile($request)) return $fail;

        $identifier = trim($request->input('identifier', ''));

        // Detect email vs phone — if it contains @ treat as email
        if (str_contains($identifier, '@')) {
            $user = User::where('email', $identifier)->first();
            if (!$user) {
                return $this->error('No account found with that email address.', 'AUTH_FAILED', 422);
            }
        } else {
            $phone = $this->normalizePhone($identifier);
            $user  = User::where('phone', $phone)->first();
            if (!$user) {
                return $this->error('No account found with that phone number.', 'AUTH_FAILED', 422);
            }
        }

        if (!Hash::check($request->password, $user->password)) {
            return $this->error('Incorrect password. Please try again.', 'AUTH_FAILED', 422);
        }

        return $this->success([
            'user'  => $this->formatUser($user),
            'token' => $user->createToken('auth_token')->plainTextToken,
        ], 'Login successful.');
    }

    private function loginWithEmail(LoginRequest $request): JsonResponse
    {
        return $this->login($request);
    }

    private function loginWithPhone(LoginRequest $request): JsonResponse
    {
        return $this->login($request);
    }

    // -------------------------------------------------------------------------
    // Shared helper — adds email_verified flag to all user responses
    // -------------------------------------------------------------------------

    private function formatUser(User $user): array
    {
        $data = $user->toArray();

        // email_verified: true/false based on email_verified_at
        $data['email_verified'] = $user->email_verified_at !== null;

        return $data;
    }

    // -------------------------------------------------------------------------
    // Other endpoints (unchanged)
    // -------------------------------------------------------------------------

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->success(null, 'Logged out successfully.');
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'trader') {
            $user->load('trader');
        } elseif ($user->role === 'delivery') {
            $user->load('riderProfile');
        }

        return $this->success($this->formatUser($user), 'User profile retrieved.');
    }

    public function verifyPhone(Request $request): JsonResponse
    {
        $request->validate(['otp' => 'required|string|size:6']);

        $user      = $request->user();
        $cachedOtp = Cache::get("otp_{$user->id}");

        if (!$cachedOtp || $cachedOtp != $request->otp) {
            return $this->error('The OTP is incorrect or has expired.', 'INVALID_OTP', 422);
        }

        $user->update([
            'phone_verified'    => true,
            'phone_verified_at' => now(),
        ]);

        Cache::forget("otp_{$user->id}");

        return $this->success($this->formatUser($user->fresh()), 'Phone number verified successfully.');
    }

    public function resendOtp(Request $request): JsonResponse
    {
        $user = $request->user();

        $otp = rand(100000, 999999);
        Cache::put("otp_{$user->id}", $otp, now()->addMinutes(config('otp.expiry_minutes', 10)));

        $smsService = app(TalkSasaService::class);
        $message = "Soko Mtaa: Your verification code is {$otp}. Please do not share it with anyone.";
        $smsService->sendSms($user->phone, $message);

        Log::info("OTP for {$user->phone} (resent): {$otp}");

        $data = [];
        if (config('app.debug')) {
            $data['debug_otp'] = $otp;
        }

        return $this->success($data, 'A new verification code has been sent to your phone.');
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        if ($fail = $this->checkTurnstile($request)) return $fail;

        // Support both email and phone for password reset
        if ($request->filled('email')) {
            return $this->forgotPasswordByEmail($request);
        }

        $phone = $this->normalizePhone($request->phone);
        $user  = User::where('phone', $phone)->first();

        if (!$user) {
            return $this->error('The selected phone number is not registered.', 'VALIDATION_FAILED', 422);
        }

        $otp = rand(100000, 999999);
        Cache::put("pwd_reset_otp_{$user->phone}", $otp, now()->addMinutes(10));

        $smsService = app(TalkSasaService::class);
        $message = "Soko Mtaa: Your password reset code is {$otp}. It expires in 10 minutes.";
        $smsService->sendSms($user->phone, $message);

        Log::info("Password reset OTP sent to {$user->phone}");

        $data = [];
        if (config('app.debug')) {
            $data['debug_otp'] = $otp;
        }

        return $this->success($data, 'Password reset code sent to your phone.');
    }

    private function forgotPasswordByEmail(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        // Always return success to prevent email enumeration
        if (!$user) {
            return $this->success(null, 'If that email is registered, a reset code has been sent.');
        }

        $otp = rand(100000, 999999);
        Cache::put("pwd_reset_otp_email_{$user->id}", $otp, now()->addMinutes(10));

        try {
            \Illuminate\Support\Facades\Mail::to($user->email)
                ->send(new \App\Mail\PasswordResetMailable($user, (string) $otp));
        } catch (\Throwable $e) {
            Log::error('Password reset email failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
            // Non-blocking — still return success so the user can retry
        }

        Log::info("Password reset OTP emailed to user #{$user->id}");

        $data = [];
        if (config('app.debug')) {
            $data['debug_otp'] = $otp;
        }

        return $this->success($data, 'If that email is registered, a reset code has been sent.');
    }

    public function resetPassword(Request $request): JsonResponse
    {
        // Email path
        if ($request->filled('email')) {
            $request->validate([
                'email'    => 'required|email|exists:users,email',
                'otp'      => 'required|string|size:6',
                'password' => [
                    'required',
                    'string',
                    'confirmed',
                    \Illuminate\Validation\Rules\Password::min(8)
                        ->letters()
                        ->numbers()
                        ->symbols()
                        ->mixedCase(),
                ],
            ]);

            $user      = User::where('email', $request->email)->firstOrFail();
            $cacheKey  = "pwd_reset_otp_email_{$user->id}";
            $cachedOtp = Cache::get($cacheKey);

            if (!$cachedOtp || $cachedOtp != $request->otp) {
                return $this->error('The reset code is incorrect or has expired.', 'INVALID_OTP', 422);
            }

            $user->update(['password' => Hash::make($request->password)]);
            Cache::forget($cacheKey);
            $user->tokens()->delete();

            return $this->success(null, 'Password has been reset successfully. You can now login.');
        }

        // Phone path
        $phone = $this->normalizePhone($request->phone);
        $request->merge(['phone' => $phone]);

        $request->validate([
            'phone'    => 'required|string|exists:users,phone',
            'otp'      => 'required|string|size:6',
            'password' => [
                'required',
                'string',
                'confirmed',
                \Illuminate\Validation\Rules\Password::min(8)
                    ->letters()
                    ->numbers()
                    ->symbols()
                    ->mixedCase(),
            ],
        ]);

        $cachedOtp = Cache::get("pwd_reset_otp_{$request->phone}");

        if (!$cachedOtp || $cachedOtp != $request->otp) {
            return $this->error('The reset code is incorrect or has expired.', 'INVALID_OTP', 422);
        }

        $user = User::where('phone', $request->phone)->first();
        $user->update(['password' => Hash::make($request->password)]);

        Cache::forget("pwd_reset_otp_{$request->phone}");
        $user->tokens()->delete();

        return $this->success(null, 'Password has been reset successfully. You can now login.');
    }
}

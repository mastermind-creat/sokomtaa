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

    // -------------------------------------------------------------------------
    // Registration
    // -------------------------------------------------------------------------

    public function register(RegisterRequest $request): JsonResponse
    {
        if ($fail = $this->checkTurnstile($request)) return $fail;

        // Branch: email path vs phone path
        if ($request->filled('email') && !$request->filled('phone')) {
            return $this->registerWithEmail($request);
        }

        return $this->registerWithPhone($request);
    }

    // -------------------------------------------------------------------------
    // Email registration path
    // -------------------------------------------------------------------------

    private function registerWithEmail(RegisterRequest $request): JsonResponse
    {
        if (User::where('email', $request->email)->exists()) {
            return $this->error('The email address has already been taken.', 'ALREADY_EXISTS', 422);
        }

        $user = User::create([
            'name'               => $request->name,
            'phone'              => null,
            'email'              => $request->email,
            'password'           => Hash::make($request->password),
            'role'               => $request->role,
            'national_id'        => $request->national_id,
            'preferred_language' => $request->preferred_language ?? 'en',
            'phone_verified'     => false,
            'email_verified_at'  => null,
        ]);

        // Dispatch verification email as a queued job (fire-and-forget)
        SendVerificationEmail::dispatch($user);

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->success([
            'user'  => $this->formatUser($user),
            'token' => $token,
        ], 'Account created successfully. Please check your email to verify your address.');
    }

    // -------------------------------------------------------------------------
    // Phone registration path (unchanged logic)
    // -------------------------------------------------------------------------

    private function registerWithPhone(RegisterRequest $request): JsonResponse
    {
        $phone = $this->normalizePhone($request->phone);

        if (User::where('phone', $phone)->exists()) {
            return $this->error('The phone number has already been taken.', 'ALREADY_EXISTS', 422);
        }

        $user = User::create([
            'name'               => $request->name,
            'phone'              => $phone,
            'email'              => $request->email,
            'password'           => Hash::make($request->password),
            'role'               => $request->role,
            'national_id'        => $request->national_id,
            'preferred_language' => $request->preferred_language ?? 'en',
        ]);

        if ($user->role === 'delivery') {
            $user->riderProfile()->create([
                'vehicle_type'        => 'motorcycle',
                'verification_status' => 'not_submitted',
                'is_available'        => false,
                'earnings_balance'    => 0.00,
            ]);
        }

        // Generate and cache a 6-digit OTP for phone verification
        $otp = rand(100000, 999999);
        Cache::put("otp_{$user->id}", $otp, now()->addMinutes(config('otp.expiry_minutes', 10)));

        $smsService = app(TalkSasaService::class);
        $message = "Soko Mtaa: Your verification code is {$otp}. Please do not share it with anyone.";
        $smsService->sendSms($user->phone, $message);

        Log::info("OTP for {$user->phone}: {$otp}");

        $data = [
            'user'  => $this->formatUser($user),
            'token' => $user->createToken('auth_token')->plainTextToken,
        ];

        if (config('app.debug')) {
            $data['debug_otp'] = $otp;
        }

        return $this->success($data, 'Account created successfully. Please verify your phone number.');
    }

    // -------------------------------------------------------------------------
    // Login — phone OR email path
    // -------------------------------------------------------------------------

    public function login(LoginRequest $request): JsonResponse
    {
        if ($fail = $this->checkTurnstile($request)) return $fail;

        if ($request->filled('email')) {
            return $this->loginWithEmail($request);
        }

        return $this->loginWithPhone($request);
    }

    private function loginWithEmail(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return $this->error('No account found with that email address.', 'AUTH_FAILED', 422);
        }

        if (!Hash::check($request->password, $user->password)) {
            return $this->error('Incorrect password. Please try again.', 'AUTH_FAILED', 422);
        }

        return $this->success([
            'user'  => $this->formatUser($user),
            'token' => $user->createToken('auth_token')->plainTextToken,
        ], 'Login successful.');
    }

    private function loginWithPhone(LoginRequest $request): JsonResponse
    {
        $phone = $this->normalizePhone($request->phone);

        $user = User::where('phone', $phone)->first();

        if (!$user) {
            return $this->error('The phone number is not registered.', 'AUTH_FAILED', 422);
        }

        if (!Hash::check($request->password, $user->password)) {
            return $this->error('Incorrect password. Please try again.', 'AUTH_FAILED', 422);
        }

        return $this->success([
            'user'  => $this->formatUser($user),
            'token' => $user->createToken('auth_token')->plainTextToken,
        ], 'Login successful.');
    }

    // -------------------------------------------------------------------------
    // Shared helper — adds email_verified flag to all user responses
    // -------------------------------------------------------------------------

    private function formatUser(User $user): array
    {
        $data = $user->toArray();

        // Surface email_verified as an explicit boolean flag on the user object
        $data['email_verified'] = $user->isEmailRegistered()
            ? ($user->email_verified_at !== null)
            : null; // null = not applicable (phone user)

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

    public function resetPassword(Request $request): JsonResponse
    {
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

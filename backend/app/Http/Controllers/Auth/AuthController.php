<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use App\Services\TalkSasaService;
use Illuminate\Support\Facades\Cache;

class AuthController extends Controller
{
    use ApiResponse;

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->name,
            'phone' => $request->phone,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'national_id' => $request->national_id,
            'preferred_language' => $request->preferred_language ?? 'en',
        ]);

        // Generate a 6-digit OTP
        $otp = rand(100000, 999999);
        
        // Store OTP in cache for 10 minutes
        Cache::put("otp_{$user->id}", $otp, now()->addMinutes(config('otp.expiry_minutes', 10)));

        // Send OTP via Talk Sasa
        $smsService = app(TalkSasaService::class);
        $message = "Soko Mtaa: Your verification code is {$otp}. Please do not share it with anyone.";
        $smsService->sendSms($user->phone, $message);
        
        Log::info("OTP sent to {$user->phone}");
        
        // In a real scenario, we'd store this in cache or a verification table
        // For now, we'll return it in the response if APP_DEBUG is true for easy testing
        $data = [
            'user' => $user,
            'token' => $user->createToken('auth_token')->plainTextToken,
        ];

        if (config('app.debug')) {
            $data['debug_otp'] = $otp;
        }

        return $this->success($data, 'Account created successfully. Please verify your phone number.');
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('phone', $request->phone)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'phone' => ['Invalid credentials.'],
            ]);
        }

        return $this->success([
            'user' => $user,
            'token' => $user->createToken('auth_token')->plainTextToken,
        ], 'Login successful.');
    }

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
        }
        return $this->success($user, 'User profile retrieved.');
    }

    public function verifyPhone(Request $request): JsonResponse
    {
        $request->validate(['otp' => 'required|string|size:6']);
        
        $user = $request->user();
        $cachedOtp = Cache::get("otp_{$user->id}");

        if (!$cachedOtp || $cachedOtp != $request->otp) {
            return $this->error('The OTP is incorrect or has expired.', 'INVALID_OTP', 422);
        }

        $user->update([
            'phone_verified' => true,
            'phone_verified_at' => now(),
        ]);

        // Clear OTP from cache
        Cache::forget("otp_{$user->id}");

        return $this->success($user, 'Phone number verified successfully.');
    }

    public function resendOtp(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Generate a new 6-digit OTP
        $otp = rand(100000, 999999);
        
        // Store OTP in cache for 10 minutes
        Cache::put("otp_{$user->id}", $otp, now()->addMinutes(config('otp.expiry_minutes', 10)));

        // Send OTP via Talk Sasa
        $smsService = app(TalkSasaService::class);
        $message = "Soko Mtaa: Your verification code is {$otp}. Please do not share it with anyone.";
        $smsService->sendSms($user->phone, $message);
        
        Log::info("OTP resent to {$user->phone}");

        $data = [];
        if (config('app.debug')) {
            $data['debug_otp'] = $otp;
        }

        return $this->success($data, 'A new verification code has been sent to your phone.');
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => 'required|string|exists:users,phone',
        ]);

        $user = User::where('phone', $request->phone)->first();

        // Generate a 6-digit OTP
        $otp = rand(100000, 999999);
        
        // Store OTP in cache for 10 minutes (using phone as key)
        Cache::put("pwd_reset_otp_{$user->phone}", $otp, now()->addMinutes(10));

        // Send OTP via Talk Sasa
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
        $request->validate([
            'phone' => 'required|string|exists:users,phone',
            'otp' => 'required|string|size:6',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $cachedOtp = Cache::get("pwd_reset_otp_{$request->phone}");

        if (!$cachedOtp || $cachedOtp != $request->otp) {
            return $this->error('The reset code is incorrect or has expired.', 'INVALID_OTP', 422);
        }

        $user = User::where('phone', $request->phone)->first();
        
        $user->update([
            'password' => Hash::make($request->password),
        ]);

        // Clear OTP from cache
        Cache::forget("pwd_reset_otp_{$request->phone}");
        
        // Revoke all existing tokens for security
        $user->tokens()->delete();

        return $this->success(null, 'Password has been reset successfully. You can now login.');
    }
}

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
            'preferred_language' => $request->preferred_language ?? 'sw',
        ]);

        // Generate a simple 6-digit OTP for testing
        $otp = rand(100000, 999999);
        
        // Log Mode: Africa's Talking placeholder
        Log::info("OTP for {$user->phone}: {$otp}");
        
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
        return $this->success($request->user(), 'User profile retrieved.');
    }

    public function verifyPhone(Request $request): JsonResponse
    {
        $request->validate(['otp' => 'required|string|size:6']);

        // Since we are in log mode/testing, any 6-digit code works for now
        // Or we could implement a simple verification logic if needed.
        
        $user = $request->user();
        $user->update([
            'phone_verified' => true,
            'phone_verified_at' => now(),
        ]);

        return $this->success($user, 'Phone number verified successfully.');
    }
}

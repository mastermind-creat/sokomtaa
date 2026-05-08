<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    use ApiResponse;

    /**
     * Get the authenticated user's profile.
     */
    public function show(): JsonResponse
    {
        return $this->success(Auth::user());
    }

    /**
     * Update the authenticated user's profile.
     */
    public function update(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name'               => 'sometimes|string|max:255',
            'email'              => ['sometimes', 'nullable', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'preferred_language' => 'sometimes|string|in:en,sw',
            'avatar_url'         => 'sometimes|nullable|string',
            'national_id'        => 'sometimes|nullable|string|max:20',
        ]);

        $user->update($validated);

        return $this->success($user, 'Profile updated. (Wasifu imesasishwa.)');
    }

    /**
     * Change the authenticated user's password.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required',
            'password'         => 'required|string|min:8|confirmed',
        ]);

        $user = Auth::user();

        if (!Hash::check($request->current_password, $user->password)) {
            return $this->error('Current password is incorrect. (Nenosiri la sasa si sahihi.)', 422);
        }

        $user->update([
            'password' => Hash::make($request->password)
        ]);

        return $this->success(null, 'Password changed successfully. (Nenosiri imebadilishwa.)');
    }
}

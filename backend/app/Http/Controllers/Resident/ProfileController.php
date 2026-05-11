<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
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
        /** @var \App\Models\User $user */
        $user = Auth::user();

        Log::info('Resident Profile Update Request:', [
            'user_id' => $user->id,
            'data' => $request->all()
        ]);

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

         /** @var \App\Models\User $user */

        $user = Auth::user();

        if (!Hash::check($request->current_password, $user->password)) {
            return $this->error('Current password is incorrect. (Nenosiri la sasa si sahihi.)', 422);
        }

        $user->update([
            'password' => Hash::make($request->password)
        ]);

        return $this->success(null, 'Password changed successfully. (Nenosiri imebadilishwa.)');
    }

    /**
     * Upload an avatar for the user profile.
     */
    public function uploadAvatar(Request $request, \App\Services\CloudinaryService $cloudinary): JsonResponse
    {
        Log::info('Resident Avatar Upload Triggered', ['user_id' => Auth::id()]);
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        if ($request->hasFile('avatar')) {
            Log::info('Processing Resident Avatar File');
            $url = $cloudinary->uploadImage($request->file('avatar'), 'profiles');
            
            if ($url) {
                // Delete old avatar if it exists
                if ($user->avatar_url) {
                    $cloudinary->deleteImage($user->avatar_url);
                }
                
                Log::info('Resident Avatar Uploaded:', ['user_id' => $user->id, 'url' => $url]);
                $user->update(['avatar_url' => $url]);
                return $this->success(['avatar_url' => $url], 'Profile picture updated successfully. (Picha ya wasifu imesasishwa.)');
            }
            Log::error('Resident Avatar Upload Failed in Service');
            return $this->error('Failed to upload image.', 'UPLOAD_ERROR', 500);
        }

        return $this->error('No image provided.', 'BAD_REQUEST', 400);
    }
    
    /**
     * Delete (deactivate) the authenticated user's account.
     */
    public function destroy(Request $request): JsonResponse
    {
        $request->validate([
            'password' => 'required'
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!Hash::check($request->password, $user->password)) {
            return $this->error('Incorrect password. (Nenosiri si sahihi.)', 422);
        }

        Log::warning('User Account Deletion Executed:', ['user_id' => $user->id, 'email' => $user->email]);

        // Clear tokens
        $user->tokens()->delete();
        
        $user->delete();

        return $this->success(null, 'Account deactivated successfully. (Akaunti imelemazwa.)');
    }
}

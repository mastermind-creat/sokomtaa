<?php

namespace App\Http\Controllers\Trader;

use App\Http\Controllers\Controller;
use App\Http\Requests\Trader\TraderProfileRequest;
use App\Models\Trader;
use App\Models\Stall;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class TraderProfileController extends Controller
{
    use ApiResponse;

    /**
     * Initial setup for a trader profile.
     */
    public function setup(TraderProfileRequest $request): JsonResponse
    {
        $user = $request->user();

        if ($user->trader) {
            return $this->error('You already have a trader profile. (Tayari unayo akaunti ya mfanyabiashara.)', 'ALREADY_EXISTS', 422);
        }

        return DB::transaction(function () use ($request, $user) {
            $stallId = null;

            // If a stall number is provided, try to find and link it
            if ($request->stall_number) {
                $stall = Stall::where('stall_number', $request->stall_number)
                    ->where('market_id', $request->market_id)
                    ->first();

                if ($stall) {
                    if ($stall->status === 'occupied') {
                        return $this->error('This stall is already occupied. (Kibanda hiki tayari kina mfanyabiashara.)', 'STALL_OCCUPIED', 422);
                    }
                    $stallId = $stall->id;
                    $stall->update(['status' => 'occupied']);
                }
            }

            // Create Trader Profile
            $trader = Trader::create([
                'user_id' => $user->id,
                'stall_id' => $stallId,
                'market_id' => $request->market_id,
                'business_name' => $request->business_name,
                'business_name_sw' => $request->business_name_sw,
                'description' => $request->description,
                'mpesa_number' => $request->mpesa_number ?? $user->phone,
                'permit_number' => $request->permit_number,
                'verification_status' => 'pending',
                'is_open' => false,
                'opening_time' => $request->opening_time ?? '06:00',
                'closing_time' => $request->closing_time ?? '18:00',
            ]);

            // Update User Role to Trader (if not already)
            $user->update(['role' => 'trader']);

            return $this->success($trader, 'Trader profile created successfully. (Wasifu wa mfanyabiashara umeundwa.)', 201);
        });
    }

    /**
     * Get the current trader profile.
     */
    public function me(): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $trader = $user->trader()->with(['stall', 'market'])->first();

        if (!$trader) {
            return $this->error('You are not registered as a trader. (Haujava kujiandikisha kama mfanyabiashara.)', 'NOT_FOUND', 404);
        }

        return $this->success($trader);
    }

    /**
     * Update trader profile details.
     */
    public function update(TraderProfileRequest $request): JsonResponse
    {
        $trader = $request->user()->trader;

        if (!$trader) {
            return $this->error('Profile not found. (Wasifu haupatikani.)', 'NOT_FOUND', 404);
        }

        $trader->update($request->validated());

        return $this->success($trader, 'Profile updated successfully. (Wasifu umesasishwa.)');
    }
    /**
     * Upload an avatar for the trader profile.
     */
    public function uploadAvatar(\Illuminate\Http\Request $request, \App\Services\CloudinaryService $cloudinary): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        $trader = $request->user()->trader;

        if (!$trader) {
            return $this->error('Profile not found. (Wasifu haupatikani.)', 'NOT_FOUND', 404);
        }

        if ($request->hasFile('avatar')) {
            $url = $cloudinary->uploadImage($request->file('avatar'), 'traders');
            
            if ($url) {
                // If the trader already has an avatar that isn't null, we could optionally delete it here
                if ($trader->avatar_url) {
                    $cloudinary->deleteImage($trader->avatar_url);
                }
                
                $trader->update(['avatar_url' => $url]);
                return $this->success(['avatar_url' => $url], 'Avatar uploaded successfully. (Picha imepakiwa kikamilifu.)');
            }
            return $this->error('Failed to upload image. (Imeshindwa kupakia picha.)', 'UPLOAD_ERROR', 500);
        }

        return $this->error('No image provided. (Hakuna picha iliyopatikana.)', 'BAD_REQUEST', 400);
    }
}

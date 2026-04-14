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
            return $this->error('Tayari unayo akaunti ya mfanyabiashara. (You already have a trader profile.)', 'ALREADY_EXISTS', 422);
        }

        return DB::transaction(function () use ($request, $user) {
            // Find the stall within the selected market
            $stall = Stall::where('stall_number', $request->stall_number)
                ->where('market_id', $request->market_id)
                ->first();

            if (!$stall) {
                return $this->error('Kibanda hiki hakipatikani katika soko hili. (This stall is not available in this market.)', 'STALL_NOT_FOUND', 422);
            }

            if ($stall->status === 'occupied') {
                return $this->error('Kibanda hiki tayari kina mfanyabiashara. (This stall is already occupied.)', 'STALL_OCCUPIED', 422);
            }

            // Create Trader Profile
            $trader = Trader::create([
                'user_id' => $user->id,
                'stall_id' => $stall->id,
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

            // Update Stall Status
            $stall->update(['status' => 'occupied']);

            // Update User Role to Trader (if not already)
            $user->update(['role' => 'trader']);

            return $this->success($trader, 'Wasifu wa mfanyabiashara umeundwa. (Trader profile created successfully.)', 201);
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
            return $this->error('Haujava kujiandikisha kama mfanyabiashara. (You are not registered as a trader.)', 'NOT_FOUND', 404);
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
            return $this->error('Wasifu haupatikani. (Profile not found.)', 'NOT_FOUND', 404);
        }

        $trader->update($request->validated());

        return $this->success($trader, 'Wasifu umesasishwa. (Profile updated successfully.)');
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
            return $this->error('Wasifu haupatikani. (Profile not found.)', 'NOT_FOUND', 404);
        }

        if ($request->hasFile('avatar')) {
            $url = $cloudinary->uploadImage($request->file('avatar'), 'traders');
            
            if ($url) {
                // If the trader already has an avatar that isn't null, we could optionally delete it here
                if ($trader->avatar_url) {
                    $cloudinary->deleteImage($trader->avatar_url);
                }
                
                $trader->update(['avatar_url' => $url]);
                return $this->success(['avatar_url' => $url], 'Picha imepakiwa kikamilifu. (Avatar uploaded successfully.)');
            }
            return $this->error('Imeshindwa kupakia picha. (Failed to upload image.)', 'UPLOAD_ERROR', 500);
        }

        return $this->error('Hakuna picha iliyopatikana. (No image provided.)', 'BAD_REQUEST', 400);
    }
}

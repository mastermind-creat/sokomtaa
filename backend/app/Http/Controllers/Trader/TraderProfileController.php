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
use Illuminate\Support\Facades\Log;

class TraderProfileController extends Controller
{
    use ApiResponse;

    /**
     * Initial setup for a trader profile.
     */
    public function setup(TraderProfileRequest $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        if ($user->trader) {
            return $this->error('You already have a trader profile.', 'ALREADY_EXISTS', 422);
        }

        return DB::transaction(function () use ($request, $user) {
            $stallId = null;
            $cloudinary = app(\App\Services\CloudinaryService::class);

            // Handle Image Uploads (multipart – for web forms)
            $avatarUrl = $request->avatar_url; // client-side Cloudinary URL takes priority
            if (!$avatarUrl && $request->hasFile('avatar')) {
                $avatarUrl = $cloudinary->uploadImage($request->file('avatar'), 'traders/logos');
            }

            $bannerUrl = $request->banner_url;
            if (!$bannerUrl && $request->hasFile('banner')) {
                $bannerUrl = $cloudinary->uploadImage($request->file('banner'), 'traders/banners');
            }

            // Normalize Times (AM/PM to HH:mm)
            $openingTime = $this->normalizeTime($request->opening_time ?? '06:00');
            $closingTime = $this->normalizeTime($request->closing_time ?? '18:00');

            // Default stall_type to 'managed' if not provided
            $stallType = $request->stall_type ?? 'managed';

            // Resolve market_id — fall back to the first active market when not provided
            $marketId = $request->market_id;
            if (!$marketId) {
                $defaultMarket = \App\Models\Market::where('is_active', true)->first();
                $marketId = $defaultMarket?->id;
            }

            if (!$marketId) {
                return $this->error('No market is available. Please contact an administrator.', 'NO_MARKET', 422);
            }

            // If a stall number is provided, try to find and link it
            if ($request->stall_number) {
                $stall = Stall::where('stall_number', $request->stall_number)
                    ->where('market_id', $marketId)
                    ->first();

                if ($stall) {
                    if ($stall->status === 'occupied') {
                        return $this->error('This stall is already occupied.', 'STALL_OCCUPIED', 422);
                    }
                    $stallId = $stall->id;
                    $stall->update(['status' => 'occupied']);
                }
            }

            // Create Trader Profile
            $trader = Trader::create([
                'user_id'             => $user->id,
                'stall_id'            => $stallId,
                'market_id'           => $marketId,
                'stall_type'          => $stallType,
                'latitude'            => $request->latitude,
                'longitude'           => $request->longitude,
                'business_name'       => $request->business_name,
                'business_name_sw'    => $request->business_name_sw,
                'description'         => $request->description,
                'mpesa_number'        => $request->mpesa_number ?? $user->phone,
                'permit_number'       => $request->permit_number,
                'verification_status' => 'unverified',
                'is_open'             => false,
                'opening_time'        => $openingTime,
                'closing_time'        => $closingTime,
                'avatar_url'          => $avatarUrl,
                'banner_url'          => $bannerUrl,
            ]);

            // Update User Role to Trader (if not already)
            $user->update(['role' => 'trader']);

            // Notify Admins about new registration
            $admins = \App\Models\User::where('role', 'admin')->get();
            $notificationService = app(\App\Services\NotificationService::class);
            foreach ($admins as $admin) {
                $notificationService->send(
                    $admin,
                    'New Merchant Registration',
                    "{$trader->business_name} has registered for a permit.",
                    'trader_signup',
                    ['trader_id' => $trader->id]
                );
            }

            return $this->success($trader, 'Trader profile created successfully. Please proceed to KYC verification.', 201);
        });
    }

    /**
     * Submit KYC documents for verification.
     */
    public function submitKyc(\Illuminate\Http\Request $request, \App\Services\CloudinaryService $cloudinary): JsonResponse
    {
        $request->validate([
            'id_front' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
            'id_back' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
            'selfie' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        $trader = $request->user()->trader;

        if (!$trader) {
            return $this->error('Profile not found.', 'NOT_FOUND', 404);
        }

        $updates = [];

        if ($request->hasFile('id_front')) {
            $updates['id_front_url'] = $cloudinary->uploadImage($request->file('id_front'), 'traders/kyc');
        }

        if ($request->hasFile('id_back')) {
            $updates['id_back_url'] = $cloudinary->uploadImage($request->file('id_back'), 'traders/kyc');
        }

        if ($request->hasFile('selfie')) {
            $updates['selfie_url'] = $cloudinary->uploadImage($request->file('selfie'), 'traders/kyc');
        }

        $updates['verification_status'] = 'pending';
        $trader->update($updates);

        // Notify Admins about KYC submission
        $admins = \App\Models\User::where('role', 'admin')->get();
        $notificationService = app(\App\Services\NotificationService::class);
        foreach ($admins as $admin) {
            $notificationService->send(
                $admin,
                'KYC Documents Submitted',
                "{$trader->business_name} has submitted identity documents for review.",
                'kyc_submitted',
                ['trader_id' => $trader->id]
            );
        }

        return $this->success($trader, 'KYC documents submitted successfully. Admin will verify shortly.');
    }

    /**
     * Get the current trader profile.
     */
    public function me(): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $trader = $user->trader()->with(['stall', 'market', 'user'])->first();

        if (!$trader) {
            return $this->error('You are not registered as a trader.', 'NOT_FOUND', 404);
        }

        return $this->success($trader);
    }

    /**
     * Update trader profile details.
     */
    public function update(TraderProfileRequest $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $trader = $user->trader;

        if (!$trader) {
            return $this->error('Profile not found. Please complete your setup first.', 'NOT_FOUND', 404);
        }

        // Build the update payload from all validated fields that were sent.
        // We use only() on the validated set so URL string fields (avatar_url,
        // banner_url, permit_image_url, id_front_url, id_back_url) that come
        // from Cloudinary client-side uploads are also applied.
        $validated = $request->validated();

        // Normalize times if provided
        if (isset($validated['opening_time'])) {
            $validated['opening_time'] = $this->normalizeTime($validated['opening_time']);
        }
        if (isset($validated['closing_time'])) {
            $validated['closing_time'] = $this->normalizeTime($validated['closing_time']);
        }

        // Handle server-side file uploads if present (multipart form)
        $cloudinary = app(\App\Services\CloudinaryService::class);
        if ($request->hasFile('avatar')) {
            $url = $cloudinary->uploadImage($request->file('avatar'), 'traders/logos');
            if ($url) {
                $validated['avatar_url'] = $url;
                $user->update(['avatar_url' => $url]);
            }
            unset($validated['avatar']);
        }
        if ($request->hasFile('banner')) {
            $url = $cloudinary->uploadImage($request->file('banner'), 'traders/banners');
            if ($url) $validated['banner_url'] = $url;
            unset($validated['banner']);
        }
        if ($request->hasFile('permit')) {
            $url = $cloudinary->uploadImage($request->file('permit'), 'traders/permits');
            if ($url) $validated['permit_image_url'] = $url;
            unset($validated['permit']);
        }

        // Sync avatar_url to User table when updating from client-side upload
        if (isset($validated['avatar_url']) && $validated['avatar_url']) {
            $user->update(['avatar_url' => $validated['avatar_url']]);
        }

        // Remove null / empty strings so we don't accidentally blank out fields
        $payload = array_filter($validated, fn($v) => !is_null($v) && $v !== '');

        Log::info('Trader Profile Update:', ['trader_id' => $trader->id, 'fields' => array_keys($payload)]);

        $trader->update($payload);

        return $this->success($trader->fresh(['stall', 'market', 'user']), 'Profile updated successfully.');
    }

    /**
     * Upload an avatar for the trader profile.
     */
    public function uploadAvatar(\Illuminate\Http\Request $request, \App\Services\CloudinaryService $cloudinary): JsonResponse
    {
        Log::info('Trader Avatar Upload Triggered', ['user_id' => Auth::id()]);
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        $trader = $request->user()->trader;

        if (!$trader) {
            return $this->error('Profile not found.', 'NOT_FOUND', 404);
        }

        if ($request->hasFile('avatar')) {
            Log::info('Processing Trader Avatar File');
            $url = $cloudinary->uploadImage($request->file('avatar'), 'traders/logos');
            
            if ($url) {
                if ($trader->avatar_url) {
                    $cloudinary->deleteImage($trader->avatar_url);
                }
                
                Log::info('Trader Avatar Uploaded:', ['trader_id' => $trader->id, 'url' => $url]);
                $trader->update(['avatar_url' => $url]);
                
                // Sync with User profile avatar
                /** @var \App\Models\User $user */
                $user = Auth::user();
                $user->update(['avatar_url' => $url]);
                
                return $this->success(['avatar_url' => $url], 'Profile picture updated successfully.');
            }
            Log::error('Trader Avatar Upload Failed in Service');
            return $this->error('Failed to upload image.', 'UPLOAD_ERROR', 500);
        }

        return $this->error('No image provided.', 'BAD_REQUEST', 400);
    }

    /**
     * Upload a banner for the trader profile.
     */
    public function uploadBanner(\Illuminate\Http\Request $request, \App\Services\CloudinaryService $cloudinary): JsonResponse
    {
        Log::info('Trader Banner Upload Triggered', ['user_id' => Auth::id()]);
        $request->validate([
            'banner' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        $trader = $request->user()->trader;

        if (!$trader) {
            return $this->error('Profile not found.', 'NOT_FOUND', 404);
        }

        if ($request->hasFile('banner')) {
            Log::info('Processing Trader Banner File');
            $url = $cloudinary->uploadImage($request->file('banner'), 'traders/banners');
            
            if ($url) {
                if ($trader->banner_url) {
                    $cloudinary->deleteImage($trader->banner_url);
                }
                
                Log::info('Trader Banner Uploaded:', ['trader_id' => $trader->id, 'url' => $url]);
                $trader->update(['banner_url' => $url]);
                return $this->success(['banner_url' => $url], 'Banner uploaded successfully. (Bango imepakiwa.)');
            }
            Log::error('Trader Banner Upload Failed in Service');
            return $this->error('Failed to upload image.', 'UPLOAD_ERROR', 500);
        }

        return $this->error('No image provided.', 'BAD_REQUEST', 400);
    }

    /**
     * Upload a business permit for the trader profile.
     */
    public function uploadPermit(\Illuminate\Http\Request $request, \App\Services\CloudinaryService $cloudinary): JsonResponse
    {
        Log::info('Trader Permit Upload Triggered', ['user_id' => Auth::id()]);
        $request->validate([
            'permit' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        $trader = $request->user()->trader;

        if (!$trader) {
            return $this->error('Profile not found.', 'NOT_FOUND', 404);
        }

        if ($request->hasFile('permit')) {
            Log::info('Processing Trader Permit File');
            $url = $cloudinary->uploadImage($request->file('permit'), 'traders/permits');
            
            if ($url) {
                if ($trader->permit_image_url) {
                    $cloudinary->deleteImage($trader->permit_image_url);
                }
                
                Log::info('Trader Permit Uploaded:', ['trader_id' => $trader->id, 'url' => $url]);
                $trader->update(['permit_image_url' => $url]);
                return $this->success(['permit_image_url' => $url], 'Permit uploaded successfully.');
            }
            Log::error('Trader Permit Upload Failed in Service');
            return $this->error('Failed to upload image.', 'UPLOAD_ERROR', 500);
        }
        return $this->error('No image provided.', 'BAD_REQUEST', 400);
    }
    /**
     * Update KYC document URLs after direct client-side upload.
     */
    public function updateKycUrls(\Illuminate\Http\Request $request): JsonResponse
    {
        $request->validate([
            'id_front_url' => 'sometimes|string',
            'id_back_url' => 'sometimes|string',
            'selfie_url' => 'sometimes|string',
        ]);

        $trader = $request->user()->trader;
        if (!$trader) {
            return $this->error('Profile not found.', 'NOT_FOUND', 404);
        }

        $trader->update($request->only(['id_front_url', 'id_back_url', 'selfie_url']));

        // Notify Admins
        $admins = \App\Models\User::where('role', 'admin')->get();
        $notificationService = app(\App\Services\NotificationService::class);
        foreach ($admins as $admin) {
            $notificationService->send(
                $admin,
                'KYC Documents Updated',
                "{$trader->business_name} has updated identity documents.",
                'kyc_updated',
                ['trader_id' => $trader->id]
            );
        }

        return $this->success($trader, 'KYC documents updated successfully.');
    }

    /**
     * Normalize time to HH:mm format.
     */
    private function normalizeTime(?string $time): ?string
    {
        if (!$time) return null;
        
        try {
            // Try to parse AM/PM format first
            return \Carbon\Carbon::parse($time)->format('H:i');
        } catch (\Exception $e) {
            // Fallback for simple HH:mm if parsing fails
            if (preg_match('/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/', $time)) {
                return $time;
            }
            return null;
        }
    }
}

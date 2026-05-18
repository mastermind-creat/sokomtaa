<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DeliveryProfile;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    /**
     * Display a listing of all system users (including delivery riders).
     */
    public function index(Request $request): JsonResponse
    {
        $roleFilter = $request->query('role');
        $search = $request->query('search');

        $users = User::latest()
            ->when($roleFilter && $roleFilter !== 'all', function ($query) use ($roleFilter) {
                return $query->where('role', $roleFilter);
            })
            ->when($search, function ($query) use ($search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                      ->orWhere('phone', 'LIKE', "%{$search}%")
                      ->orWhere('email', 'LIKE', "%{$search}%");
                });
            })
            ->with('riderProfile') // Eager-load delivery profile for delivery users
            ->get()
            ->map(function ($u) {
                $data = [
                    'id'             => $u->id,
                    'name'           => $u->name,
                    'phone'          => $u->phone,
                    'email'          => $u->email,
                    'role'           => $u->role,
                    'is_active'      => $u->is_active,
                    'status'         => $u->is_active ? 'active' : 'suspended',
                    'phone_verified' => $u->phone_verified,
                    'avatar_url'     => $u->avatar_url,
                    'created_at'     => $u->created_at->toIso8601String(),
                    'last_active'    => 'Active recently',
                ];

                // Attach KYC details for delivery riders
                if ($u->role === 'delivery' && $u->riderProfile) {
                    $data['rider_profile'] = [
                        'id'                  => $u->riderProfile->id,
                        'vehicle_type'        => $u->riderProfile->vehicle_type,
                        'license_plate'       => $u->riderProfile->license_plate,
                        'verification_status' => $u->riderProfile->verification_status,
                        'kyc_submitted_at'    => $u->riderProfile->kyc_submitted_at?->toIso8601String(),
                        'is_available'        => $u->riderProfile->is_available,
                        'earnings_balance'    => $u->riderProfile->earnings_balance,
                    ];
                }

                return $data;
            });

        return response()->json([
            'success' => true,
            'message' => 'Users retrieved.',
            'data'    => $users
        ]);
    }

    /**
     * Toggle a user's active status (suspend / reactivate).
     */
    public function toggleStatus(Request $request, User $user): JsonResponse
    {
        // Prevent admins from suspending themselves
        if ($user->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot suspend your own account.'
            ], 422);
        }

        $user->update(['is_active' => !$user->is_active]);

        $action = $user->is_active ? 'reactivated' : 'suspended';

        return response()->json([
            'success' => true,
            'message' => "User account {$action} successfully.",
            'data'    => ['is_active' => $user->is_active, 'status' => $user->is_active ? 'active' : 'suspended']
        ]);
    }

    /**
     * List all delivery riders with their KYC profiles (for admin review panel).
     */
    public function deliveryRiders(Request $request): JsonResponse
    {
        $statusFilter = $request->query('status'); // not_submitted | pending | verified | rejected
        $search       = $request->query('search');

        $query = DeliveryProfile::with('user')
            ->when($statusFilter && $statusFilter !== 'all', function ($q) use ($statusFilter) {
                $q->where('verification_status', $statusFilter);
            })
            ->when($search, function ($q) use ($search) {
                $q->whereHas('user', function ($u) use ($search) {
                    $u->where('name', 'LIKE', "%{$search}%")
                      ->orWhere('phone', 'LIKE', "%{$search}%");
                });
            })
            ->latest();

        $riders = $query->get()->map(function ($profile) {
            return [
                'id'                  => $profile->id,
                'user_id'             => $profile->user_id,
                'name'                => $profile->user?->name,
                'phone'               => $profile->user?->phone,
                'email'               => $profile->user?->email,
                'avatar_url'          => $profile->user?->avatar_url,
                'is_active'           => $profile->user?->is_active,
                'vehicle_type'        => $profile->vehicle_type,
                'license_plate'       => $profile->license_plate,
                'license_number'      => $profile->license_number,
                'verification_status' => $profile->verification_status,
                'kyc_submitted_at'    => $profile->kyc_submitted_at?->toIso8601String(),
                'id_document_url'     => $profile->id_document_url,
                'license_image_url'   => $profile->license_image_url,
                'is_available'        => $profile->is_available,
                'earnings_balance'    => $profile->earnings_balance,
                'created_at'          => $profile->created_at->toIso8601String(),
            ];
        });

        // Summary counts
        $counts = [
            'total'         => DeliveryProfile::count(),
            'not_submitted' => DeliveryProfile::where('verification_status', 'not_submitted')->count(),
            'pending'       => DeliveryProfile::where('verification_status', 'pending')->count(),
            'verified'      => DeliveryProfile::where('verification_status', 'verified')->count(),
            'rejected'      => DeliveryProfile::where('verification_status', 'rejected')->count(),
        ];

        return response()->json([
            'success' => true,
            'message' => 'Delivery riders retrieved.',
            'data'    => $riders,
            'counts'  => $counts,
        ]);
    }

    /**
     * Approve a rider's KYC documents — sets status to 'verified'.
     */
    public function verifyRider(Request $request, DeliveryProfile $profile): JsonResponse
    {
        if ($profile->verification_status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Only riders with pending KYC submissions can be verified.'
            ], 422);
        }

        $profile->update(['verification_status' => 'verified']);

        // Notify the rider
        if ($profile->user) {
            $notificationService = app(NotificationService::class);
            $notificationService->send(
                $profile->user,
                'KYC Verified ✓',
                'Congratulations! Your identity and vehicle documents have been verified. You can now accept all deliveries and receive payments.',
                'kyc',
                ['verification_status' => 'verified']
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Rider KYC approved. They can now receive payments.',
            'data'    => $profile->fresh()->toArray(),
        ]);
    }

    /**
     * Reject a rider's KYC documents — sets status to 'rejected'.
     */
    public function rejectRider(Request $request, DeliveryProfile $profile): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        if (!in_array($profile->verification_status, ['pending', 'verified'])) {
            return response()->json([
                'success' => false,
                'message' => 'Only pending or verified riders can be rejected.'
            ], 422);
        }

        $profile->update(['verification_status' => 'rejected']);

        // Notify the rider with the rejection reason
        if ($profile->user) {
            $notificationService = app(NotificationService::class);
            $notificationService->send(
                $profile->user,
                'KYC Review Update',
                "Your KYC submission was not approved. Reason: {$request->reason}. Please re-submit with correct documents.",
                'kyc',
                ['verification_status' => 'rejected', 'reason' => $request->reason]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Rider KYC rejected. They have been notified.',
            'data'    => $profile->fresh()->toArray(),
        ]);
    }

    /**
     * Send an SMS to a specific user.
     */
    public function sendSms(Request $request, User $user, \App\Services\AfricasTalkingService $smsService): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:160',
        ]);

        if (!$user->phone) {
            return response()->json([
                'success' => false,
                'message' => 'User does not have a valid phone number.'
            ], 422);
        }

        $result = $smsService->sendSms($user->phone, $request->message);

        if ($result['status'] === 'success') {
            return response()->json([
                'success' => true,
                'message' => 'SMS sent successfully.'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => $result['message'] ?? 'Failed to send SMS.'
        ], 500);
    }
}

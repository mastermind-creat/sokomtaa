<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    /**
     * Display a listing of all system users.
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
            ->get()
            ->map(function ($u) {
                return [
                    'id'           => $u->id,
                    'name'         => $u->name,
                    'phone'        => $u->phone,
                    'email'        => $u->email,
                    'role'         => $u->role,
                    'is_active'    => $u->is_active,
                    'status'       => $u->is_active ? 'active' : 'suspended',
                    'phone_verified' => $u->phone_verified,
                    'avatar_url'   => $u->avatar_url,
                    'created_at'   => $u->created_at->toIso8601String(),
                    'last_active'  => 'Active recently',
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Users retrieved.',
            'data'    => $users
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

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
    public function index(): JsonResponse
    {
        $users = User::latest()
            ->get()
            ->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'phone' => $u->phone,
                    'role' => $u->role,
                    'status' => $u->is_active ? 'active' : 'suspended',
                    'created_at' => $u->created_at->toIso8601String(),
                    'last_active' => 'Active recently' // In production, use session tracking
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Users retrieved.',
            'data' => $users
        ]);
    }
}

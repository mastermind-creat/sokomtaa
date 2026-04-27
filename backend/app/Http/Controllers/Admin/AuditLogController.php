<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AuditLogController extends Controller
{
    /**
     * Return immutable system audit logs.
     */
    public function index(): JsonResponse
    {
        // Mock data for system transparency demo
        return response()->json([
            'success' => true,
            'message' => 'Audit logs retrieved.',
            'data' => [
                ['id' => 100, 'timestamp' => now()->subHours(2)->toIso8601String(), 'admin' => 'John Maina', 'action' => 'Trader Verified', 'resource' => 'Mama Wanjiru', 'before' => 'pending', 'after' => 'verified', 'ip' => '192.168.1.45'],
                ['id' => 99, 'timestamp' => now()->subHours(4)->toIso8601String(), 'admin' => 'Sarah Kamau', 'action' => 'Stall Allocated', 'resource' => 'Stall B4 → Tech Safi', 'before' => 'vacant', 'after' => 'occupied', 'ip' => '192.168.1.12'],
                ['id' => 98, 'timestamp' => now()->subDay()->toIso8601String(), 'admin' => 'John Maina', 'action' => 'Fee Waived', 'resource' => 'Ochieng Fish (Dec 2024)', 'before' => 'unpaid', 'after' => 'waived', 'ip' => '192.168.1.45'],
                ['id' => 97, 'timestamp' => now()->subDays(2)->toIso8601String(), 'admin' => 'System', 'action' => 'Notice Expired', 'resource' => 'Market Maintenance Notice', 'before' => 'active', 'after' => 'expired', 'ip' => '127.0.0.1'],
            ]
        ]);
    }
}

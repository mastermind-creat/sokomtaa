<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Trader;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TraderController extends Controller
{
    /**
     * Display a listing of physical market traders.
     * Optionally filter by verification_status.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $statusFilter = $request->query('verification_status');

        $traders = Trader::with(['user', 'stall', 'market'])
            ->when($statusFilter, function ($query, $status) {
                return $query->where('verification_status', $status);
            })
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Traders retrieved successfully.',
            'data' => $traders
        ], 200);
    }
}

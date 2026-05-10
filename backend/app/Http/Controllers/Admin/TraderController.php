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
     * Optionally filter by unallocated (traders without a stall).
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $statusFilter = $request->query('verification_status');
        $unallocatedFilter = $request->query('unallocated');
        $marketFilter = $request->query('market_id');
        $search = $request->query('search');

        $traders = Trader::with(['user', 'stall', 'market'])
            ->when($statusFilter, function ($query, $status) {
                return $query->where('verification_status', $status);
            })
            ->when($unallocatedFilter, function ($query) {
                return $query->whereNull('stall_id');
            })
            ->when($marketFilter, function ($query, $marketId) {
                return $query->where('market_id', $marketId);
            })
            ->when($search, function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('business_name', 'LIKE', "%{$search}%")
                      ->orWhereHas('user', function ($uq) use ($search) {
                          $uq->where('name', 'LIKE', "%{$search}%")
                             ->orWhere('phone', 'LIKE', "%{$search}%");
                      });
                });
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

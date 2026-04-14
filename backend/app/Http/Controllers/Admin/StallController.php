<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Stall;
use App\Models\Market;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StallController extends Controller
{
    /**
     * Get all stalls for a specific market, with trader details.
     */
    public function index(Request $request): JsonResponse
    {
        $marketId = $request->query('market_id', Market::first()->id ?? null);
        
        if (!$marketId) {
            return response()->json(['success' => false, 'message' => 'No markets found'], 404);
        }

        $stalls = Stall::with(['currentTrader'])
            ->where('market_id', $marketId)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $stalls
        ]);
    }

    /**
     * Get occupancy summary.
     */
    public function summary(): JsonResponse
    {
        $total = Stall::count();
        $occupied = Stall::where('status', 'occupied')->count();
        $available = Stall::where('status', 'available')->count();
        $maintenance = Stall::where('status', 'maintenance')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $total,
                'occupied' => $occupied,
                'available' => $available,
                'maintenance' => $maintenance,
                'occupancy_rate' => $total > 0 ? round(($occupied / $total) * 100, 1) : 0
            ]
        ]);
    }
}

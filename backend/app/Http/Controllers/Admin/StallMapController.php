<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Stall;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StallMapController extends Controller
{
    /**
     * Get stall map data for schematic rendering.
     */
    public function getMapData(Request $request): JsonResponse
    {
        $block = $request->query('block', 'A');
        $marketId = $request->query('market_id');

        $query = Stall::with(['trader', 'trader.user'])
            ->where('block', $block);

        if ($marketId) {
            $query->where('market_id', $marketId);
        }

        $stalls = $query->get();

        return response()->json([
            'success' => true,
            'message' => "Map data for Block $block retrieved.",
            'data' => $stalls
        ]);
    }
}

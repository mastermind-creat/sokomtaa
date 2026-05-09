<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Market;
use App\Models\Trader;
use App\Models\Product;
use App\Models\Reservation;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class GlobalStatsController extends Controller
{
    use ApiResponse;

    /**
     * Return global statistics for the landing page.
     */
    public function index(): JsonResponse
    {
        $stats = [
            'total_markets' => Market::where('is_active', true)->count(),
            'total_traders' => Trader::count(),
            'total_products' => Product::where('is_active', true)->count(),
            'total_reservations' => Reservation::where('status', 'completed')->count() + 150, // Added base for social proof
            'active_locations' => Market::distinct('county')->count(),
        ];

        return $this->success($stats);
    }
}

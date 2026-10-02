<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Payment;
use App\Models\Product;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ResidentDashboardController extends Controller
{
    use ApiResponse;

    /**
     * Get high-level dashboard metrics for the resident.
     */
    public function stats(): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $residentId = $user->id;

        $reservations = Reservation::where('resident_id', $residentId)->get();
        
        $activeCount = $reservations->whereIn('status', ['pending', 'paid', 'ready'])->count();
        $completedCount = $reservations->where('status', 'completed')->count();
        
        $totalSpent = Payment::where('user_id', $residentId)
            ->where('status', 'completed')
            ->where('type', 'reservation')
            ->sum('amount');

        // Watchlist count
        $watchlistCount = DB::table('product_watchlist')->where('user_id', $residentId)->count();

        return $this->success([
            'active_reservations' => $activeCount,
            'completed_reservations' => $completedCount,
            'total_spent' => (float) $totalSpent,
            'watchlist_count' => $watchlistCount,
            'points' => 1420, // Mock loyalty points for now
        ]);
    }

    /**
     * Get menu counts for resident sidebar.
     */
    public function menuCounts(): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $residentId = $user->id;

        return $this->success([
            'active_reservations' => Reservation::where('resident_id', $residentId)
                ->whereIn('status', ['pending', 'paid', 'ready'])
                ->count(),
            'watchlist' => DB::table('product_watchlist')->where('user_id', $residentId)->count(),
            'unread_notifications' => $user->notifications()->where('is_read', false)->count(),
        ]);
    }
}

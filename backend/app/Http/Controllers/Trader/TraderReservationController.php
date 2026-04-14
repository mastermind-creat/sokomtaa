<?php

namespace App\Http\Controllers\Trader;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TraderReservationController extends Controller
{
    use ApiResponse;

    /**
     * List reservations for the authenticated trader, optionally filtered by status.
     */
    public function index(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!$user->trader) {
            return $this->error('User is not a trader.', 'NOT_TRADER', 403);
        }

        $traderId = $user->trader->id;
        $query = Reservation::where('trader_id', $traderId)
            ->with(['resident:id,name,phone', 'product:id,name,unit,image_url'])
            ->latest();

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $reservations = $query->paginate(20);

        return $this->success($reservations);
    }

    /**
     * Quick stats for the trader's order dashboard.
     */
    public function stats(): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!$user->trader) {
            return $this->error('User is not a trader.', 'NOT_TRADER', 403);
        }

        $traderId = $user->trader->id;

        $stats = [
            'pending'              => Reservation::where('trader_id', $traderId)->where('status', 'pending')->count(),
            'paid'                 => Reservation::where('trader_id', $traderId)->where('status', 'paid')->count(),
            'ready'                => Reservation::where('trader_id', $traderId)->where('status', 'ready')->count(),
            'completed_this_week'  => Reservation::where('trader_id', $traderId)
                ->where('status', 'completed')
                ->whereBetween('picked_up_at', [now()->startOfWeek(), now()->endOfWeek()])
                ->count(),
        ];

        return $this->success($stats);
    }
}

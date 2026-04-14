<?php

namespace App\Http\Controllers\Trader;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class TraderReviewController extends Controller
{
    use ApiResponse;

    /**
     * List all reviews received by the authenticated trader.
     */
    public function index(): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!$user->trader) {
            return $this->error('User is not a trader.', 'NOT_TRADER', 403);
        }

        $reviews = Review::where('trader_id', $user->trader->id)
            ->where('is_visible', true)
            ->with([
                'resident:id,name,avatar_url',
                'reservation:id,reservation_code,product_id,quantity',
                'reservation.product:id,name,unit',
            ])
            ->latest()
            ->paginate(15);

        return $this->success($reviews);
    }

    /**
     * Rating summary: average, total, and star breakdown.
     */
    public function summary(): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!$user->trader) {
            return $this->error('User is not a trader.', 'NOT_TRADER', 403);
        }

        $traderId = $user->trader->id;

        $breakdown = [];
        for ($i = 1; $i <= 5; $i++) {
            $breakdown[(string) $i] = Review::where('trader_id', $traderId)
                ->where('is_visible', true)
                ->where('rating', $i)
                ->count();
        }

        $summary = [
            'average_rating' => $user->trader->average_rating,
            'total_reviews'  => $user->trader->total_reviews,
            'breakdown'      => $breakdown,
        ];

        return $this->success($summary);
    }
}

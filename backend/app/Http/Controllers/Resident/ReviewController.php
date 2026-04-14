<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Reservation;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    use ApiResponse;

    /** Reviews the resident has already left. */
    public function index(): JsonResponse
    {
        $reviews = Review::where('resident_id', Auth::id())
            ->with(['trader:id,business_name,avatar_url', 'reservation:id,reservation_code,product_id',
                    'reservation.product:id,name,unit'])
            ->latest()
            ->paginate(15);

        return $this->success($reviews);
    }

    /** Completed reservations that have not yet been reviewed. */
    public function pending(): JsonResponse
    {
        $reviewed = Review::where('resident_id', Auth::id())->pluck('reservation_id');

        $pending = Reservation::where('resident_id', Auth::id())
            ->where('status', 'completed')
            ->whereNotIn('id', $reviewed)
            ->with(['trader:id,business_name,avatar_url', 'product:id,name,unit'])
            ->latest()
            ->get();

        return $this->success($pending);
    }

    /** Submit a review for a completed reservation. */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'trader_id'      => 'required|exists:traders,id',
            'reservation_id' => 'required|exists:reservations,id',
            'rating'         => 'required|integer|min:1|max:5',
            'comment'        => 'nullable|string|max:1000',
        ]);

        $reservation = Reservation::findOrFail($request->reservation_id);

        if ($reservation->resident_id !== Auth::id()) {
            return $this->error('Unauthorized.', 'UNAUTHORIZED', 403);
        }
        if ($reservation->status !== 'completed') {
            return $this->error('You can only review completed orders.', 'NOT_COMPLETED', 422);
        }

        $existing = Review::where('resident_id', Auth::id())
            ->where('reservation_id', $request->reservation_id)
            ->first();
        if ($existing) {
            return $this->error('You have already reviewed this order.', 'DUPLICATE_REVIEW', 422);
        }

        $review = DB::transaction(function () use ($request) {
            $review = Review::create([
                'resident_id'    => Auth::id(),
                'trader_id'      => $request->trader_id,
                'reservation_id' => $request->reservation_id,
                'rating'         => $request->rating,
                'comment'        => $request->comment,
                'is_visible'     => true,
            ]);

            // Update trader average rating
            $trader = \App\Models\Trader::find($request->trader_id);
            $avg = Review::where('trader_id', $request->trader_id)->where('is_visible', true)->avg('rating');
            $count = Review::where('trader_id', $request->trader_id)->where('is_visible', true)->count();
            $trader->update(['average_rating' => round($avg, 2), 'total_reviews' => $count]);

            return $review;
        });

        return $this->success($review, 'Review submitted.', 201);
    }

    /** Edit a review (within 24 hours). */
    public function update(Request $request, Review $review): JsonResponse
    {
        if ($review->resident_id !== Auth::id()) {
            return $this->error('Unauthorized.', 'UNAUTHORIZED', 403);
        }
        if ($review->created_at->diffInHours(now()) > 24) {
            return $this->error('Reviews can only be edited within 24 hours.', 'EDIT_WINDOW_CLOSED', 422);
        }

        $request->validate([
            'rating'  => 'sometimes|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $review->update($request->only('rating', 'comment'));

        return $this->success($review, 'Review updated.');
    }
}

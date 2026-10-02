<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReviewController extends Controller
{
    /**
     * Display a listing of user reviews.
     */
    public function index(): JsonResponse
    {
        $reviews = Review::with(['resident', 'trader'])
            ->latest()
            ->get()
            ->map(function ($r) {
                return [
                    'id' => $r->id,
                    'resident' => $r->resident ? $r->resident->name : 'Unknown Resident',
                    'trader' => $r->trader ? $r->trader->business_name : 'Unknown Trader',
                    'rating' => $r->rating,
                    'comment' => $r->comment,
                    'is_visible' => $r->is_visible,
                    'created_at' => $r->created_at->toIso8601String(),
                    'verified' => true // Assumption for pilot, can be linked to Reservation status
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Reviews retrieved successfully.',
            'data' => $reviews
        ]);
    }

    /**
     * Get real-time reputation statistics.
     */
    public function stats(): JsonResponse
    {
        $totalReviews = Review::count();
        $avgRating = Review::avg('rating') ?? 0;
        $flagged = Review::where('is_visible', false)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'avg_rating' => round($avgRating, 1),
                'flagged' => $flagged,
                'total' => $totalReviews
            ]
        ]);
    }

    /**
     * Toggle the visibility of a review.
     */
    public function toggleVisibility($id): JsonResponse
    {
        $review = Review::findOrFail($id);
        $review->is_visible = !$review->is_visible;
        $review->save();

        $action = $review->is_visible ? 'restored' : 'hidden';

        return response()->json([
            'success' => true,
            'message' => "Review {$action} successfully."
        ]);
    }

    /**
     * Delete a review.
     */
    public function destroy($id): JsonResponse
    {
        $review = Review::findOrFail($id);
        $review->delete();

        return response()->json([
            'success' => true,
            'message' => 'Review deleted successfully.'
        ]);
    }
}

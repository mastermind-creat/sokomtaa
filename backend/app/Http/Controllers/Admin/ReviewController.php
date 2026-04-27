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
                    'resident' => $r->resident->name,
                    'trader' => $r->trader->business_name,
                    'rating' => $r->rating,
                    'comment' => $r->comment,
                    'is_visible' => $r->is_visible,
                    'created_at' => $r->created_at->toIso8601String()
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Reviews retrieved successfully.',
            'data' => $reviews
        ]);
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReservationController extends Controller
{
    /**
     * Display a listing of all reservations.
     */
    public function index(): JsonResponse
    {
        $reservations = Reservation::with(['resident', 'trader', 'product'])
            ->latest()
            ->get()
            ->map(function ($r) {
                return [
                    'id' => $r->id,
                    'reservation_code' => $r->reservation_code,
                    'resident' => $r->resident->name,
                    'trader' => $r->trader->business_name,
                    'product' => $r->product->name,
                    'quantity' => $r->quantity,
                    'status' => $r->status,
                    'amount' => $r->total_amount,
                    'pickup_deadline' => $r->pickup_deadline ? $r->pickup_deadline->toIso8601String() : null,
                    'created_at' => $r->created_at->toIso8601String()
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Reservations retrieved successfully.',
            'data' => $reservations
        ]);
    }
}

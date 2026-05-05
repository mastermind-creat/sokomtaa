<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Allocation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StallAllocationController extends Controller
{
    /**
     * Display a listing of stall allocations.
     */
    public function index(): JsonResponse
    {
        // Join with traders and stalls for front-end columns
        $allocations = Allocation::with(['trader', 'stall', 'allocator'])
            ->latest()
            ->get()
            ->map(function ($a) {
                return [
                    'id' => $a->id,
                    'stall' => $a->stall->stall_number,
                    'block' => $a->stall->block,
                    'trader' => $a->trader->business_name,
                    'start_date' => $a->start_date->format('Y-m-d'),
                    'end_date' => $a->end_date ? $a->end_date->format('Y-m-d') : null,
                    'status' => $a->status,
                    'allocated_by' => $a->allocator->name ?? 'System'
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Stall allocations retrieved successfully.',
            'data' => $allocations
        ]);
    }
    /**
     * Store a new stall allocation.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'stall_id' => 'required|exists:stalls,id',
            'trader_id' => 'required|exists:traders,id',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'notes' => 'nullable|string'
        ]);

        $stall = \App\Models\Stall::findOrFail($validated['stall_id']);
        if ($stall->status !== 'available') {
            return response()->json([
                'success' => false,
                'message' => 'Stall is not available for allocation.'
            ], 422);
        }

        $trader = \App\Models\Trader::findOrFail($validated['trader_id']);
        if ($trader->stall_id) {
            return response()->json([
                'success' => false,
                'message' => 'Trader already has a stall allocated.'
            ], 422);
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $stall, $trader, $request) {
            Allocation::create([
                'stall_id' => $validated['stall_id'],
                'trader_id' => $validated['trader_id'],
                'allocated_by' => $request->user()->id,
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'] ?? null,
                'status' => 'active',
                'notes' => $validated['notes'] ?? null
            ]);

            $stall->update(['status' => 'occupied']);
            $trader->update(['stall_id' => $validated['stall_id']]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Stall allocated successfully.'
        ], 201);
    }
}

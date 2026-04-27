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
        $allocations = Allocation::with(['trader', 'stall', 'allocatedBy'])
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
                    'allocated_by' => $a->allocatedBy->name ?? 'System'
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Stall allocations retrieved successfully.',
            'data' => $allocations
        ]);
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Stall;
use App\Models\Market;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StallController extends Controller
{
    use ApiResponse;

    /**
     * Get all stalls for a specific market, with trader details.
     */
    public function index(Request $request): JsonResponse
    {
        $marketId = $request->query('market_id');
        
        if (!$marketId) {
            $marketId = Market::first()->id ?? null;
        }

        if (!$marketId) {
            return $this->error('No markets found.', 'NOT_FOUND', 404);
        }

        $stalls = Stall::with(['currentTrader'])
            ->where('market_id', $marketId)
            ->get();

        return $this->success($stalls);
    }

    /**
     * Store a single stall.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'market_id'    => 'required|exists:markets,id',
            'stall_number' => 'required|string',
            'zone'         => 'required|in:A,B,C',
            'block'        => 'required|string',
            'size_sqm'     => 'nullable|numeric',
            'monthly_fee'  => 'required|numeric',
            'status'       => 'required|in:available,occupied,maintenance',
        ]);

        $stall = Stall::create($validated);

        return $this->success($stall, 'Stall created successfully.', 201);
    }

    /**
     * Update a stall.
     */
    public function update(Request $request, Stall $stall): JsonResponse
    {
        $validated = $request->validate([
            'stall_number' => 'sometimes|string',
            'zone'         => 'sometimes|in:A,B,C',
            'block'        => 'sometimes|string',
            'size_sqm'     => 'nullable|numeric',
            'monthly_fee'  => 'sometimes|numeric',
            'status'       => 'sometimes|in:available,occupied,maintenance',
            'map_x'        => 'nullable|numeric',
            'map_y'        => 'nullable|numeric',
            'notes'        => 'nullable|string',
        ]);

        $stall->update($validated);

        return $this->success($stall, 'Stall updated successfully.');
    }

    /**
     * Remove a stall.
     */
    public function destroy(Stall $stall): JsonResponse
    {
        if ($stall->status === 'occupied') {
            return $this->error('Cannot delete an occupied stall. Revoke allocation first.', 'OCCUPIED', 422);
        }

        $stall->delete();

        return $this->success(null, 'Stall deleted successfully.');
    }

    /**
     * Bulk generate stalls (Useful for the Centre Region - Zone B).
     */
    public function bulkGenerate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'market_id'    => 'required|exists:markets,id',
            'zone'         => 'required|in:A,B,C',
            'block'        => 'required|string',
            'prefix'       => 'required|string|max:5', // e.g. "B"
            'start_number' => 'required|integer|min:1',
            'count'        => 'required|integer|min:1|max:100',
            'monthly_fee'  => 'required|numeric',
        ]);

        $createdCount = 0;
        $stalls = [];

        DB::beginTransaction();
        try {
            for ($i = 0; $i < $validated['count']; $i++) {
                $num = $validated['start_number'] + $i;
                $stallNumber = $validated['prefix'] . $num;

                // Check for duplicates
                $exists = Stall::where('market_id', $validated['market_id'])
                    ->where('stall_number', $stallNumber)
                    ->where('block', $validated['block'])
                    ->exists();

                if ($exists) continue;

                $stalls[] = Stall::create([
                    'market_id'    => $validated['market_id'],
                    'zone'         => $validated['zone'],
                    'block'        => $validated['block'],
                    'stall_number' => $stallNumber,
                    'monthly_fee'  => $validated['monthly_fee'],
                    'status'       => 'available',
                ]);
                $createdCount++;
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Bulk generation failed: ' . $e->getMessage());
        }

        return $this->success($stalls, "Successfully generated {$createdCount} stalls.");
    }

    /**
     * Get occupancy summary.
     */
    public function summary(): JsonResponse
    {
        $total = Stall::count();
        $occupied = Stall::where('status', 'occupied')->count();
        $available = Stall::where('status', 'available')->count();
        $maintenance = Stall::where('status', 'maintenance')->count();

        return $this->success([
            'total' => $total,
            'occupied' => $occupied,
            'available' => $available,
            'maintenance' => $maintenance,
            'occupancy_rate' => $total > 0 ? round(($occupied / $total) * 100, 1) : 0
        ]);
    }
}

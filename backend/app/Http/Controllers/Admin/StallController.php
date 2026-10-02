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
        $status = $request->query('status');
        
        if (!$marketId) {
            $marketId = Market::first()->id ?? null;
        }

        if (!$marketId) {
            return $this->error('No markets found.', 'NOT_FOUND', 404);
        }

        $query = Stall::with(['currentTrader'])->where('market_id', $marketId);

        if ($status) {
            $query->where('status', $status);
        }

        $stalls = $query->get();

        return $this->success($stalls);
    }

    /**
     * Store a single stall.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'market_id'    => 'required|exists:markets,id',
            'stall_number' => [
                'required', 
                'string',
                function ($attribute, $value, $fail) use ($request) {
                    $exists = Stall::where('market_id', $request->market_id)
                        ->where('block', $request->block)
                        ->where('stall_number', $value)
                        ->exists();
                    if ($exists) {
                        $fail('The stall number already exists in this block.');
                    }
                }
            ],
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
            'stall_number' => [
                'sometimes',
                'string',
                function ($attribute, $value, $fail) use ($request, $stall) {
                    $marketId = $request->market_id ?? $stall->market_id;
                    $block = $request->block ?? $stall->block;
                    $exists = Stall::where('market_id', $marketId)
                        ->where('block', $block)
                        ->where('stall_number', $value)
                        ->where('id', '!=', $stall->id)
                        ->exists();
                    if ($exists) {
                        $fail('The stall number already exists in this block.');
                    }
                }
            ],
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
     * Bulk remove stalls.
     */
    public function bulkDestroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:stalls,id'
        ]);

        $stalls = Stall::whereIn('id', $validated['ids'])->get();
        $deletedCount = 0;
        $failedCount = 0;

        foreach ($stalls as $stall) {
            if ($stall->status === 'occupied') {
                $failedCount++;
                continue;
            }
            $stall->delete();
            $deletedCount++;
        }

        if ($failedCount > 0) {
            return $this->success(null, "Deleted {$deletedCount} stalls. {$failedCount} stalls were occupied and skipped.");
        }

        return $this->success(null, "Successfully deleted {$deletedCount} stalls.");
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

    /**
     * Get the next sequential stall number for a block.
     */
    public function getNextNumber(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'market_id' => 'required|exists:markets,id',
                'block' => 'required|string',
                'zone' => 'nullable|string'
            ]);

            $lastStall = Stall::where('market_id', $request->market_id)
                ->where('block', $request->block)
                ->orderByRaw('LENGTH(stall_number) DESC')
                ->orderBy('stall_number', 'DESC')
                ->first();

            if (!$lastStall) {
                // Default based on zone if provided, else just "1"
                $prefix = $request->zone ?: ($request->block ?: 'A');
                $separator = is_numeric(substr($prefix, -1)) ? '-' : '';
                return $this->success(['next_number' => $prefix . $separator . '1']);
            }

            // Try to increment the numeric part
            $currentNumber = $lastStall->stall_number;
            
            // Find trailing digits
            if (preg_match('/^(.*?)(\d+)$/', $currentNumber, $matches)) {
                $prefix = $matches[1];
                $number = (int)$matches[2] + 1;
                return $this->success(['next_number' => $prefix . $number]);
            }

            // Fallback: append "1"
            return $this->success(['next_number' => $currentNumber . '1']);
        } catch (\Exception $e) {
            return $this->error('Failed to generate number: ' . $e->getMessage(), 'GEN_ERROR', 500);
        }
    }
    /**
     * Bulk update all stalls in a market to use the market's default fee.
     */
    public function bulkUpdateFees(Request $request): JsonResponse
    {
        if ($request->has('all') && $request->all) {
            $markets = Market::all();
            $totalUpdated = 0;
            foreach ($markets as $market) {
                $totalUpdated += Stall::where('market_id', $market->id)
                    ->update(['monthly_fee' => $market->default_monthly_fee ?? 1500.00]);
            }
            return $this->success(null, "Global update complete. Adjusted fees for {$totalUpdated} stalls across all markets.");
        }

        $validated = $request->validate([
            'market_id' => 'required|exists:markets,id',
        ]);

        $market = Market::find($validated['market_id']);
        $defaultFee = $market->default_monthly_fee;

        $updatedCount = Stall::where('market_id', $market->id)
            ->update(['monthly_fee' => $defaultFee]);

        return $this->success(null, "Successfully updated fees for {$updatedCount} stalls to KES {$defaultFee}.");
    }
}

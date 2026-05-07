<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Market;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MarketController extends Controller
{
    use ApiResponse;

    /**
     * List all markets.
     */
    public function index(): JsonResponse
    {
        $markets = Market::withCount(['traders', 'stalls'])->get();
        return $this->success($markets);
    }

    /**
     * Create a new market.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'county' => 'required|string|max:255',
            'estate' => 'required|string|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return $this->error('Validation Error', 'VALIDATION_ERROR', 422, $validator->errors()->toArray());
        }

        $market = Market::create($request->all());

        return $this->success($market, 'Market created successfully', 201);
    }

    /**
     * Update an existing market.
     */
    public function update(Request $request, Market $market): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'location' => 'sometimes|required|string|max:255',
            'county' => 'sometimes|required|string|max:255',
            'estate' => 'sometimes|required|string|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return $this->error('Validation Error', 'VALIDATION_ERROR', 422, $validator->errors()->toArray());
        }

        $market->update($request->all());

        return $this->success($market, 'Market updated successfully');
    }

    /**
     * Delete a market.
     */
    public function destroy(Market $market): JsonResponse
    {
        // Check if market has traders or stalls before deleting
        if ($market->traders()->count() > 0 || $market->stalls()->count() > 0) {
            return $this->error('Cannot delete market with active traders or stalls. Deactivate it instead.', 422);
        }

        $market->delete();

        return $this->success(null, 'Market deleted successfully');
    }

    /**
     * Toggle market active status.
     */
    public function toggleStatus(Market $market): JsonResponse
    {
        $market->is_active = !$market->is_active;
        $market->save();

        return $this->success($market, 'Market status updated');
    }
}

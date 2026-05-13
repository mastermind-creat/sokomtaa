<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Market;
use App\Services\CloudinaryService;
use App\Services\StallService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class MarketController extends Controller
{
    use ApiResponse;

    protected $cloudinaryService;
    protected $stallService;

    public function __construct(CloudinaryService $cloudinaryService, StallService $stallService)
    {
        $this->cloudinaryService = $cloudinaryService;
        $this->stallService = $stallService;
    }

    /**
     * List all markets.
     */
    public function index(): JsonResponse
    {
        $markets = Market::withCount(['traders', 'stalls', 'occupiedStalls'])->get();
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
            'is_active' => 'nullable', // Handled below
            'default_monthly_fee' => 'nullable|numeric|min:0',
            'center_id' => 'required|exists:centers,id',
            'banner_image' => 'nullable|image|max:5120',
            'icon_image' => 'nullable|image|max:2048'
        ]);

        if ($validator->fails()) {
            return $this->error('Validation Error', 'VALIDATION_ERROR', 422, $validator->errors()->toArray());
        }

        $data = $request->except(['banner_image', 'icon_image']);
        
        // Handle boolean fields from FormData
        $data['is_active'] = filter_var($request->input('is_active', true), FILTER_VALIDATE_BOOLEAN);

        if ($request->hasFile('banner_image')) {
            $data['banner_url'] = $this->cloudinaryService->uploadImage($request->file('banner_image'), 'markets/banners');
        }

        if ($request->hasFile('icon_image')) {
            $data['icon_url'] = $this->cloudinaryService->uploadImage($request->file('icon_image'), 'markets/icons');
        }

        $market = Market::create($data);

        // Auto-generate standard stall infrastructure
        $this->stallService->generateStandardInfrastructure($market);

        return $this->success($market, 'Market created successfully with standard stall layout', 201);
    }

    /**
     * Update an existing market.
     */
    public function update(Request $request, Market $market): JsonResponse
    {
        Log::info('Market Update Request:', $request->all());

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'location' => 'sometimes|required|string|max:255',
            'county' => 'sometimes|required|string|max:255',
            'estate' => 'sometimes|required|string|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'is_active' => 'nullable',
            'default_monthly_fee' => 'nullable|numeric|min:0',
            'center_id' => 'sometimes|required|exists:centers,id',
            'banner_image' => 'nullable|image|max:5120',
            'icon_image' => 'nullable|image|max:2048'
        ]);

        if ($validator->fails()) {
            return $this->error('Validation Error', 'VALIDATION_ERROR', 422, $validator->errors()->toArray());
        }

        $data = $request->except(['banner_image', 'icon_image']);
        
        // Handle boolean fields from FormData
        if ($request->has('is_active')) {
            $data['is_active'] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN);
        }

        if ($request->hasFile('banner_image')) {
            $url = $this->cloudinaryService->uploadImage($request->file('banner_image'), 'markets/banners');
            if ($url) {
                // Delete old banner if it exists and is a Cloudinary URL
                if ($market->banner_url) {
                    $this->cloudinaryService->deleteImage($market->banner_url);
                }
                $data['banner_url'] = $url;
            }
        }

        if ($request->hasFile('icon_image')) {
            $url = $this->cloudinaryService->uploadImage($request->file('icon_image'), 'markets/icons');
            if ($url) {
                // Delete old icon if it exists
                if ($market->icon_url) {
                    $this->cloudinaryService->deleteImage($market->icon_url);
                }
                $data['icon_url'] = $url;
            }
        }

        $market->update($data);

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

    /**
     * Reset market stalls to standard template.
     */
    public function resetStalls(Market $market): JsonResponse
    {
        // Delete all existing allocations for stalls in this market
        \App\Models\Allocation::whereIn('stall_id', $market->stalls()->pluck('id'))->delete();

        // Delete all existing stalls
        $market->stalls()->delete();

        // Regenerate standard layout
        $this->stallService->generateStandardInfrastructure($market);

        return $this->success($market, 'Market infrastructure reset to standard template');
    }
}

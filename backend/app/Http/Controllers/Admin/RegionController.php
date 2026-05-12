<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Region;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RegionController extends Controller
{
    public function index(): JsonResponse
    {
        $regions = Region::withCount('centers')->get();
        return response()->json([
            'success' => true,
            'data' => $regions
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:regions',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $region = Region::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Region created successfully',
            'data' => $region
        ], 21);
    }

    public function update(Request $request, Region $region): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:regions,name,' . $region->id,
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $region->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Region updated successfully',
            'data' => $region
        ]);
    }

    public function destroy(Region $region): JsonResponse
    {
        // Check if region has centers
        if ($region->centers()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete region with existing centers.'
            ], 40);
        }

        $region->delete();

        return response()->json([
            'success' => true,
            'message' => 'Region deleted successfully'
        ]);
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\County;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CountyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = County::with('region')->withCount('centers');

        if ($request->has('region_id')) {
            $query->where('region_id', $request->region_id);
        }

        $counties = $query->get();

        return response()->json([
            'success' => true,
            'data' => $counties
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'region_id' => 'required|exists:regions,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $county = County::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'County created successfully',
            'data' => $county->load('region')
        ], 201);
    }

    public function update(Request $request, County $county): JsonResponse
    {
        $validated = $request->validate([
            'region_id' => 'required|exists:regions,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $county->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'County updated successfully',
            'data' => $county->load('region')
        ]);
    }

    public function destroy(County $county): JsonResponse
    {
        // Check if county has centers
        if ($county->centers()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete county with existing centers.'
            ], 400);
        }

        $county->delete();

        return response()->json([
            'success' => true,
            'message' => 'County deleted successfully'
        ]);
    }
}

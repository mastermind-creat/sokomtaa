<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Center;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CenterController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Center::with(['county.region'])->withCount('markets');

        if ($request->has('county_id')) {
            $query->where('county_id', $request->county_id);
        }

        $centers = $query->get();

        return response()->json([
            'success' => true,
            'data' => $centers
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'county_id' => 'required|exists:counties,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $center = Center::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Center created successfully',
            'data' => $center->load('county.region')
        ], 201);
    }

    public function update(Request $request, Center $center): JsonResponse
    {
        $validated = $request->validate([
            'county_id' => 'required|exists:counties,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $center->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Center updated successfully',
            'data' => $center->load('county.region')
        ]);
    }

    public function destroy(Center $center): JsonResponse
    {
        // Check if center has markets
        if ($center->markets()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete center with existing markets.'
            ], 400);
        }

        $center->delete();

        return response()->json([
            'success' => true,
            'message' => 'Center deleted successfully'
        ]);
    }
}

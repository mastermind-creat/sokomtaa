<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Region;
use App\Models\Center;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    use ApiResponse;

    /**
     * List all active regions with their center counts.
     */
    public function regions(): JsonResponse
    {
        $regions = Region::where('is_active', true)
            ->withCount('centers')
            ->get();
            
        return $this->success($regions);
    }

    /**
     * List centers, optionally filtered by region.
     */
    public function centers(Request $request): JsonResponse
    {
        $query = Center::query();

        if ($request->has('region_id')) {
            $query->where('region_id', $request->region_id);
        }

        $centers = $query->with('region')->get();
        
        return $this->success($centers);
    }
}

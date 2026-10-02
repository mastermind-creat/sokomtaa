<?php

namespace App\Http\Controllers\Map;

use App\Http\Controllers\Controller;
use App\Services\GeoService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StallMapController extends Controller
{
    use ApiResponse;

    public function __construct(private GeoService $geoService) {}

    public function withinViewport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'min_lon' => 'required|numeric|between:-180,180',
            'min_lat' => 'required|numeric|between:-90,90',
            'max_lon' => 'required|numeric|between:-180,180',
            'max_lat' => 'required|numeric|between:-90,90',
        ]);

        if ((float) $validated['max_lon'] <= (float) $validated['min_lon']
            || (float) $validated['max_lat'] <= (float) $validated['min_lat']) {
            return $this->error(
                'Bounding box is inverted. max_lon/max_lat must be greater than min_lon/min_lat.',
                'VALIDATION_ERROR',
                422
            );
        }

        $stalls = $this->geoService->stallsWithinViewport(
            (float) $validated['min_lon'],
            (float) $validated['min_lat'],
            (float) $validated['max_lon'],
            (float) $validated['max_lat'],
        );

        return $this->success($stalls->values()->all(), 'Stalls within viewport retrieved successfully');
    }
}

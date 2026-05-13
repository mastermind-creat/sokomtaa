<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\SearchService;
use App\Traits\ApiResponse;

class SearchController extends Controller
{
    use ApiResponse;

    protected $searchService;

    public function __construct(SearchService $searchService)
    {
        $this->searchService = $searchService;
    }

    /**
     * Handle the global search request across the market.
     */
    public function index(Request $request)
    {
        $query = $request->input('q');
        $categoryId = $request->input('category');
        $lat = $request->filled('lat') ? (float) $request->lat : null;
        $lng = $request->filled('lng') ? (float) $request->lng : null;
        $radius = $request->filled('radius') ? (float) $request->radius : 5.0;

        if ((!$query || strlen($query) < 2) && !$categoryId) {
            return $this->success([
                'results' => [],
                'total' => 0,
                'breakdown' => [
                    'products' => 0,
                    'traders' => 0,
                    'markets' => 0
                ]
            ], 'Search query too short.');
        }

        $results = $this->searchService->globalSearch($query, $categoryId, $lat, $lng, $radius);

        return $this->success($results, 'Search completed successfully.');
    }

    /**
     * Retrieve trending marketplace segments for discovery.
     */
    public function recommendations(Request $request)
    {
        $lat = $request->filled('lat') ? (float) $request->lat : null;
        $lng = $request->filled('lng') ? (float) $request->lng : null;
        $radius = $request->filled('radius') ? (float) $request->radius : 5.0;

        $segments = $this->searchService->getDiscoverySegments($lat, $lng, $radius);

        return $this->success($segments, 'Recommendations retrieved successfully.');
    }
}


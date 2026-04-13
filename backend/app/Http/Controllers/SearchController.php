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

        if (!$query || strlen($query) < 2) {
            return $this->success([
                'results' => [],
                'total' => 0,
                'breakdown' => []
            ], 'Search query too short.');
        }

        $results = $this->searchService->globalSearch($query);

        return $this->success($results, 'Search completed successfully.');
    }

    /**
     * Retrieve trending marketplace segments for discovery.
     */
    public function recommendations()
    {
        $segments = $this->searchService->getDiscoverySegments();

        return $this->success($segments, 'Recommendations retrieved successfully.');
    }
}

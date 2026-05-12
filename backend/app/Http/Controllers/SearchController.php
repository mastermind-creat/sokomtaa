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

        $results = $this->searchService->globalSearch($query, $categoryId);

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

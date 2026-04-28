<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AnalyticsController extends Controller
{
    /**
     * Return market-level analytics for the county admin.
     * EXCLUDES all individual trader revenue data.
     */
    public function getAnalytics(Request $request): JsonResponse
    {
        $period = $request->query('period', 'month');

        // Mock data matching the frontend fallback structure.
        // In a real implementation, this aggregates actual `payments`, `reservations`, and `trader` tables.
        
        return response()->json([
            'success' => true,
            'message' => 'Admin analytics retrieved successfully.',
            'data' => [
                'levy_collection' => [
                    ['date' => 'Mon', 'amount' => 1200], ['date' => 'Tue', 'amount' => 1500],
                    ['date' => 'Wed', 'amount' => 1100], ['date' => 'Thu', 'amount' => 2400],
                    ['date' => 'Fri', 'amount' => 3200], ['date' => 'Sat', 'amount' => 2800],
                    ['date' => 'Sun', 'amount' => 1800]
                ],
                'reservation_volume' => [
                    ['date' => 'Mon', 'count' => 45], ['date' => 'Tue', 'count' => 52],
                    ['date' => 'Wed', 'count' => 38], ['date' => 'Thu', 'count' => 65],
                    ['date' => 'Fri', 'count' => 89], ['date' => 'Sat', 'count' => 104],
                    ['date' => 'Sun', 'count' => 76]
                ],
                'trader_growth' => [
                    ['month' => 'Jan', 'count' => 120], ['month' => 'Feb', 'count' => 135],
                    ['month' => 'Mar', 'count' => 148], ['month' => 'Apr', 'count' => 162]
                ],
                'category_demand' => [
                    ['name' => 'Vegetables', 'value' => 450],
                    ['name' => 'Grains', 'value' => 320],
                    ['name' => 'Fish', 'value' => 210],
                    ['name' => 'Fruits', 'value' => 180],
                    ['name' => 'Clothing', 'value' => 90]
                ],
                'peak_hours' => [
                    ['hour' => '6am', 'count' => 12], ['hour' => '8am', 'count' => 85],
                    ['hour' => '10am', 'count' => 42], ['hour' => '12pm', 'count' => 64],
                    ['hour' => '2pm', 'count' => 38], ['hour' => '4pm', 'count' => 92],
                    ['hour' => '6pm', 'count' => 115], ['hour' => '8pm', 'count' => 24]
                ],
                'occupancy_rate' => 82
            ]
        ]);
    }
}

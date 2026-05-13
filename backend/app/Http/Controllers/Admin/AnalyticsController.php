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
        $now = \Carbon\Carbon::now();
        
        switch ($period) {
            case 'today':
                $startDate = $now->copy()->startOfDay();
                $dateFormatter = '%H:00';
                break;
            case 'week':
                $startDate = $now->copy()->subDays(6)->startOfDay();
                $dateFormatter = '%a';
                break;
            case 'month':
            default:
                $startDate = $now->copy()->startOfMonth();
                $dateFormatter = '%d %b';
                break;
        }

        // 1. Levy Collection (Market Fees)
        $levyCollection = \App\Models\Payment::where('type', 'market_fee')
            ->where('status', 'completed')
            ->where('paid_at', '>=', $startDate)
            ->select(\Illuminate\Support\Facades\DB::raw("DATE_FORMAT(paid_at, '{$dateFormatter}') as date"), \Illuminate\Support\Facades\DB::raw("SUM(amount) as amount"))
            ->groupBy('date')
            ->orderBy(\Illuminate\Support\Facades\DB::raw("MIN(paid_at)"))
            ->get();

        // 2. Reservation Volume
        $reservationVolume = \App\Models\Reservation::where('created_at', '>=', $startDate)
            ->select(\Illuminate\Support\Facades\DB::raw("DATE_FORMAT(created_at, '{$dateFormatter}') as date"), \Illuminate\Support\Facades\DB::raw("COUNT(*) as count"))
            ->groupBy('date')
            ->orderBy(\Illuminate\Support\Facades\DB::raw("MIN(created_at)"))
            ->get();

        // 3. Category Demand
        $categoryDemand = \Illuminate\Support\Facades\DB::table('reservations')
            ->join('products', 'reservations.product_id', '=', 'products.id')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->where('reservations.created_at', '>=', $startDate)
            ->select('categories.name', \Illuminate\Support\Facades\DB::raw("COUNT(reservations.id) as value"))
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc('value')
            ->limit(5)
            ->get();

        // 4. Peak Hours (Traffic Intensity)
        $peakHours = \App\Models\Reservation::where('created_at', '>=', $startDate)
            ->select(\Illuminate\Support\Facades\DB::raw("HOUR(created_at) as hour_num"), \Illuminate\Support\Facades\DB::raw("COUNT(*) as count"))
            ->groupBy('hour_num')
            ->orderBy('hour_num')
            ->get()
            ->map(function ($item) {
                $hour = $item->hour_num;
                $amPm = $hour >= 12 ? 'pm' : 'am';
                $hour12 = $hour % 12;
                if ($hour12 == 0) $hour12 = 12;
                return [
                    'hour' => $hour12 . $amPm,
                    'count' => $item->count
                ];
            })->values();

        // 5. Occupancy Rate
        $totalStalls = \App\Models\Stall::count();
        $occupiedStalls = \App\Models\Stall::where('status', 'occupied')->count();
        $occupancyRate = $totalStalls > 0 ? round(($occupiedStalls / $totalStalls) * 100) : 0;

        // 6. Top Reserved Products (INTELLIGENCE)
        $topProducts = \App\Models\Product::join('reservations', 'products.id', '=', 'reservations.product_id')
            ->select('products.id', 'products.name', 'products.image_url', \Illuminate\Support\Facades\DB::raw("COUNT(reservations.id) as reservations_count"))
            ->groupBy('products.id', 'products.name', 'products.image_url')
            ->orderByDesc('reservations_count')
            ->limit(5)
            ->get();

        // 7. Planning Insights (LOGIC-BASED)
        $planningInsights = [];
        
        // Insight: Occupancy vs Demand
        if ($occupancyRate > 85) {
            $planningInsights[] = [
                'type' => 'infrastructure',
                'title' => 'Expansion Opportunity',
                'description' => "Market occupancy is at {$occupancyRate}%. Consider developing additional stalls or secondary market centers to accommodate growing trader demand.",
                'priority' => 'high'
            ];
        }

        // Insight: Peak Hours Operational Planning
        $topHour = $peakHours->sortByDesc('count')->first();
        if ($topHour) {
            $planningInsights[] = [
                'type' => 'operations',
                'title' => 'Peak Staffing Strategy',
                'description' => "Activity peaks at {$topHour['hour']}. Ensure maximum security presence and waste management operations are scheduled during this window.",
                'priority' => 'medium'
            ];
        }

        // Insight: Top Category Growth
        $topCategory = $categoryDemand->first();
        if ($topCategory) {
            $planningInsights[] = [
                'type' => 'category',
                'title' => 'Sector Specialization',
                'description' => "The '{$topCategory->name}' category dominates trade volume. Evaluate physical zoning to provide specialized amenities (e.g., cold storage) for this sector.",
                'priority' => 'medium'
            ];
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Admin analytics retrieved successfully.',
            'data' => [
                'levy_collection' => $levyCollection,
                'reservation_volume' => $reservationVolume,
                'category_demand' => $categoryDemand,
                'peak_hours' => $peakHours,
                'occupancy_rate' => $occupancyRate,
                'top_products' => $topProducts,
                'planning_insights' => $planningInsights
            ]
        ]);
    }
}

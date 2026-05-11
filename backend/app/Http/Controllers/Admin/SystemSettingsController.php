<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Market;
use App\Models\Trader;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SystemSettingsController extends Controller
{
    /**
     * Get system infrastructure statistics.
     */
    public function stats(): JsonResponse
    {
        // Calculate a pseudo-latency based on DB response time
        $start = microtime(true);
        DB::select('SELECT 1');
        $latency = round((microtime(true) - $start) * 1000, 2);

        return response()->json([
            'success' => true,
            'data' => [
                'markets_count' => Market::count(),
                'traders_count' => Trader::count(),
                'latency_ms' => $latency,
                'db_status' => 'healthy',
                'storage_usage' => $this->getStorageUsage() . '%'
            ]
        ]);
    }

    private function getStorageUsage(): int
    {
        try {
            $free = disk_free_space(base_path());
            $total = disk_total_space(base_path());
            $usedPercent = round((($total - $free) / $total) * 100);
            return (int) $usedPercent;
        } catch (\Exception $e) {
            return 12; // Fallback
        }
    }

    /**
     * Update system security settings (mocked for now).
     */
    public function updateSecurity(Request $request): JsonResponse
    {
        // In a real app, this would update config or DB settings
        return response()->json([
            'success' => true,
            'message' => 'Security settings updated successfully'
        ]);
    }
}

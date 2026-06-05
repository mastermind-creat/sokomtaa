<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SiteVisit;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TrafficTrackerController extends Controller
{
    /**
     * Track a page visit
     */
    public function track(Request $request)
    {
        $url = $request->input('url', '/');
        $path = $request->input('path', '/');
        $userAgent = $request->header('User-Agent');
        $ip = $request->ip();
        
        // Generate an anonymous session hash
        $sessionHash = hash('sha256', $ip . $userAgent . date('Y-m-d'));

        // Prevent spamming the same path from the same session within 1 minute
        $recentVisit = SiteVisit::where('session_hash', $sessionHash)
            ->where('path', $path)
            ->where('created_at', '>=', Carbon::now()->subMinute())
            ->first();

        if (!$recentVisit) {
            SiteVisit::create([
                'session_hash' => $sessionHash,
                'user_id' => $request->user('sanctum')?->id, // null if not logged in
                'url' => $url,
                'path' => $path,
                'user_agent' => $userAgent,
                'ip_address' => hash('sha256', $ip), // hash IP for privacy
            ]);
        }

        return response()->json(['status' => 'tracked']);
    }

    /**
     * Get traffic stats for the Admin Dashboard
     */
    public function stats()
    {
        $now = Carbon::now();

        // 1. Live Active Users (distinct sessions in last 5 mins)
        $activeUsers = SiteVisit::where('created_at', '>=', $now->copy()->subMinutes(5))
            ->distinct('session_hash')
            ->count('session_hash');

        // 2. Total Page Views Today
        $pageViewsToday = SiteVisit::whereDate('created_at', $now->toDateString())
            ->count();

        // 3. Unique Visitors Today
        $uniqueVisitorsToday = SiteVisit::whereDate('created_at', $now->toDateString())
            ->distinct('session_hash')
            ->count('session_hash');

        // 4. Top Viewed Pages Today
        $topPages = SiteVisit::whereDate('created_at', $now->toDateString())
            ->select('path', DB::raw('count(*) as views'))
            ->groupBy('path')
            ->orderByDesc('views')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'active_users' => $activeUsers,
                'page_views_today' => $pageViewsToday,
                'unique_visitors_today' => $uniqueVisitorsToday,
                'top_pages' => $topPages
            ]
        ]);
    }
}

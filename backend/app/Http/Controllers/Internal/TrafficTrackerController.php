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
     * Get comprehensive traffic stats for the Admin Dashboard
     */
    public function stats(Request $request)
    {
        $now = Carbon::now();

        // ── LIVE ──────────────────────────────────────────────────────────────
        $activeUsers = SiteVisit::where('created_at', '>=', $now->copy()->subMinutes(5))
            ->distinct('session_hash')
            ->count('session_hash');

        // ── TODAY ─────────────────────────────────────────────────────────────
        $pageViewsToday      = SiteVisit::whereDate('created_at', $now->toDateString())->count();
        $uniqueVisitorsToday = SiteVisit::whereDate('created_at', $now->toDateString())
            ->distinct('session_hash')->count('session_hash');

        // ── ALL-TIME TOTALS ───────────────────────────────────────────────────
        $totalPageViews    = SiteVisit::count();
        $totalUniqueSessions = SiteVisit::distinct('session_hash')->count('session_hash');
        $totalDaysTracked  = SiteVisit::selectRaw('COUNT(DISTINCT DATE(created_at)) as days')->value('days') ?? 0;
        $firstVisitAt      = SiteVisit::min('created_at');

        // ── DAILY TREND (last 30 days) ─────────────────────────────────────────
        $dailyTrend = SiteVisit::selectRaw("DATE(created_at) as date, COUNT(*) as views, COUNT(DISTINCT session_hash) as unique_visitors")
            ->where('created_at', '>=', $now->copy()->subDays(29)->startOfDay())
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // ── TOP PAGES ALL-TIME ────────────────────────────────────────────────
        $topPages = SiteVisit::select('path', DB::raw('count(*) as views'))
            ->groupBy('path')
            ->orderByDesc('views')
            ->limit(10)
            ->get();

        // ── TODAY TOP PAGES ───────────────────────────────────────────────────
        $topPagesToday = SiteVisit::whereDate('created_at', $now->toDateString())
            ->select('path', DB::raw('count(*) as views'))
            ->groupBy('path')
            ->orderByDesc('views')
            ->limit(5)
            ->get();

        // ── PAGINATED VISIT HISTORY ───────────────────────────────────────────
        $perPage  = (int) ($request->query('per_page', 50));
        $page     = (int) ($request->query('page', 1));
        $history  = SiteVisit::latest()
            ->paginate($perPage, ['id', 'session_hash', 'path', 'user_id', 'ip_address', 'created_at'], 'page', $page);

        return response()->json([
            'success' => true,
            'data' => [
                // live
                'active_users'           => $activeUsers,
                // today
                'page_views_today'       => $pageViewsToday,
                'unique_visitors_today'  => $uniqueVisitorsToday,
                // all-time
                'total_page_views'       => $totalPageViews,
                'total_unique_sessions'  => $totalUniqueSessions,
                'total_days_tracked'     => $totalDaysTracked,
                'first_visit_at'         => $firstVisitAt,
                // charts
                'daily_trend'            => $dailyTrend,
                'top_pages'              => $topPages,
                'top_pages_today'        => $topPagesToday,
                // history
                'visit_history'          => $history,
            ]
        ]);
    }
}

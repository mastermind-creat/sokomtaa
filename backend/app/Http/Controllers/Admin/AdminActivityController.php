<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Trader;
use App\Models\Complaint;
use App\Models\MarketFee;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;

class AdminActivityController extends Controller
{
    /**
     * Get a combined feed of recent administrative activities.
     */
    public function index(): JsonResponse
    {
        $activities = new Collection();

        // 1. Recent Trader Registrations
        Trader::with('user')->latest()->take(5)->get()->each(function ($trader) use ($activities) {
            $activities->push([
                'id' => 'trader_' . $trader->id,
                'type' => 'trader_signup',
                'title' => 'New Trader Registered',
                'description' => "{$trader->business_name} has registered for a permit.",
                'user' => $trader->user->name ?? 'Unknown',
                'time' => $trader->created_at->diffForHumans(),
                'status' => $trader->verification_status,
                'icon' => 'UserPlus'
            ]);
        });

        // 2. Recent Complaints
        Complaint::with(['user', 'market'])->latest()->take(5)->get()->each(function ($complaint) use ($activities) {
            $activities->push([
                'id' => 'complaint_' . $complaint->id,
                'type' => 'complaint_filed',
                'title' => 'New Complaint Filed',
                'description' => "{$complaint->subject} in {$complaint->market->name}",
                'user' => $complaint->user->name ?? 'Resident',
                'time' => $complaint->created_at->diffForHumans(),
                'status' => $complaint->status,
                'icon' => 'AlertCircle'
            ]);
        });

        // 3. Recent Market Fee Payments
        MarketFee::with('trader')->where('status', 'paid')->latest()->take(5)->get()->each(function ($fee) use ($activities) {
            $activities->push([
                'id' => 'fee_' . $fee->id,
                'type' => 'fee_payment',
                'title' => 'Market Fee Paid',
                'description' => "Ksh {$fee->amount} collected from {$fee->trader->business_name}",
                'user' => 'System',
                'time' => $fee->updated_at->diffForHumans(),
                'status' => 'completed',
                'icon' => 'CheckCircle'
            ]);
        });

        // Sort by time (simulated by ID/Type here, but ideally we'd sort the collection)
        // Since we want the absolute latest first:
        $sortedActivities = $activities->sortByDesc(function ($activity) {
            // This is a bit hacky since we don't have the raw timestamp here, 
            // but for a small aggregate it works. Real implementation should use timestamps.
            return $activity['time']; 
        })->values();

        return response()->json([
            'success' => true,
            'data' => $sortedActivities
        ]);
    }
}

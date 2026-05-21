<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Trader;
use App\Models\Complaint;
use App\Models\MarketFee;
use App\Models\DeliveryProfile;
use App\Models\Reservation;
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
        Trader::with('user')->whereNull('id_front_url')->latest()->take(5)->get()->each(function ($trader) use ($activities) {
            $activities->push([
                'id' => 'trader_reg_' . $trader->id,
                'type' => 'trader_signup',
                'title' => 'New Trader Registered',
                'description' => "{$trader->business_name} has registered for a permit.",
                'user' => $trader->user->name ?? 'Unknown',
                'time' => $trader->created_at->diffForHumans(),
                'raw_time' => $trader->created_at,
                'status' => $trader->verification_status,
                'icon' => 'UserPlus'
            ]);
        });

        // 2. Recent KYC Submissions (pending verification and has uploaded documents)
        Trader::with('user')
            ->where('verification_status', 'pending')
            ->whereNotNull('id_front_url')
            ->latest('updated_at')
            ->take(5)->get()->each(function ($trader) use ($activities) {
            $activities->push([
                'id' => 'trader_kyc_' . $trader->id,
                'type' => 'kyc_submitted',
                'title' => 'KYC Documents Submitted',
                'description' => "{$trader->business_name} has submitted identity documents for review.",
                'user' => $trader->user->name ?? 'Unknown',
                'time' => $trader->updated_at->diffForHumans(),
                'raw_time' => $trader->updated_at,
                'status' => 'pending_review',
                'icon' => 'User'
            ]);
        });

        // 3. Recent Complaints
        Complaint::with(['user', 'market'])->latest()->take(5)->get()->each(function ($complaint) use ($activities) {
            $activities->push([
                'id' => 'complaint_' . $complaint->id,
                'type' => 'complaint_filed',
                'title' => 'New Complaint Filed',
                'description' => "{$complaint->subject} in {$complaint->market->name}",
                'user' => $complaint->user->name ?? 'Resident',
                'time' => $complaint->created_at->diffForHumans(),
                'raw_time' => $complaint->created_at,
                'status' => $complaint->status,
                'icon' => 'AlertCircle'
            ]);
        });

        // 4. Recent Market Fee Payments
        MarketFee::with('trader')->where('status', 'paid')->latest()->take(5)->get()->each(function ($fee) use ($activities) {
            $activities->push([
                'id' => 'fee_' . $fee->id,
                'type' => 'fee_payment',
                'title' => 'Market Fee Paid',
                'description' => "Ksh {$fee->amount} collected from {$fee->trader->business_name}",
                'user' => 'System',
                'time' => $fee->updated_at->diffForHumans(),
                'raw_time' => $fee->updated_at,
                'status' => 'completed',
                'icon' => 'CheckCircle'
            ]);
        });

        // 5. Recent Delivery Rider Registrations
        DeliveryProfile::with('user')->whereNull('id_front_url')->latest()->take(5)->get()->each(function ($rider) use ($activities) {
            $activities->push([
                'id' => 'rider_reg_' . $rider->id,
                'type' => 'rider_signup',
                'title' => 'New Rider Registered',
                'description' => "A new delivery rider ({$rider->vehicle_type}) has registered.",
                'user' => $rider->user->name ?? 'Unknown',
                'time' => $rider->created_at->diffForHumans(),
                'raw_time' => $rider->created_at,
                'status' => $rider->verification_status,
                'icon' => 'UserPlus'
            ]);
        });

        // 6. Recent Delivery Rider KYC Submissions
        DeliveryProfile::with('user')
            ->where('verification_status', 'pending')
            ->whereNotNull('id_front_url')
            ->latest('updated_at')
            ->take(5)->get()->each(function ($rider) use ($activities) {
            $activities->push([
                'id' => 'rider_kyc_' . $rider->id,
                'type' => 'rider_kyc_submitted',
                'title' => 'Rider KYC Submitted',
                'description' => "A delivery rider has submitted KYC documents for review.",
                'user' => $rider->user->name ?? 'Unknown',
                'time' => $rider->updated_at->diffForHumans(),
                'raw_time' => $rider->updated_at,
                'status' => 'pending_review',
                'icon' => 'User'
            ]);
        });

        // 7. Recent Marketplace Orders (Reservations)
        Reservation::with(['resident', 'trader', 'product'])->latest()->take(5)->get()->each(function ($res) use ($activities) {
            $productName = $res->product->name ?? 'an item';
            $traderName = $res->trader->business_name ?? 'a trader';
            $activities->push([
                'id' => 'order_' . $res->id,
                'type' => 'new_order',
                'title' => 'New Marketplace Order',
                'description' => "Ordered {$res->quantity}x {$productName} from {$traderName}.",
                'user' => $res->resident->name ?? 'Resident',
                'time' => $res->created_at->diffForHumans(),
                'raw_time' => $res->created_at,
                'status' => $res->status,
                'icon' => 'CheckCircle'
            ]);
        });

        // Sort by actual time descending
        $sortedActivities = $activities->sortByDesc('raw_time')->values()->map(function ($activity) {
            unset($activity['raw_time']);
            return $activity;
        });

        return response()->json([
            'success' => true,
            'data' => $sortedActivities
        ]);
    }
}

<?php

namespace App\Http\Controllers\Trader;

use App\Http\Controllers\Controller;
use App\Models\StallApplication;
use App\Models\Stall;
use App\Traits\ApiResponse;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TraderStallApplicationController extends Controller
{
    use ApiResponse;

    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get the authenticated trader's current stall application.
     */
    public function show(): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!$user->trader) {
            return $this->error('User is not a trader.', 'NOT_TRADER', 403);
        }

        $application = StallApplication::where('trader_id', $user->trader->id)
            ->latest()
            ->first();

        if (!$application) {
            return $this->error('No application found.', 'NOT_FOUND', 404);
        }

        return $this->success($application);
    }

    /**
     * Submit a new stall application.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'stall_type'         => 'required|in:managed,independent',
            'preferred_zone'     => 'nullable|in:A,B,C',
            'preferred_stall_id' => 'nullable|exists:stalls,id',
            'motivation'         => 'required|string|min:50',
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!$user->trader) {
            return $this->error('User is not a trader.', 'NOT_TRADER', 403);
        }

        $traderId = $user->trader->id;

        // Block if a pending or approved application already exists
        $existing = StallApplication::where('trader_id', $traderId)
            ->whereIn('status', ['pending', 'approved', 'waitlisted'])
            ->first();

        if ($existing) {
            return $this->error('You already have an active stall application.', 'DUPLICATE_APPLICATION', 422);
        }

        $application = StallApplication::create([
            'trader_id'          => $traderId,
            'market_id'          => $user->trader->market_id,
            'stall_type'         => $request->stall_type,
            'preferred_stall_id' => $request->preferred_stall_id,
            'preferred_zone'     => $request->preferred_zone,
            'motivation'         => $request->motivation,
            'status'             => 'pending',
        ]);

        // Notify all admins
        $admins = User::where('role', 'admin')->where('is_active', true)->get();
        foreach ($admins as $admin) {
            $this->notificationService->send(
                $admin,
                'New Stall Application',
                "New Stall Application from {$user->trader->business_name} for {$user->trader->market->name}",
                'application',
                ['application_id' => $application->id],
                false
            );
        }

        return $this->success($application, 'Stall application submitted successfully.', 201);
    }

    /**
     * Withdraw a pending application.
     */
    public function destroy(): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!$user->trader) {
            return $this->error('User is not a trader.', 'NOT_TRADER', 403);
        }

        $application = StallApplication::where('trader_id', $user->trader->id)
            ->where('status', 'pending')
            ->first();

        if (!$application) {
            return $this->error('No pending application to withdraw.', 'NOT_FOUND', 404);
        }

        $application->delete();

        return $this->success(null, 'Application withdrawn.');
    }

    /**
     * List available stalls filtered by zone for the stall picker.
     */
    public function availableStalls(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!$user->trader) {
            return $this->error('User is not a trader.', 'NOT_TRADER', 403);
        }

        $query = Stall::where('market_id', $user->trader->market_id)
            ->where('status', 'available');

        if ($request->has('zone')) {
            $query->where('zone', $request->zone);
        }

        $stalls = $query->select('id', 'stall_number', 'zone', 'block', 'size_sqm', 'status')->get();

        return $this->success($stalls);
    }
}

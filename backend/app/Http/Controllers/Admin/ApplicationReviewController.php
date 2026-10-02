<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StallApplication;
use App\Models\Stall;
use App\Models\Allocation;
use App\Models\Trader;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Services\NotificationService;
use Carbon\Carbon;

class ApplicationReviewController extends Controller
{
    use ApiResponse;

    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * List all stall applications.
     */
    public function index(Request $request): JsonResponse
    {
        $query = StallApplication::with(['trader.user', 'market', 'preferredStall']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('market_id')) {
            $query->where('market_id', $request->market_id);
        }

        $applications = $query->latest()->paginate($request->query('per_page', 15));

        return $this->success($applications);
    }

    /**
     * Approve or reject an application.
     */
    public function action(Request $request, StallApplication $application): JsonResponse
    {
        $request->validate([
            'status'   => 'required|in:approved,rejected',
            'stall_id' => 'nullable|exists:stalls,id',
            'notes'    => 'nullable|string',
        ]);

        if ($application->status !== 'pending') {
            return $this->error('This application has already been processed.', 'ALREADY_PROCESSED', 422);
        }

        $stallId = $request->stall_id ?: $application->preferred_stall_id;

        // Validation for managed stalls
        if ($request->status === 'approved' && $application->stall_type === 'managed' && !$stallId) {
            return $this->error('A stall must be selected for managed stall approval.', 'STALL_REQUIRED', 422);
        }

        DB::beginTransaction();
        try {
            if ($request->status === 'approved') {
                $trader = Trader::findOrFail($application->trader_id);
                $stall = null;

                if ($application->stall_type === 'managed') {
                    $stall = Stall::findOrFail($stallId);

                    if ($stall->status === 'occupied') {
                        return $this->error('The selected stall is already occupied.', 'STALL_OCCUPIED', 422);
                    }

                    // 1. Create Allocation
                    Allocation::create([
                        'stall_id'     => $stall->id,
                        'trader_id'    => $application->trader_id,
                        'allocated_by' => Auth::id(),
                        'start_date'   => Carbon::now(),
                        'status'       => 'active',
                        'notes'        => $request->notes,
                    ]);

                    // 2. Update Stall Status
                    $stall->update(['status' => 'occupied']);
                }

                // 3. Update Trader Profile
                $trader->update([
                    'stall_id'   => $stall ? $stall->id : null,
                    'stall_type' => $application->stall_type,
                    'market_id'  => $application->market_id,
                    'latitude'   => $application->market?->latitude,
                    'longitude'  => $application->market?->longitude,
                ]);

                // 4. Update Application
                $application->update([
                    'status'      => 'approved',
                    'admin_notes' => $request->notes,
                    'reviewed_by' => Auth::id(),
                    'reviewed_at' => Carbon::now(),
                ]);

                // 5. Notify Trader via SMS and App
                $user = $trader->user;
                if ($user) {
                    $message = $application->stall_type === 'managed' 
                        ? "Congratulations! Your stall application at {$application->market->name} has been approved. You have been allocated Stall {$stall->stall_number}."
                        : "Congratulations! Your application to join {$application->market->name} as an independent trader has been approved.";

                    $this->notificationService->send(
                        $user,
                        'Application Approved',
                        $message . " Please log in to your dashboard for details.",
                        'application',
                        ['stall_id' => $stall ? $stall->id : null],
                        true
                    );
                }
            } else {
                // Rejected
                $application->update([
                    'status'      => 'rejected',
                    'admin_notes' => $request->notes,
                    'reviewed_by' => Auth::id(),
                    'reviewed_at' => Carbon::now(),
                ]);

                // Notify Trader via SMS and App
                $trader = Trader::findOrFail($application->trader_id);
                $user = $trader->user;
                if ($user) {
                    $this->notificationService->send(
                        $user,
                        'Application Status Update',
                        "Your stall application at {$application->market->name} has been rejected. Reason: " . ($request->notes ?: 'Does not meet requirements.'),
                        'application',
                        ['market_id' => $application->market_id],
                        true
                    );
                }
            }

            DB::commit();
            return $this->success($application, "Application " . $request->status . " successfully.");

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to process application: ' . $e->getMessage());
        }
    }

    /**
     * Get statistics for applications.
     */
    public function stats(): JsonResponse
    {
        return $this->success([
            'pending'   => StallApplication::where('status', 'pending')->count(),
            'approved'  => StallApplication::where('status', 'approved')->count(),
            'rejected'  => StallApplication::where('status', 'rejected')->count(),
            'velocity'  => StallApplication::where('created_at', '>=', Carbon::now()->subDays(7))->count(),
        ]);
    }
}

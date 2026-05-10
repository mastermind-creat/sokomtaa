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
            'stall_id' => 'required_if:status,approved|exists:stalls,id',
            'notes'    => 'nullable|string',
        ]);

        if ($application->status !== 'pending') {
            return $this->error('This application has already been processed.', 'ALREADY_PROCESSED', 422);
        }

        DB::beginTransaction();
        try {
            if ($request->status === 'approved') {
                $stall = Stall::findOrFail($request->stall_id);

                if ($stall->status === 'occupied') {
                    return $this->error('The selected stall is already occupied.', 'STALL_OCCUPIED', 422);
                }

                // 1. Create Allocation (Indefinite until revoked)
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

                // 3. Update Trader Profile
                $trader = Trader::findOrFail($application->trader_id);
                $trader->update(['stall_id' => $stall->id]);

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
                    $this->notificationService->send(
                        $user,
                        'Stall Allocated',
                        "Congratulations! Your stall application at {$application->market->name} has been approved. You have been allocated Stall {$stall->stall_number}. Please log in to your dashboard for details.",
                        'allocation',
                        ['stall_id' => $stall->id],
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

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Trader;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TraderController extends Controller
{
    /**
     * Display a listing of physical market traders.
     * Optionally filter by verification_status.
     * Optionally filter by unallocated (traders without a stall).
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $statusFilter = $request->query('verification_status');
        $unallocatedFilter = $request->query('unallocated');
        $marketFilter = $request->query('market_id');
        $search = $request->query('search');

        $traders = Trader::with(['user', 'stall', 'market'])
            ->when($statusFilter, function ($query, $status) {
                return $query->where('verification_status', $status);
            })
            ->when($unallocatedFilter, function ($query) {
                return $query->whereNull('stall_id');
            })
            ->when($marketFilter, function ($query, $marketId) {
                return $query->where('market_id', $marketId);
            })
            ->when($search, function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('business_name', 'LIKE', "%{$search}%")
                      ->orWhereHas('user', function ($uq) use ($search) {
                          $uq->where('name', 'LIKE', "%{$search}%")
                             ->orWhere('phone', 'LIKE', "%{$search}%");
                      });
                });
            })
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Traders retrieved successfully.',
            'data' => $traders
        ], 200);
    }

    /**
     * Verify or reject a trader's KYC.
     */
    public function verify(Request $request, Trader $trader, \App\Services\NotificationService $notificationService): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:verified,rejected',
            'reason' => 'required_if:status,rejected|string|nullable'
        ]);

        // Prevent verification if documents are missing
        if ($request->status === 'verified' && (!$trader->id_front_url || !$trader->id_back_url)) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot verify trader: KYC documents (ID Front/Back) are missing.',
                'error_code' => 'MISSING_DOCUMENTS'
            ], 422);
        }

        $trader->verification_status = $request->status;
        
        if ($request->status === 'rejected') {
            $trader->rejection_reason = $request->reason;
            
            // Notify trader of rejection (In-App + SMS)
            $message = "Your trader KYC verification was rejected. Reason: {$request->reason}. Please login to update your documents.";
            $notificationService->send($trader->user, 'KYC Verification Rejected', $message, 'general', null, true);
            
        } else {
            $trader->rejection_reason = null;
            // If verified, we can auto-open their shop for the first time if they want
            $trader->is_open = true; 
            
            // Notify trader of success (In-App + SMS)
            $message = "Habari! Your Soko Mtaa Trader Profile has been verified. You can now manage your stall and receive reservations.";
            $notificationService->send($trader->user, 'KYC Verification Successful', $message, 'general', null, true);
        }

        $trader->save();

        return response()->json([
            'success' => true,
            'message' => "Trader status updated to {$request->status}",
            'data' => $trader
        ]);
    }
}

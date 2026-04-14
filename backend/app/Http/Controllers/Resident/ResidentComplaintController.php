<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ResidentComplaintController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $complaints = Complaint::where('user_id', Auth::id())
            ->with(['trader:id,business_name'])
            ->latest()
            ->paginate(15);

        return $this->success($complaints);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'category'       => 'required|in:trader_conduct,product_quality,payment_dispute,cleanliness,security,water_sanitation,stall_allocation,other',
            'subject'        => 'required|string|max:255',
            'description'    => 'required|string|min:50',
            'trader_id'      => 'nullable|exists:traders,id',
            'reservation_id' => 'nullable|exists:reservations,id',
        ]);

        $marketId = null;
        if ($request->trader_id) {
            $marketId = \App\Models\Trader::find($request->trader_id)?->market_id;
        }
        $marketId ??= 1; // Default to first market if not determinable

        $complaint = Complaint::create([
            'user_id'        => Auth::id(),
            'trader_id'      => $request->trader_id,
            'reservation_id' => $request->reservation_id,
            'market_id'      => $marketId,
            'category'       => $request->category,
            'subject'        => $request->subject,
            'description'    => $request->description,
            'status'         => 'open',
            'priority'       => 1,
        ]);

        return $this->success($complaint, 'Complaint submitted. The market admin will review it shortly.', 201);
    }
}

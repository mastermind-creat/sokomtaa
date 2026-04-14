<?php

namespace App\Http\Controllers\Trader;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TraderComplaintController extends Controller
{
    use ApiResponse;

    /**
     * List complaints — "against" (filed by others against this trader)
     * or "mine" (filed by this trader).
     */
    public function index(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!$user->trader) {
            return $this->error('User is not a trader.', 'NOT_TRADER', 403);
        }

        $tab = $request->query('tab', 'against');

        if ($tab === 'against') {
            $complaints = Complaint::where('trader_id', $user->trader->id)
                ->with(['user:id,name'])
                ->latest()
                ->paginate(15);
        } else {
            $complaints = Complaint::where('user_id', $user->id)
                ->latest()
                ->paginate(15);
        }

        return $this->success($complaints);
    }

    /**
     * Submit a new complaint.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'category'    => 'required|in:trader_conduct,product_quality,payment_dispute,cleanliness,security,water_sanitation,stall_allocation,other',
            'subject'     => 'required|string|max:255',
            'description' => 'required|string|min:50',
            'trader_id'   => 'nullable|exists:traders,id',
            'reservation_id' => 'nullable|exists:reservations,id',
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Resolve market_id from trader if filed against one, else from user's own trader
        $marketId = null;
        if ($request->trader_id) {
            $marketId = \App\Models\Trader::find($request->trader_id)?->market_id;
        }
        $marketId ??= $user->trader?->market_id ?? 1;

        $complaint = Complaint::create([
            'user_id'        => $user->id,
            'trader_id'      => $request->trader_id,
            'reservation_id' => $request->reservation_id,
            'market_id'      => $marketId,
            'category'       => $request->category,
            'subject'        => $request->subject,
            'description'    => $request->description,
            'status'         => 'open',
            'priority'       => 1,
        ]);

        return $this->success($complaint, 'Complaint submitted successfully.', 201);
    }
}

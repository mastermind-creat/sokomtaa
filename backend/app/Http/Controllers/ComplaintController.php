<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use Illuminate\Http\Request;
use App\Traits\ApiResponse;
use Illuminate\Support\Facades\Validator;

class ComplaintController extends Controller
{
    use ApiResponse;

    /**
     * List complaints with role-based filtering.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Complaint::with(['user', 'trader', 'market']);

        if ($user->role !== 'admin') {
            $query->where('user_id', $user->id);
        }

        $complaints = $query->latest()->paginate(15);

        return $this->success($complaints, 'Malalamishi yamepatikana. (Complaints retrieved.)');
    }

    /**
     * Store a new complaint.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'market_id'      => 'required|exists:markets,id',
            'category'       => 'required|string',
            'subject'        => 'required|string|max:255',
            'description'    => 'required|string',
            'trader_id'      => 'nullable|exists:traders,id',
            'reservation_id' => 'nullable|exists:reservations,id',
            'priority'       => 'nullable|integer|between:1,3',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $complaint = Complaint::create([
            'user_id'        => $request->user()->id,
            'market_id'      => $request->market_id,
            'category'       => $request->category,
            'subject'        => $request->subject,
            'description'    => $request->description,
            'trader_id'      => $request->trader_id,
            'reservation_id' => $request->reservation_id,
            'priority'       => $request->priority ?? 1,
            'status'         => 'open',
        ]);

        return $this->success($complaint, 'Lalamishi lako limepokelewa. (Your complaint has been received.)', 21)
    }

    /**
     * Resolve a complaint (Admin only).
     */
    public function resolve($id, Request $request)
    {
        $complaint = Complaint::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'status'         => 'required|in:in_review,resolved,closed',
            'admin_response' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $complaint->update([
            'status'         => $request->status,
            'admin_response' => $request->admin_response,
            'resolved_by'    => $request->user()->id,
            'resolved_at'    => $request->status === 'resolved' ? now() : $complaint->resolved_at,
        ]);

        // Note: In Phase 5A, we would trigger a notification here to the user
        // However, we wait for NotificationService to be injected or used via trait/facade

        return $this->success($complaint, 'Lalamishi limefanyiwa kazi. (Complaint updated.)');
    }
}

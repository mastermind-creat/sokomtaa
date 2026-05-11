<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use Illuminate\Http\Request;
use App\Traits\ApiResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

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

        // Filtering by status or priority if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        $complaints = $query->latest()->get()->map(function($c) {
            return [
                'id' => $c->id,
                'user_id' => $c->user_id,
                'user_name' => $c->user->name ?? 'Unknown',
                'market_id' => $c->market_id,
                'market_name' => $c->market->name ?? 'N/A',
                'trader_id' => $c->trader_id,
                'trader' => $c->trader ? [
                    'id' => $c->trader->id,
                    'business_name' => $c->trader->business_name,
                ] : null,
                'reservation_id' => $c->reservation_id,
                'category' => $c->category,
                'subject' => $c->subject,
                'description' => $c->description,
                'status' => $c->status,
                'priority' => $c->priority === 1 ? 'low' : ($c->priority === 2 ? 'medium' : 'high'),
                'admin_response' => $c->admin_response,
                'created_at' => $c->created_at->toIso8601String(),
                'updated_at' => $c->updated_at->toIso8601String(),
            ];
        });

        return $this->success($complaints, 'Complaints retrieved successfully.');
    }

    /**
     * Get high-level stats for the complaints dashboard.
     */
    public function stats(): \Illuminate\Http\JsonResponse
    {
        $unresolvedCount = Complaint::whereIn('status', ['open', 'in_review'])->count();
        
        $resolvedCount = Complaint::where('status', 'resolved')->count();
        $totalEnded = Complaint::whereIn('status', ['resolved', 'closed'])->count();
        $totalComplaints = Complaint::count();
        
        $efficiency = $totalEnded > 0 ? round(($resolvedCount / $totalEnded) * 100, 1) : 100;
        
        // Sentiment - simple heuristic based on high priority counts
        $highPriorityCount = Complaint::where('priority', 3)->where('status', 'open')->count();
        $sentiment = $highPriorityCount > 5 ? 'Critical' : ($highPriorityCount > 0 ? 'Warning' : 'Stable');

        return response()->json([
            'success' => true,
            'data' => [
                'unresolved' => $unresolvedCount,
                'efficiency' => $efficiency,
                'sentiment' => $sentiment,
                'total' => $totalComplaints
            ]
        ]);
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

        return $this->success($complaint, 'Your complaint has been received successfully.', 201);
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

        return $this->success($complaint, 'Complaint status updated successfully.');
    }
}

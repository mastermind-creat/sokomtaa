<?php

namespace App\Http\Controllers;

use App\Models\Notice;
use Illuminate\Http\Request;
use App\Traits\ApiResponse;
use Illuminate\Support\Facades\Validator;

class NoticeController extends Controller
{
    use ApiResponse;

    /**
     * Get active notices for a market.
     */
    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'market_id' => 'required|exists:markets,id',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $user = $request->user();
        $audience = ['all'];
        
        if ($user) {
            $audience[] = ($user->role === 'trader') ? 'traders' : 'residents';
        }

        $notices = Notice::where('market_id', $request->market_id)
            ->whereIn('audience', $audience)
            ->where(function ($query) {
                $query->whereNull('expires_at')
                      ->orWhere('expires_at', '>', now());
            })
            ->orderBy('is_pinned', 'desc')
            ->latest()
            ->paginate(10);

        return $this->success($notices, 'Matangazo yamepatikana. (Notices retrieved.)');
    }

    /**
     * Store a new notice (Admin only).
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'market_id'  => 'required|exists:markets,id',
            'title'      => 'required|string|max:255',
            'content'    => 'required|string',
            'title_sw'   => 'nullable|string|max:255',
            'content_sw' => 'nullable|string',
            'type'       => 'required|in:general,event,maintenance,promotion,urgent',
            'audience'   => 'required|in:all,traders,residents',
            'expires_at' => 'nullable|date|after:now',
            'is_pinned'  => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422);
        }

        $notice = Notice::create([
            'market_id'  => $request->market_id,
            'created_by' => $request->user()->id,
            'title'      => $request->title,
            'content'    => $request->content,
            'title_sw'   => $request->title_sw,
            'content_sw' => $request->content_sw,
            'type'       => $request->type,
            'audience'   => $request->audience,
            'expires_at' => $request->expires_at,
            'is_pinned'  => $request->is_pinned ?? false,
        ]);

        return $this->success($notice, 'Tangazo limewekwa. (Notice posted.)', 21);
    }
    
    /**
     * Delete a notice (Admin only).
     */
    public function destroy($id)
    {
        $notice = Notice::findOrFail($id);
        $notice->delete();

        return $this->success(null, 'Tangazo limefutwa. (Notice deleted.)');
    }
}

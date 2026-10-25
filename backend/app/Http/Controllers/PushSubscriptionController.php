<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;

class PushSubscriptionController extends Controller
{
    /**
     * Store or update a push subscription for the authenticated user.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'endpoint'    => 'required|string',
            'keys.auth'   => 'required|string',
            'keys.p256dh' => 'required|string',
        ]);

        $user = Auth::user();

        PushSubscription::updateOrCreate(
            [
                'user_id'  => $user->id,
                'endpoint' => $request->endpoint,
            ],
            [
                'public_key'       => $request->input('keys.p256dh'),
                'auth_token'       => $request->input('keys.auth'),
                'content_encoding' => $request->input('contentEncoding', 'aesgcm'),
            ]
        );

        return response()->json(['status' => 'success', 'message' => 'Subscription saved.']);
    }

    /**
     * Delete a push subscription.
     */
    public function destroy(Request $request): JsonResponse
    {
        $request->validate(['endpoint' => 'required|string']);

        $user = Auth::user();

        PushSubscription::where('user_id', $user->id)
            ->where('endpoint', $request->endpoint)
            ->delete();

        return response()->json(['status' => 'success', 'message' => 'Subscription deleted.']);
    }

    /**
     * Get the VAPID Public Key for the frontend.
     */
    public function vapidKey(): JsonResponse
    {
        $key = config('webpush.vapid.public_key');

        if (!$key) {
            return response()->json([
                'status'  => 'error',
                'message' => 'VAPID keys not configured. Run: php artisan webpush:vapid',
            ], 503);
        }

        return response()->json([
            'status'     => 'success',
            'public_key' => $key,
        ]);
    }
}

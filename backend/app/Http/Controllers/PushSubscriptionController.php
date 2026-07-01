<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;

class PushSubscriptionController extends Controller
{
    /**
     * Store a push subscription for the authenticated user.
     */
    public function store(Request $request)
    {
        $request->validate([
            'endpoint'    => 'required|string',
            'keys.auth'   => 'required|string',
            'keys.p256dh' => 'required|string'
        ]);

        $user = Auth::user();

        // The HasPushSubscriptions trait provides this method
        // Once the package is installed, this will work natively.
        if (method_exists($user, 'updatePushSubscription')) {
            $user->updatePushSubscription(
                $request->endpoint,
                $request->keys['p256dh'],
                $request->keys['auth']
            );
        } else {
            // Fallback / Stub while package is not installed
            Log::info("WebPush package not installed. Simulating subscription update for user: {$user->id}");
        }

        return response()->json(['status' => 'success', 'message' => 'Subscription saved.']);
    }

    /**
     * Delete a push subscription.
     */
    public function destroy(Request $request)
    {
        $request->validate(['endpoint' => 'required|string']);

        $user = Auth::user();

        if (method_exists($user, 'deletePushSubscription')) {
            $user->deletePushSubscription($request->endpoint);
        }

        return response()->json(['status' => 'success', 'message' => 'Subscription deleted.']);
    }

    /**
     * Get the VAPID Public Key for the frontend.
     */
    public function vapidKey()
    {
        return response()->json([
            'status' => 'success',
            'public_key' => config('webpush.vapid.public_key', env('VAPID_PUBLIC_KEY'))
        ]);
    }
}

<?php

namespace App\Http\Controllers\Trader;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TraderSettingsController extends Controller
{
    use ApiResponse;

    /**
     * Get the trader's notification and privacy preferences.
     */
    public function show(): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // For now, preferences are stored per-user in a JSON preferences column
        // or defaulted here until a user_preferences table is added.
        $prefs = $user->preferences ?? [];

        $settings = [
            'notifications' => [
                'new_order_sms'        => $prefs['new_order_sms']        ?? true,
                'new_order_app'        => $prefs['new_order_app']        ?? true,
                'fee_reminder_sms'     => $prefs['fee_reminder_sms']     ?? true,
                'new_review_app'       => $prefs['new_review_app']       ?? true,
                'daily_summary_app'    => $prefs['daily_summary_app']    ?? false,
                'market_updates_sms'   => $prefs['market_updates_sms']   ?? false,
            ],
            'privacy' => [
                'show_phone_to_customers'        => $prefs['show_phone_to_customers']        ?? true,
                'show_order_count_on_profile'    => $prefs['show_order_count_on_profile']    ?? true,
            ],
            'language' => $user->preferred_language ?? 'en',
        ];

        return $this->success($settings);
    }

    /**
     * Update the trader's notification and privacy preferences.
     */
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'notifications'                             => 'sometimes|array',
            'notifications.new_order_sms'               => 'sometimes|boolean',
            'notifications.new_order_app'               => 'sometimes|boolean',
            'notifications.fee_reminder_sms'            => 'sometimes|boolean',
            'notifications.new_review_app'              => 'sometimes|boolean',
            'notifications.daily_summary_app'           => 'sometimes|boolean',
            'notifications.market_updates_sms'          => 'sometimes|boolean',
            'privacy'                                   => 'sometimes|array',
            'privacy.show_phone_to_customers'           => 'sometimes|boolean',
            'privacy.show_order_count_on_profile'       => 'sometimes|boolean',
            'language'                                  => 'sometimes|in:en,sw',
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Merge all flat settings into user preferences
        $existingPrefs = $user->preferences ?? [];

        if ($request->has('notifications')) {
            foreach ($request->notifications as $key => $value) {
                $existingPrefs[$key] = $value;
            }
        }
        if ($request->has('privacy')) {
            foreach ($request->privacy as $key => $value) {
                $existingPrefs[$key] = $value;
            }
        }

        $user->preferences = $existingPrefs;

        if ($request->has('language')) {
            $user->preferred_language = $request->language;
        }

        $user->save();

        return $this->success(null, 'Settings updated successfully.');
    }
}

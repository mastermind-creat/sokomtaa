<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdminSettingController extends Controller
{
    /**
     * Get all system settings (admin only).
     */
    public function index(): JsonResponse
    {
        $settings = SystemSetting::all()->groupBy('group');
        return response()->json([
            'status' => 'success',
            'data' => $settings
        ]);
    }

    /**
     * Get publicly accessible settings (fee thresholds for checkout UI).
     * No authentication required.
     */
    public function publicIndex(): JsonResponse
    {
        $settings = SystemSetting::where('group', 'fees')->get()->groupBy('group');
        return response()->json([
            'status' => 'success',
            'data' => $settings
        ]);
    }

    /**
     * Update multiple settings.
     */
    public function updateBulk(Request $request): JsonResponse
    {
        $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|exists:system_settings,key',
            'settings.*.value' => 'required'
        ]);

        foreach ($request->settings as $settingData) {
            SystemSetting::set($settingData['key'], $settingData['value']);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Settings updated successfully.'
        ]);
    }
}

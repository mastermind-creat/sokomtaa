<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;

class AIConfigController extends Controller
{
    public function getConfig(): JsonResponse
    {
        $settings = SystemSetting::where('group', 'ai_config')->pluck('value', 'key');
        
        return response()->json([
            'status' => 'success',
            'data' => [
                'provider' => $settings->get('ai_provider', 'groq'),
                'model' => $settings->get('ai_model', 'llama-3.3-70b-versatile'),
                'groq_api_key' => $settings->get('groq_api_key', ''),
                'openai_api_key' => $settings->get('openai_api_key', ''),
            ]
        ]);
    }
}

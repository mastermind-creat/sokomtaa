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
        
        $openaiKey = $settings->get('openai_api_key');
        $openaiKey = !empty($openaiKey) ? $openaiKey : env('OPENAI_API_KEY', '');
        
        $groqKey = $settings->get('groq_api_key');
        $groqKey = !empty($groqKey) ? $groqKey : env('GROQ_API_KEY', '');

        return response()->json([
            'status' => 'success',
            'data' => [
                'provider' => $settings->get('ai_provider', 'groq'),
                'model' => $settings->get('ai_model', 'llama-3.3-70b-versatile'),
                'groq_api_key' => $groqKey,
                'openai_api_key' => $openaiKey,
            ]
        ]);
    }
}

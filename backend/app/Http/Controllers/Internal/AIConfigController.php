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

        // Resolve API keys — DB value first, then .env fallback
        $openaiKey = $settings->get('openai_api_key');
        $openaiKey = !empty($openaiKey) ? $openaiKey : env('OPENAI_API_KEY', '');

        $groqKey = $settings->get('groq_api_key');
        $groqKey = !empty($groqKey) ? $groqKey : env('GROQ_API_KEY', '');

        // Smart provider + model selection:
        // Use DB-configured provider if it has a key; otherwise fall back to
        // whichever provider actually has a key configured.
        $configuredProvider = $settings->get('ai_provider', 'groq');
        $configuredModel    = $settings->get('ai_model', 'llama-3.3-70b-versatile');

        $hasGroqKey   = !empty($groqKey);
        $hasOpenaiKey = !empty($openaiKey);

        if ($configuredProvider === 'groq' && !$hasGroqKey && $hasOpenaiKey) {
            // Groq selected but no key — fall back to OpenAI
            $provider = 'openai';
            $model    = 'gpt-4o-mini';
        } elseif ($configuredProvider === 'openai' && !$hasOpenaiKey && $hasGroqKey) {
            // OpenAI selected but no key — fall back to Groq
            $provider = 'groq';
            $model    = 'llama-3.3-70b-versatile';
        } else {
            $provider = $configuredProvider;
            $model    = $configuredModel;
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'provider'       => $provider,
                'model'          => $model,
                'groq_api_key'   => $groqKey,
                'openai_api_key' => $openaiKey,
            ]
        ]);
    }
}

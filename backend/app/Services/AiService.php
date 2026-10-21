<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiService
{
    protected ?string $apiKey = null;
    protected string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

    public function __construct()
    {
        $this->apiKey = config('services.gemini.key');
    }

    /**
     * Generate content using Gemini API.
     */
    public function generate(string $prompt): ?string
    {
        try {
            $dbKey = \App\Models\SystemSetting::where('key', 'openai_api_key')->value('value');
        } catch (\Throwable $e) {
            $dbKey = null;
        }
        $openaiKey = !empty($dbKey) ? $dbKey : env('OPENAI_API_KEY');
        if (!empty($openaiKey)) {
            try {
                $response = Http::withToken($openaiKey)
                    ->timeout(10)
                    ->post('https://api.openai.com/v1/chat/completions', [
                        'model' => 'gpt-4o-mini',
                        'messages' => [
                            ['role' => 'user', 'content' => $prompt]
                        ],
                        'temperature' => 0.7,
                        'max_tokens' => 1024,
                    ]);

                if ($response->successful()) {
                    return trim($response->json('choices.0.message.content') ?? '');
                }

                Log::error('OpenAI API Error: ' . $response->body());
            } catch (\Exception $e) {
                Log::error('OpenAI API Exception: ' . $e->getMessage());
            }
        }

        if (!$this->apiKey) {
            Log::warning('Neither OpenAI nor Gemini API key is configured.');
            return null;
        }

        try {
            $response = Http::timeout(5)->post("{$this->baseUrl}?key={$this->apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.7,
                    'topK' => 40,
                    'topP' => 0.95,
                    'maxOutputTokens' => 1024,
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
            }

            Log::error('Gemini API Error: ' . $response->body());
            return null;

        } catch (\Exception $e) {
            Log::error('Gemini API Exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Expand a search query into related terms and synonyms (English + Swahili).
     */
    public function expandQuery(string $query): array
    {
        $prompt = "Expand the following search query into a list of 5 related keywords or synonyms that a shopper might use in a Kenyan marketplace. 
        Include both English and Swahili terms if applicable.
        Query: '{$query}'
        
        Return the result as a simple comma-separated list of words. No other text.";

        $result = $this->generate($prompt);

        if (!$result) return [$query];

        $terms = explode(',', $result);
        return array_map('trim', array_merge([$query], $terms));
    }

    /**
     * Generate a professional product description for traders.
     */
    public function suggestDescription(string $productName, ?string $category = null): ?string
    {
        $prompt = "Write a catchy, professional, and trust-building product description for a Kenyan market item.
        Product: {$productName}
        " . ($category ? "Category: {$category}" : "") . "
        
        Style: Energetic, marketplace-friendly, mentions quality and freshness (if applicable).
        Length: 2-3 sentences.
        Include a touch of Swahili local flair (e.g. 'Karibu', 'Safisha').";

        return $this->generate($prompt);
    }

    /**
     * Interactive chat with Soko AI.
     */
    public function chat(string $message, $user = null): ?string
    {
        $roleInfo = $user ? "The user is a {$user->role} on Soko Mtaa." : "";
        $prompt = "You are 'Soko AI', a helpful and knowledgeable assistant for Soko Mtaa, a Kenyan neighbourhood marketplace. 
        Your goal is to assist traders, residents, and administrators with marketplace-related questions.
        Keep responses concise, friendly, and relevant to the Kenyan context.
        {$roleInfo}
        
        Formatting instructions:
        - Do NOT use markdown asterisks (*) for bullet points. Use clean dashes (-) or numbers.
        - Do NOT use double asterisks (**) for bolding. Just use plain text or capitalize key words if necessary.
        - Ensure the output is clean, easy to read, and professional.
        
        User says: '{$message}'";

        return $this->generate($prompt);
    }

    /**
     * Get simulated or AI-generated marketplace trends.
     */
    public function getTrends(): array
    {
        $prompt = "Generate a list of 5 currently trending items or categories in a Kenyan urban marketplace (e.g., 'Fresh Sukuma Wiki', 'Organic Avocadoes').
        Return as a simple comma-separated list.";

        $result = $this->generate($prompt);
        if (!$result) return [];

        return array_map('trim', explode(',', $result));
    }

    /**
     * Generate strategic planning insights based on market data.
     */
    public function generatePlanningInsights(array $data): array
    {
        $prompt = "You are an AI urban planning consultant for Soko Mtaa, a Kenyan marketplace platform. 
        Based on the following market data, generate 3 professional, actionable strategic insights for county administrators.
        Data:
        - Occupancy Rate: {$data['occupancy_rate']}%
        - Peak Activity Hour: {$data['peak_hour']}
        - Top Trading Category: {$data['top_category']}
        - Reservation Volume Trend: " . json_encode($data['reservation_trend']) . "
        
        Return the response as a JSON array of objects with these fields:
        'type': (string, one of: infrastructure, operations, category, security, financial)
        'title': (string, short punchy title)
        'description': (string, 2-3 sentences of professional advice)
        'priority': (string, one of: high, medium, low)
        
        ONLY return the raw JSON array. No markdown, no triple backticks.";

        $result = $this->generate($prompt);

        if (!$result) return [];

        try {
            // Clean markdown if AI included it
            $cleaned = preg_replace('/^```json\n?|\n?```$/', '', trim($result));
            return json_decode($cleaned, true) ?? [];
        } catch (\Exception $e) {
            return [];
        }
    }
}

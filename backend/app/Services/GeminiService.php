<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    protected $apiKey;
    protected $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

    public function __construct()
    {
        $this->apiKey = config('services.gemini.key');
    }

    /**
     * Generate content using Gemini Pro.
     */
    public function generateText(string $prompt, array $options = [])
    {
        if (!$this->apiKey) {
            Log::warning('Gemini API Key missing.');
            return null;
        }

        try {
            $response = Http::post("{$this->baseUrl}/gemini-1.5-flash:generateContent?key={$this->apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => array_merge([
                    'temperature' => 0.7,
                    'topK' => 40,
                    'topP' => 0.95,
                    'maxOutputTokens' => 1024,
                ], $options)
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
            }

            Log::error('Gemini API Error: ' . $response->body());
            return null;
        } catch (\Exception $e) {
            Log::error('Gemini Exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get embeddings for a string (useful for semantic search).
     */
    public function getEmbeddings(string $text)
    {
        if (!$this->apiKey) return null;

        try {
            $response = Http::post("{$this->baseUrl}/text-embedding-004:embedContent?key={$this->apiKey}", [
                'model' => 'models/text-embedding-004',
                'content' => [
                    'parts' => [
                        ['text' => $text]
                    ]
                ]
            ]);

            if ($response->successful()) {
                return $response->json()['embedding']['values'] ?? null;
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Gemini Embedding Exception: ' . $e->getMessage());
            return null;
        }
    }
}

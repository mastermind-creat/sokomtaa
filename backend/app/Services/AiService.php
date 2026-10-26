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
     * Interactive chat with Soko AI — grounded with real marketplace data.
     *
     * Builds a context block from the database so the AI never has to guess
     * about traders, products, or availability. The user's message is analysed
     * for intent (trader lookup, product search, general question) and the
     * relevant data is injected into the prompt before calling the model.
     */
    public function chat(string $message, $user = null): ?string
    {
        $roleInfo    = $user ? "The user is a {$user->role} on Soko Mtaa." : "";
        $contextBlock = $this->buildMarketplaceContext($message);

        $prompt = "You are 'Soko AI', a helpful assistant for Soko Mtaa, a Kenyan neighbourhood marketplace platform.
{$roleInfo}

IMPORTANT RULES:
- You have access to LIVE marketplace data provided below. Always use this data to answer questions.
- NEVER say you cannot find traders or products if they appear in the marketplace data below.
- If a trader or product is listed below, confirm it exists and share the details.
- If the marketplace data is empty (no traders/products found), say so honestly and suggest the user browse the marketplace directly.
- Keep responses concise, friendly, and grounded in the data provided.
- Do NOT use markdown asterisks (*) for bullet points. Use dashes (-) or numbers.
- Do NOT use double asterisks (**) for bold. Capitalise key words instead.

{$contextBlock}

User message: '{$message}'";

        return $this->generate($prompt);
    }

    /**
     * Query the database and build a context block relevant to the user's message.
     * Detects intent from the message to fetch trader info, product lists, or general traders.
     */
    private function buildMarketplaceContext(string $message): string
    {
        $lower = strtolower($message);
        $lines = [];

        try {
            // ── Intent: looking for a specific trader by name ──────────────────
            $traderMatches = \App\Models\Trader::with(['market', 'stall', 'products' => function ($q) {
                $q->where('is_active', true)->limit(5);
            }])
            ->where('verification_status', 'verified')
            ->where(function ($q) use ($lower) {
                $q->whereRaw('LOWER(business_name) LIKE ?', ["%{$lower}%"])
                  ->orWhereRaw('LOWER(business_name_sw) LIKE ?', ["%{$lower}%"]);
            })
            ->limit(3)
            ->get();

            if ($traderMatches->isNotEmpty()) {
                $lines[] = "TRADERS FOUND IN MARKETPLACE:";
                foreach ($traderMatches as $t) {
                    $status  = $t->is_currently_open ? 'Open now' : 'Currently closed';
                    $market  = $t->market?->name ?? 'Unknown market';
                    $stall   = $t->stall?->stall_number ? "Stall {$t->stall->stall_number}" : 'No stall assigned';
                    $rating  = number_format((float)$t->average_rating, 1);
                    $lines[] = "- {$t->business_name} | {$market} | {$stall} | Rating: {$rating}/5 | {$status}";

                    if ($t->products->isNotEmpty()) {
                        $lines[] = "  Products: " . $t->products->pluck('name')->implode(', ');
                    }
                }
                $lines[] = "";
            }

            // ── Intent: looking for products / generic search ──────────────────
            // Extract potential product keywords (words 3+ chars that aren't stop words)
            $stopWords = ['the', 'for', 'from', 'with', 'and', 'can', 'you', 'are', 'trader', 'products', 'shop', 'store', 'find', 'show', 'check', 'please', 'what', 'how', 'any', 'all'];
            $words     = array_filter(
                explode(' ', preg_replace('/[^a-z0-9 ]/', '', $lower)),
                fn ($w) => strlen($w) >= 3 && !in_array($w, $stopWords)
            );

            if (!empty($words)) {
                $productQ = \App\Models\Product::with(['trader.market'])
                    ->where('is_active', true)
                    ->where(function ($q) use ($words) {
                        foreach ($words as $word) {
                            $q->orWhereRaw('LOWER(products.name) LIKE ?', ["%{$word}%"])
                              ->orWhereRaw('LOWER(products.name_sw) LIKE ?', ["%{$word}%"]);
                        }
                    })
                    ->limit(6)
                    ->get();

                if ($productQ->isNotEmpty()) {
                    $lines[] = "PRODUCTS FOUND IN MARKETPLACE:";
                    foreach ($productQ as $p) {
                        $traderName = $p->trader?->business_name ?? 'Unknown trader';
                        $market     = $p->trader?->market?->name ?? 'Unknown market';
                        $price      = 'KES ' . number_format((float)$p->price, 0);
                        $stock      = $p->stock_status === 'available' ? 'In stock' : ($p->stock_status === 'low' ? 'Low stock' : 'Out of stock');
                        $lines[]    = "- {$p->name}" . ($p->name_sw ? " ({$p->name_sw})" : '') . " | {$price}/{$p->unit} | {$stock} | Sold by: {$traderName} at {$market}";
                    }
                    $lines[] = "";
                }
            }

            // ── Always append a general overview of available traders ──────────
            if (empty($lines)) {
                $allTraders = \App\Models\Trader::with('market')
                    ->where('verification_status', 'verified')
                    ->orderByDesc('average_rating')
                    ->limit(5)
                    ->get();

                if ($allTraders->isNotEmpty()) {
                    $lines[] = "VERIFIED TRADERS ON SOKO MTAA:";
                    foreach ($allTraders as $t) {
                        $status  = $t->is_currently_open ? 'Open' : 'Closed';
                        $market  = $t->market?->name ?? 'Unknown';
                        $rating  = number_format((float)$t->average_rating, 1);
                        $lines[] = "- {$t->business_name} | {$market} | Rating: {$rating}/5 | {$status}";
                    }
                    $lines[] = "";
                }
            }

        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('AiService: context build failed', ['error' => $e->getMessage()]);
        }

        if (empty($lines)) {
            return "MARKETPLACE DATA: No specific data found for this query. Answer based on general Soko Mtaa knowledge.";
        }

        return "LIVE MARKETPLACE DATA (use this to answer the user):\n" . implode("\n", $lines);
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

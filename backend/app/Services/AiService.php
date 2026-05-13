<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Trader;
use App\Models\Market;
use Illuminate\Support\Facades\Log;

class AiService
{
    protected $gemini;

    public function __construct(GeminiService $gemini)
    {
        $this->gemini = $gemini;
    }

    /**
     * Get AI-powered search intent expansion.
     * e.g. "greens" -> "sukuma wiki, spinach, terere"
     */
    public function expandQuery(string $query)
    {
        $prompt = "You are a Kenyan marketplace assistant. The user is searching for '{$query}'. 
        Return a comma-separated list of related product names or keywords common in Kenyan markets (both in English and Swahili) that might match this intent. 
        Keep it concise, max 10 terms. Format: 'term1, term2, term3'.";

        $expanded = $this->gemini->generateText($prompt, ['temperature' => 0.3]);
        
        if (!$expanded) return [$query];

        $terms = array_map('trim', explode(',', $expanded));
        return array_unique(array_merge([$query], $terms));
    }

    /**
     * Chat with Soko AI Assistant.
     */
    public function chat(string $message, $user = null)
    {
        $context = "You are 'Soko AI', a helpful and friendly assistant for Soko Mtaa, a digital marketplace in Kenya. 
        You help residents find products, traders, and markets. You help traders with business advice.
        Current context: The user is a " . ($user ? $user->role : 'guest') . " named " . ($user ? $user->name : 'Guest') . ".
        Always be polite, use a mix of English and Swahili (Sheng is okay if appropriate), and keep responses concise (max 3 paragraphs).
        If asked for products, suggest that they use the search bar for the most up-to-date listings.";

        $prompt = "Context: {$context}\n\nUser: {$message}\n\nSoko AI:";

        return $this->gemini->generateText($prompt);
    }

    /**
     * Suggest a product description for a trader.
     */
    public function suggestDescription(string $productName, ?string $category = null)
    {
        $prompt = "Write a catchy, professional, and locally-appealing product description for '{$productName}'" . 
        ($category ? " in the '{$category}' category" : "") . 
        " for a Kenyan marketplace app called Soko Mtaa. Mention quality, freshness (if food), or value. Keep it under 200 characters.";

        return $this->gemini->generateText($prompt, ['temperature' => 0.8]);
    }

    /**
     * Get trending item types based on current listings.
     */
    public function getTrends()
    {
        // Simple logic: get top categories and ask AI to summarize trends
        $topCategories = \App\Models\Category::withCount('products')
            ->orderByDesc('products_count')
            ->take(5)
            ->get()
            ->pluck('name')
            ->toArray();

        $categoriesStr = implode(', ', $topCategories);
        
        $prompt = "Based on these top product categories in a Kenyan digital market: {$categoriesStr}, 
        what are 3 specific trending items or 'Hot Picks' you would recommend to users this week? 
        Format as JSON: [{\"title\": \"...\", \"reason\": \"...\"}, ...]";

        $response = $this->gemini->generateText($prompt, ['temperature' => 0.5]);
        
        // Try to parse JSON from response
        if (preg_match('/\[.*\]/s', $response, $matches)) {
            return json_decode($matches[0], true);
        }

        return null;
    }
}

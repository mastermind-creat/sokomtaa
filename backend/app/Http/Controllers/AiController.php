<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\AiService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class AiController extends Controller
{
    use ApiResponse;

    protected $aiService;

    public function __construct(AiService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Chat with Soko AI.
     */
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'lat'     => 'nullable|numeric',
            'lng'     => 'nullable|numeric',
        ]);

        $user     = $request->user();
        $response = $this->aiService->chat($request->message, $user);

        if (!$response) {
            return $this->error('Soko AI is currently resting. Please try again later.', 'AI_UNAVAILABLE', 503);
        }

        return $this->success([
            'response'  => $response,
            'timestamp' => now()->toIso8601String()
        ]);
    }

    /**
     * Get a suggested description for a product.
     */
    public function suggestDescription(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'category' => 'nullable|string|max:50',
        ]);

        $suggestion = $this->aiService->suggestDescription($request->name, $request->category);

        return $this->success([
            'suggestion' => $suggestion
        ]);
    }

    /**
     * Get marketplace trends.
     */
    public function trends(): JsonResponse
    {
        $trends = $this->aiService->getTrends();

        return $this->success([
            'trends' => $trends ?? []
        ]);
    }
}

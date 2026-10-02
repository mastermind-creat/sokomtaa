<?php

namespace App\Http\Controllers\Ai;

use App\Exceptions\ServiceUnavailableException;
use App\Http\Controllers\Controller;
use App\Services\AiPipelineService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * POST /api/ai/chat
 *
 * AI pipeline entry point for Residents.
 * Routes input to the appropriate FastAPI endpoint (parse-recipe or pantry-exclusion)
 * via AiPipelineService, which enforces a 5-second circuit-breaker timeout.
 *
 * Middleware: auth:sanctum + role:resident + throttle:10,1 (10 req/min per user)
 * Requirements: 14.5
 */
class AiController extends Controller
{
    use ApiResponse;

    public function __construct(private AiPipelineService $pipeline) {}

    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text'          => 'required|string|min:3',
            'session_id'    => 'nullable|string',
            'pantry_items'  => 'nullable|array',
            'resident_lat'  => 'nullable|numeric|between:-90,90',
            'resident_lon'  => 'nullable|numeric|between:-180,180',
            'radius_km'     => 'nullable|numeric|min:0.1|max:50',
        ]);

        $payload = array_merge($validated, [
            'user_id' => $request->user()->id,
        ]);

        // Route to the correct FastAPI endpoint based on request context
        $endpoint = $this->resolveEndpoint($validated);

        try {
            $data = $this->pipeline->callFastApi($endpoint, $payload);
        } catch (ServiceUnavailableException $e) {
            return $this->error($e->getMessage(), 'SERVICE_UNAVAILABLE', 503);
        }

        return $this->success($data, 'AI pipeline response');
    }

    /**
     * Determine which FastAPI endpoint to call based on provided fields.
     *
     * - pantry-exclusion: session active + pantry items provided
     * - match-traders:    session active + location provided (no pantry items)
     * - parse-recipe:     fresh request with meal description text
     */
    private function resolveEndpoint(array $validated): string
    {
        if (isset($validated['session_id'])) {
            if (isset($validated['pantry_items'])) {
                return '/ai/pantry-exclusion';
            }

            if (isset($validated['resident_lat'], $validated['resident_lon'])) {
                return '/ai/match-traders';
            }
        }

        return '/ai/parse-recipe';
    }
}

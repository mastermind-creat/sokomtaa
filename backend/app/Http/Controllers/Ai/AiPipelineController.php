<?php

namespace App\Http\Controllers\Ai;

use App\Exceptions\ServiceUnavailableException;
use App\Http\Controllers\Controller;
use App\Services\AiPipelineService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiPipelineController extends Controller
{
    use ApiResponse;

    public function __construct(private AiPipelineService $pipeline) {}

    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text' => 'required|string|min:3',
            'session_id' => 'nullable|string',
            'pantry_items' => 'nullable|array',
        ]);

        $payload = array_merge($validated, [
            'user_id' => $request->user()->id,
        ]);

        $endpoint = isset($validated['session_id']) && isset($validated['pantry_items'])
            ? '/ai/pantry-exclusion'
            : '/ai/parse-recipe';

        try {
            $data = $this->pipeline->callFastApi($endpoint, $payload);
        } catch (ServiceUnavailableException $e) {
            return $this->error($e->getMessage(), 'SERVICE_UNAVAILABLE', 503);
        }

        return $this->success($data, 'AI pipeline response');
    }
}

<?php

namespace App\Services;

use App\Exceptions\ServiceUnavailableException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiPipelineService
{
    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function callFastApi(string $endpoint, array $payload): array
    {
        $url = rtrim((string) config('services.fastapi.url'), '/').$endpoint;
        $safePayload = $payload;
        unset($safePayload['text']);

        try {
            $response = Http::timeout(5)
                ->withHeaders(['X-Internal-Token' => (string) config('services.fastapi.token')])
                ->post($url, $payload);

            if ($response->failed()) {
                Log::channel('fastapi')->error('FastAPI error', [
                    'endpoint' => $endpoint,
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'payload' => $safePayload,
                ]);

                throw new ServiceUnavailableException('AI service returned an error');
            }

            return $response->json() ?? [];
        } catch (ConnectionException $e) {
            Log::channel('fastapi')->error('FastAPI unreachable', [
                'endpoint' => $endpoint,
                'error' => $e->getMessage(),
                'payload' => $safePayload,
            ]);

            throw new ServiceUnavailableException('AI service is temporarily unavailable');
        }
    }
}

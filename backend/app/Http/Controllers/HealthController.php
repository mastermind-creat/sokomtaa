<?php

namespace App\Http\Controllers;

use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class HealthController extends Controller
{
    use ApiResponse;

    public function __invoke(): JsonResponse
    {
        $db = 'ok';
        $redis = 'ok';

        try {
            DB::connection()->getPdo();
        } catch (\Throwable) {
            $db = 'down';
        }

        try {
            Redis::ping();
        } catch (\Throwable) {
            $redis = 'down';
        }

        $ok = $db === 'ok' && $redis === 'ok';

        return response()->json([
            'status' => $ok ? 'ok' : 'degraded',
            'db' => $db,
            'redis' => $redis,
        ], $ok ? 200 : 503);
    }
}

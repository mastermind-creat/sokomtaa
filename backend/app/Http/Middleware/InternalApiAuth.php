<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InternalApiAuth
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $secret = config('services.internal_api_secret', env('INTERNAL_API_SECRET'));
        
        if (empty($secret) || $request->header('X-Internal-Secret') !== $secret) {
            return response()->json(['message' => 'Unauthorized. Invalid internal secret.'], 401);
        }

        return $next($request);
    }
}

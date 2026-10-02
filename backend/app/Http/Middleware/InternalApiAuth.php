<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InternalApiAuth
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $expected = (string) config('services.internal_token');
        $provided = $request->header('X-Internal-Token');

        if ($expected === '' || $provided === null || ! hash_equals($expected, $provided)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated. Invalid internal token.',
                'errors' => null,
                'code' => 'UNAUTHENTICATED',
            ], 401);
        }

        return $next($request);
    }
}

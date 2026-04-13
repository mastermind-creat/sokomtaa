<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Enforce role-based access. Accepts comma-separated roles.
     * Usage: Route::middleware('role:admin') or Route::middleware('role:trader,admin')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (! $request->user()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated. Please log in.',
                'errors'  => null,
                'code'    => 'UNAUTHENTICATED',
            ], 401);
        }

        if (! in_array($request->user()->role, $roles)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to perform this action',
                'errors'  => null,
                'code'    => 'UNAUTHORIZED',
            ], 403);
        }

        return $next($request);
    }
}

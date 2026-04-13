<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTraderVerified
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role !== 'trader') {
            return response()->json([
                'success' => false,
                'message' => 'Trader account required',
                'errors'  => null,
                'code'    => 'UNAUTHORIZED',
            ], 403);
        }

        $trader = $user->trader;

        if (! $trader || $trader->verification_status !== 'verified') {
            return response()->json([
                'success' => false,
                'message' => 'Your trader profile has not been verified yet. Please wait for admin approval.',
                'errors'  => null,
                'code'    => 'TRADER_NOT_VERIFIED',
            ], 403);
        }

        return $next($request);
    }
}

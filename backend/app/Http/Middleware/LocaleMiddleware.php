<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LocaleMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // Priority: user preference from DB → Accept-Language header → default (sw)
        $locale = 'sw';

        if ($request->user() && $request->user()->preferred_language) {
            $locale = $request->user()->preferred_language;
        } elseif ($request->hasHeader('Accept-Language')) {
            $headerLocale = substr($request->header('Accept-Language'), 0, 2);
            if (in_array($headerLocale, ['sw', 'en'])) {
                $locale = $headerLocale;
            }
        }

        app()->setLocale($locale);

        return $next($request);
    }
}

<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role'            => \App\Http\Middleware\RoleMiddleware::class,
            'trader.verified' => \App\Http\Middleware\EnsureTraderVerified::class,
        ]);

        $middleware->append(\App\Http\Middleware\LocaleMiddleware::class);
        $middleware->append(\App\Http\Middleware\SecurityHeadersMiddleware::class);

        $middleware->validateCsrfTokens(except: [
            'api/payments/mpesa/callback'
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(fn ($request, $e) => $request->is('api/*'));

        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, $request) {
            \Illuminate\Support\Facades\Log::info('Validation Error:', [
                'url' => $request->fullUrl(),
                'errors' => $e->errors(),
                'data' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
                'code'    => 'VALIDATION_ERROR',
            ], 422);
        });

        $exceptions->render(function (\Illuminate\Database\Eloquent\ModelNotFoundException $e, $request) {
            return response()->json([
                'success' => false,
                'message' => 'The requested resource was not found',
                'errors'  => null,
                'code'    => 'NOT_FOUND',
            ], 404);
        });

        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated. Please log in.',
                'errors'  => null,
                'code'    => 'UNAUTHENTICATED',
            ], 401);
        });

        $exceptions->render(function (\Illuminate\Auth\Access\AuthorizationException $e, $request) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to perform this action',
                'errors'  => null,
                'code'    => 'UNAUTHORIZED',
            ], 403);
        });

        $exceptions->render(function (\Throwable $e, $request) {
            if ($request->is('api/*')) {
                \Illuminate\Support\Facades\Log::error('API Error:', [
                    'url' => $request->fullUrl(),
                    'message' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                $status  = $e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface ? $e->getStatusCode() : 500;
                $message = app()->isProduction() ? 'An unexpected error occurred' : $e->getMessage();

                return response()->json([
                    'success' => false,
                    'message' => $message,
                    'errors'  => null,
                    'code'    => 'SERVER_ERROR',
                ], $status);
            }
        });
    })->create();

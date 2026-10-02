<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \Illuminate\Support\Facades\RateLimiter::for('api', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        \Illuminate\Support\Facades\RateLimiter::for('auth', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(5)->by($request->ip());
        });

        \Illuminate\Support\Facades\RateLimiter::for('otp', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(3)->by($request->user()?->id ?: $request->ip());
        });

        // Load Social Provider config from SystemSettings
        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('system_settings')) {
                $googleClientId = \App\Models\SystemSetting::get('google_client_id');
                $googleClientSecret = \App\Models\SystemSetting::get('google_client_secret');
                if ($googleClientId && $googleClientSecret) {
                    config(['services.google.client_id' => $googleClientId]);
                    config(['services.google.client_secret' => $googleClientSecret]);
                }

                $appleClientId = \App\Models\SystemSetting::get('apple_client_id');
                $appleClientSecret = \App\Models\SystemSetting::get('apple_client_secret');
                if ($appleClientId && $appleClientSecret) {
                    config(['services.apple.client_id' => $appleClientId]);
                    config(['services.apple.client_secret' => $appleClientSecret]);
                }
            }
        } catch (\Exception $e) {
            // Ignore if DB is not ready during migrations
        }
    }
}

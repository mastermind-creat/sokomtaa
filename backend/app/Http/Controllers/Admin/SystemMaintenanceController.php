<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SystemMaintenanceController extends Controller
{
    /**
     * Get system status and environment info.
     */
    public function status()
    {
        return response()->json([
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'environment' => app()->environment(),
            'db_connection' => config('database.default'),
            'cache_driver' => config('cache.default'),
            'storage_link_exists' => public_exists('storage'),
            'last_migration' => DB::table('migrations')->latest()->first(),
        ]);
    }

    /**
     * Run migrations.
     */
    public function migrate()
    {
        try {
            Artisan::call('migrate', ['--force' => true]);
            return response()->json([
                'message' => 'Migrations completed successfully.',
                'output' => Artisan::output()
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Migration failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Clear all caches.
     */
    public function clearCache()
    {
        try {
            Artisan::call('cache:clear');
            Artisan::call('config:clear');
            Artisan::call('route:clear');
            Artisan::call('view:clear');
            
            return response()->json([
                'message' => 'All caches cleared successfully.',
                'output' => Artisan::output()
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Cache clear failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Optimize the application.
     */
    public function optimize()
    {
        try {
            Artisan::call('optimize');
            return response()->json([
                'message' => 'Application optimized successfully.',
                'output' => Artisan::output()
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Optimization failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Recreate storage link.
     */
    public function storageLink()
    {
        try {
            Artisan::call('storage:link');
            return response()->json([
                'message' => 'Storage link created successfully.',
                'output' => Artisan::output()
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Storage link failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Seed initial/missing data.
     */
    public function seed()
    {
        try {
            Artisan::call('db:seed', ['--force' => true]);
            return response()->json([
                'message' => 'Database seeding completed.',
                'output' => Artisan::output()
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Seeding failed: ' . $e->getMessage()], 500);
        }
    }
}

/**
 * Helper to check if public path exists.
 */
function public_exists($path)
{
    return file_exists(public_path($path));
}

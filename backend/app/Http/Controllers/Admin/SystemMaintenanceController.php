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
            'storage_link_exists' => $this->public_exists('storage'),
            'last_migration' => $this->getLastMigration(),
        ]);
    }

    private function getLastMigration()
    {
        try {
            return DB::table('migrations')->latest('id')->first();
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Run migrations.
     */
    public function migrate()
    {
        try {
            set_time_limit(600); // Increase time limit to 10 minutes for slow production servers
            
            // 1. Run migrations
            Artisan::call('migrate', ['--force' => true]);
            $output = Artisan::output();
            
            // 2. Automatically clear caches to ensure the app boots with fresh state
            Artisan::call('config:clear');
            Artisan::call('route:clear');
            Artisan::call('cache:clear');
            $output .= "\n--- Post-Migration Cleanup ---\n" . Artisan::output();
            
            return response()->json([
                'message' => 'Migrations completed and system optimized.',
                'output' => $output
            ]);
        } catch (\Exception $e) {
            Log::error('Maintenance Migration Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Migration failed. This is often caused by a table already existing or a missing column.',
                'error' => $e->getMessage(),
                'hint' => 'Check your database structure and the migrations table for sync issues.'
            ], 500);
        }
    }

    /**
     * Clear all caches.
     */
    public function clearCache()
    {
        try {
            set_time_limit(300);
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
            set_time_limit(300);
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
            set_time_limit(300);
            $link = public_path('storage');
            
            // If it's a symlink or directory, remove it first to avoid "already exists" error
            if (is_link($link) || file_exists($link)) {
                if (PHP_OS_FAMILY === 'Windows') {
                    exec("rmdir /s /q \"$link\"");
                } else {
                    exec("rm -rf \"$link\"");
                }
            }

            Artisan::call('storage:link');
            
            return response()->json([
                'message' => 'Storage link recreated successfully.',
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
            set_time_limit(300);
            Artisan::call('db:seed', ['--force' => true]);
            return response()->json([
                'message' => 'Database seeding completed.',
                'output' => Artisan::output()
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Seeding failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get the last 100 lines of the system log.
     */
    public function logs()
    {
        try {
            $logPath = storage_path('logs/laravel.log');
            if (!file_exists($logPath)) {
                return response()->json(['message' => 'Log file not found.'], 404);
            }
            
            $file = file($logPath);
            $lines = array_slice($file, -100);
            return response()->json([
                'logs' => implode("", $lines)
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to read logs: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Helper to check if public path exists.
     */
    private function public_exists($path)
    {
        return file_exists(public_path($path));
    }
}

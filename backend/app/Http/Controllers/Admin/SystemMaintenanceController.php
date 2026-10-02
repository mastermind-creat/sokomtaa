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
            
            // If it's a symlink, remove it. If it's a directory, don't delete it automatically!
            if (is_link($link)) {
                unlink($link);
            } elseif (file_exists($link) && is_dir($link)) {
                // If it's a directory, we can't just delete it in production safely
                return response()->json([
                    'message' => 'The [public/storage] path exists as a directory. Please remove it manually to create a symlink.',
                    'hint' => 'Check if you have actual files in public/storage before deleting.'
                ], 422);
            }

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
                return response()->json(['message' => 'Log file not found.', 'logs' => 'No logs yet.'], 404);
            }

            // More robust tail implementation for large files
            $lines = 100;
            $data = [];
            $fp = fopen($logPath, 'r');
            fseek($fp, 0, SEEK_END);
            $pos = ftell($fp);
            $buffer = "";
            
            while ($pos > 0 && count($data) <= $lines) {
                $readSize = min($pos, 4096);
                $pos -= $readSize;
                fseek($fp, $pos);
                $buffer = fread($fp, $readSize) . $buffer;
                
                $linesArray = explode("\n", $buffer);
                if (count($linesArray) > $lines + 1) {
                    $data = array_slice($linesArray, -$lines);
                    break;
                }
            }
            
            if (empty($data)) {
                $data = explode("\n", $buffer);
                $data = array_slice($data, -$lines);
            }
            
            fclose($fp);

            $content = implode("\n", $data);
            
            // Ensure UTF-8 validity for JSON response
            $content = mb_convert_encoding($content, 'UTF-8', 'UTF-8');

            return response()->json([
                'message' => 'Logs retrieved successfully',
                'logs' => $content ?: 'Log file is empty.'
            ]);
        } catch (\Exception $e) {
            Log::error('Log retrieval failed: ' . $e->getMessage());
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

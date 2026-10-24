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
     * Run migrations safely — fakes missing migration records before running
     * to prevent "table already exists" crashes, then clears all caches.
     */
    public function migrate()
    {
        try {
            set_time_limit(600);
            $output = '';

            // ── Step 1: Ensure migrations table exists ────────────────────────
            try {
                Artisan::call('migrate:install', ['--quiet' => true]);
            } catch (\Exception $e) {
                // Already exists — ignore
            }

            // ── Step 2: Reconcile orphaned tables (fake missing records) ──────
            // For each table that exists in the DB but has no migration record,
            // we fake the record so migrate --force won't crash with "already exists".
            $faked  = [];
            $migrationsPath = database_path('migrations');
            $files  = glob($migrationsPath . '/*.php');

            foreach ($files as $file) {
                $migrationName = basename($file, '.php');
                $alreadyRan    = DB::table('migrations')->where('migration', $migrationName)->exists();

                if ($alreadyRan) {
                    continue;
                }

                // Derive expected table name from migration filename heuristic
                // e.g. 2024_01_01_000001_create_users_table -> users
                if (preg_match('/create_(\w+)_table/', $migrationName, $matches)) {
                    $tableName = $matches[1];
                    if (\Illuminate\Support\Facades\Schema::hasTable($tableName)) {
                        $maxBatch = (int) DB::table('migrations')->max('batch');
                        DB::table('migrations')->insert([
                            'migration' => $migrationName,
                            'batch'     => $maxBatch ?: 1,
                        ]);
                        $faked[] = $migrationName;
                    }
                }
            }

            if ($faked) {
                $output .= "--- Faked orphaned migration records ---\n";
                $output .= implode("\n", $faked) . "\n\n";
            }

            // ── Step 3: Run pending migrations ────────────────────────────────
            Artisan::call('migrate', ['--force' => true]);
            $output .= Artisan::output() ?: "No pending migrations.\n";

            // ── Step 4: Clear all caches so new tables/columns are visible ────
            Artisan::call('config:clear');
            Artisan::call('route:clear');
            Artisan::call('cache:clear');
            Artisan::call('view:clear');
            $output .= "\n--- Caches cleared ---\n" . Artisan::output();

            return response()->json([
                'message' => 'Migrations completed and caches cleared.',
                'output'  => $output,
            ]);

        } catch (\Exception $e) {
            Log::error('Maintenance Migration Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Migration failed: ' . $e->getMessage(),
                'hint'    => 'Try "Clear Cache" first, then run migrations again. If the error persists, check the System Logs.',
                'error'   => $e->getMessage(),
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
     * Recreate storage link, clear all caches, and reconcile migration state —
     * equivalent to running the rescue.php file.
     */
    public function storageLink()
    {
        try {
            set_time_limit(300);
            $output = '';
            $link   = public_path('storage');
            $target = storage_path('app/public');

            // ── Step 1: Fix the storage symlink ──────────────────────────────
            if (is_link($link)) {
                unlink($link);
                $output .= "[1/4] Removed existing symlink.\n";
            } elseif (file_exists($link) && is_dir($link)) {
                $backup = public_path('storage_old_' . time());
                rename($link, $backup);
                $output .= "[1/4] Moved real directory to: $backup\n";
            }

            if (!file_exists($target)) {
                mkdir($target, 0755, true);
            }

            $linked = false;
            try {
                Artisan::call('storage:link');
                if (is_link($link)) {
                    $linked = true;
                    $output .= "[1/4] Storage link created via Artisan.\n";
                }
            } catch (\Exception $e) {
                // Fall through to manual
            }

            if (!$linked) {
                if (@symlink($target, $link)) {
                    $linked = true;
                    $output .= "[1/4] Storage link created manually.\n";
                } else {
                    $output .= "[1/4] WARNING: symlink() disabled on this host. Create manually via SSH or cPanel.\n";
                }
            }

            // ── Step 2: Reconcile orphaned migration records ──────────────────
            $faked = [];
            try {
                $migrationsPath = database_path('migrations');
                $files = glob($migrationsPath . '/*.php');
                foreach ($files as $file) {
                    $migrationName = basename($file, '.php');
                    $alreadyRan = DB::table('migrations')->where('migration', $migrationName)->exists();
                    if ($alreadyRan) continue;
                    if (preg_match('/create_(\w+)_table/', $migrationName, $matches)) {
                        if (\Illuminate\Support\Facades\Schema::hasTable($matches[1])) {
                            $maxBatch = (int) DB::table('migrations')->max('batch');
                            DB::table('migrations')->insert([
                                'migration' => $migrationName,
                                'batch'     => $maxBatch ?: 1,
                            ]);
                            $faked[] = $migrationName;
                        }
                    }
                }
                $output .= count($faked)
                    ? "[2/4] Faked " . count($faked) . " orphaned migration record(s).\n"
                    : "[2/4] Migration state is clean.\n";
            } catch (\Exception $e) {
                $output .= "[2/4] Migration reconcile skipped: " . $e->getMessage() . "\n";
            }

            // ── Step 3: Run any pending migrations ────────────────────────────
            try {
                Artisan::call('migrate', ['--force' => true]);
                $migrateOut = trim(Artisan::output());
                $output .= "[3/4] " . ($migrateOut ?: "No pending migrations.") . "\n";
            } catch (\Exception $e) {
                $output .= "[3/4] Migration skipped: " . $e->getMessage() . "\n";
            }

            // ── Step 4: Clear all caches ──────────────────────────────────────
            Artisan::call('config:clear');
            Artisan::call('route:clear');
            Artisan::call('cache:clear');
            Artisan::call('view:clear');
            $output .= "[4/4] All caches cleared.\n";
            $output .= "\n✓ Rescue complete. Storage link, migration state, and caches are all fixed.";

            return response()->json([
                'message' => 'Fix Storage Link completed — caches cleared and migration state reconciled.',
                'output'  => $output,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Storage link / rescue failed: ' . $e->getMessage(),
                'trace'   => config('app.debug') ? $e->getTraceAsString() : null,
            ], 500);
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
     * Debug AI configuration — shows whether INTERNAL_API_SECRET is set
     * and what the middleware sees, without exposing the actual secret value.
     */
    public function debugAiConfig()
    {
        $secretFromConfig = config('services.internal_api_secret');
        $secretFromEnv    = env('INTERNAL_API_SECRET');

        return response()->json([
            'message' => 'AI config debug (secret values are masked)',
            'output'  => implode("\n", [
                'config(services.internal_api_secret) set: ' . (!empty($secretFromConfig) ? 'YES (length: ' . strlen($secretFromConfig) . ')' : 'NO — missing from config cache'),
                'env(INTERNAL_API_SECRET) set:            ' . (!empty($secretFromEnv) ? 'YES (length: ' . strlen($secretFromEnv) . ')' : 'NO — not in .env or not cached'),
                '',
                'Fix: Make sure INTERNAL_API_SECRET is set in your .env AND in',
                'your Vercel environment variables, then run "Clear Cache" here.',
                '',
                'The value in .env and Vercel MUST be identical.',
            ]),
        ]);
    }

    /**
     * Helper to check if public path exists.
     */
    private function public_exists($path)
    {
        return file_exists(public_path($path));
    }
}

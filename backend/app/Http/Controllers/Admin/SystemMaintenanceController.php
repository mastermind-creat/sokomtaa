<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class SystemMaintenanceController extends Controller
{
    /**
     * Resolve the correct PHP binary and artisan path for this environment.
     * On production (Truehost): php at /usr/bin/php, artisan at the Laravel root.
     * On local (XAMPP): php is on PATH.
     */
    private function artisanCmd(string $command): string
    {
        $artisan = base_path('artisan');
        $php     = PHP_BINARY;      // Always use the same PHP that's running this request
        return escapeshellarg($php) . ' ' . escapeshellarg($artisan) . ' ' . $command . ' 2>&1';
    }

    private function runArtisan(string $command): string
    {
        $cmd    = $this->artisanCmd($command);
        $output = [];
        $code   = 0;
        exec($cmd, $output, $code);
        $result = implode("\n", $output);
        return $result ?: "(no output)";
    }

    /**
     * Get system status and environment info.
     */
    public function status()
    {
        return response()->json([
            'php_version'         => PHP_VERSION,
            'laravel_version'     => app()->version(),
            'environment'         => app()->environment(),
            'db_connection'       => config('database.default'),
            'cache_driver'        => config('cache.default'),
            'storage_link_exists' => file_exists(public_path('storage')),
            'last_migration'      => $this->getLastMigration(),
            'php_binary'          => PHP_BINARY,
            'artisan_path'        => base_path('artisan'),
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
     * Run migrations safely:
     * 1. Reconcile orphaned tables (insert missing migration records so
     *    "table already exists" errors cannot occur)
     * 2. Run migrate --force via shell using the same PHP binary as this request
     * 3. Clear all caches
     */
    public function migrate()
    {
        try {
            set_time_limit(600);
            $output = '';

            // ── Step 1: Ensure migrations table exists ────────────────────────
            try {
                Artisan::call('migrate:install');
            } catch (\Exception $e) {
                // Already exists — fine
            }

            // ── Step 2: Reconcile orphaned tables ────────────────────────────
            // If a table already exists in the DB but has no entry in the
            // migrations table, insert the record so migrate --force won't crash.
            $reconciled = $this->reconcileMigrations();
            if ($reconciled) {
                $output .= "Reconciled orphaned migration records:\n";
                $output .= implode("\n", $reconciled) . "\n\n";
            } else {
                $output .= "Migration records are in sync — nothing to reconcile.\n\n";
            }

            // ── Step 3: Run pending migrations via shell ──────────────────────
            $output .= "Running migrations...\n";
            $output .= $this->runArtisan('migrate --force') . "\n";

            // ── Step 4: Clear all caches ──────────────────────────────────────
            $output .= "\nClearing caches...\n";
            $output .= $this->runArtisan('config:clear') . "\n";
            $output .= $this->runArtisan('route:clear') . "\n";
            $output .= $this->runArtisan('cache:clear') . "\n";
            $output .= $this->runArtisan('view:clear') . "\n";
            $output .= "\n✓ Migrations complete and all caches cleared.";

            return response()->json([
                'message' => 'Migrations completed and caches cleared.',
                'output'  => $output,
            ]);

        } catch (\Exception $e) {
            Log::error('Maintenance Migration Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Migration failed: ' . $e->getMessage(),
                'hint'    => 'Try "Clear Cache" first, then run migrations again.',
            ], 500);
        }
    }

    /**
     * Clear all caches via shell using the correct PHP binary.
     */
    public function clearCache()
    {
        try {
            set_time_limit(300);
            $output  = $this->runArtisan('cache:clear') . "\n";
            $output .= $this->runArtisan('config:clear') . "\n";
            $output .= $this->runArtisan('route:clear') . "\n";
            $output .= $this->runArtisan('view:clear') . "\n";
            $output .= "\n✓ All caches cleared.";

            return response()->json([
                'message' => 'All caches cleared successfully.',
                'output'  => $output,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Cache clear failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Optimize the application via shell.
     */
    public function optimize()
    {
        try {
            set_time_limit(300);
            $output = $this->runArtisan('config:cache') . "\n";
            $output .= $this->runArtisan('route:cache') . "\n";
            $output .= "\n✓ Application optimized.";

            return response()->json([
                'message' => 'Application optimized successfully.',
                'output'  => $output,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Optimization failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Full rescue sequence (equivalent to running rescue.php):
     * 1. Fix storage symlink
     * 2. Reconcile orphaned migration records
     * 3. Run pending migrations
     * 4. Clear all caches
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
                $output .= "[1/4] Removed stale symlink.\n";
            } elseif (file_exists($link) && is_dir($link)) {
                $backup = public_path('storage_old_' . time());
                rename($link, $backup);
                $output .= "[1/4] Moved real directory to backup: $backup\n";
            }

            if (!file_exists($target)) {
                mkdir($target, 0755, true);
            }

            // Try via shell artisan first (most reliable on shared hosting)
            $linkOut = $this->runArtisan('storage:link --force');
            if (is_link($link)) {
                $output .= "[1/4] Storage symlink created. $linkOut\n";
            } elseif (@symlink($target, $link)) {
                $output .= "[1/4] Storage symlink created (manual fallback).\n";
            } else {
                $output .= "[1/4] WARNING: Could not create symlink — symlink() may be disabled. Create it via SSH:\n";
                $output .= "      ln -s $target $link\n";
            }

            // ── Step 2: Reconcile orphaned migration records ──────────────────
            $reconciled = $this->reconcileMigrations();
            if ($reconciled) {
                $output .= "[2/4] Reconciled " . count($reconciled) . " orphaned migration record(s):\n";
                $output .= implode("\n", $reconciled) . "\n";
            } else {
                $output .= "[2/4] Migration records are in sync.\n";
            }

            // ── Step 3: Run pending migrations ────────────────────────────────
            $migrateOut = $this->runArtisan('migrate --force');
            $output .= "[3/4] " . $migrateOut . "\n";

            // ── Step 4: Clear all caches ──────────────────────────────────────
            $output .= "[4/4] Clearing all caches...\n";
            $output .= $this->runArtisan('config:clear') . "\n";
            $output .= $this->runArtisan('route:clear') . "\n";
            $output .= $this->runArtisan('cache:clear') . "\n";
            $output .= $this->runArtisan('view:clear') . "\n";
            $output .= "\n✓ Rescue complete — storage, migrations, and caches all fixed.";

            return response()->json([
                'message' => 'Full rescue completed successfully.',
                'output'  => $output,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Rescue failed: ' . $e->getMessage(),
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
            $output = $this->runArtisan('db:seed --force');
            return response()->json([
                'message' => 'Database seeding completed.',
                'output'  => $output,
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

            $lines  = 100;
            $data   = [];
            $fp     = fopen($logPath, 'r');
            fseek($fp, 0, SEEK_END);
            $pos    = ftell($fp);
            $buffer = '';

            while ($pos > 0 && count($data) <= $lines) {
                $readSize = min($pos, 4096);
                $pos     -= $readSize;
                fseek($fp, $pos);
                $buffer    = fread($fp, $readSize) . $buffer;
                $linesArray = explode("\n", $buffer);
                if (count($linesArray) > $lines + 1) {
                    $data = array_slice($linesArray, -$lines);
                    break;
                }
            }

            if (empty($data)) {
                $data = array_slice(explode("\n", $buffer), -$lines);
            }

            fclose($fp);

            $content = mb_convert_encoding(implode("\n", $data), 'UTF-8', 'UTF-8');

            return response()->json([
                'message' => 'Logs retrieved successfully',
                'logs'    => $content ?: 'Log file is empty.',
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to read logs: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Debug AI configuration — shows whether INTERNAL_API_SECRET is correctly
     * loaded without exposing the actual value.
     */
    public function debugAiConfig()
    {
        $fromConfig = config('services.internal_api_secret');
        $fromEnv    = env('INTERNAL_API_SECRET');

        $lines = [
            'PHP binary:                              ' . PHP_BINARY,
            'Artisan path:                            ' . base_path('artisan'),
            '',
            'config(services.internal_api_secret):   ' . (!empty($fromConfig) ? 'SET (length: ' . strlen($fromConfig) . ')' : 'MISSING — run Clear Cache after adding to .env'),
            'env(INTERNAL_API_SECRET):               ' . (!empty($fromEnv)    ? 'SET (length: ' . strlen($fromEnv)    . ')' : 'MISSING — not in .env'),
            '',
            'Action required if missing:',
            '  1. Add INTERNAL_API_SECRET=<value> to your server .env',
            '  2. Add the same value to Vercel environment variables',
            '  3. Click "Clear Cache" on this page',
            '  4. Redeploy on Vercel',
        ];

        return response()->json([
            'message' => 'AI config diagnostics',
            'output'  => implode("\n", $lines),
        ]);
    }

    /**
     * Scan all migration files and insert a record for any that are missing
     * from the migrations table but whose target table already exists in the DB.
     * This prevents "table already exists" errors when running migrate --force.
     *
     * @return array List of migration names that were reconciled.
     */
    private function reconcileMigrations(): array
    {
        $reconciled     = [];
        $migrationsPath = database_path('migrations');
        $files          = glob($migrationsPath . '/*.php') ?: [];

        foreach ($files as $file) {
            $migrationName = basename($file, '.php');

            // Skip if already recorded
            if (DB::table('migrations')->where('migration', $migrationName)->exists()) {
                continue;
            }

            // Derive table name from filename: create_<table>_table pattern
            if (!preg_match('/create_(\w+)_table/', $migrationName, $matches)) {
                continue;
            }

            $tableName = $matches[1];

            // Only reconcile if the table genuinely exists (no false positives)
            if (!Schema::hasTable($tableName)) {
                continue;
            }

            $maxBatch = (int) DB::table('migrations')->max('batch');
            DB::table('migrations')->insert([
                'migration' => $migrationName,
                'batch'     => $maxBatch ?: 1,
            ]);
            $reconciled[] = $migrationName;
        }

        return $reconciled;
    }
}

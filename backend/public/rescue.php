<?php
/**
 * Soko Mtaa - Emergency Backend Rescue Script
 * This script fixes common production issues:
 * 1. Missing migration records (wallet_transactions)
 * 2. Broken storage symlinks
 * 3. Cache corruption
 */

define('LARAVEL_START', microtime(true));

// 1. Load Laravel Environment
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

header('Content-Type: text/plain');
echo "Soko Mtaa Rescue Operation Started...\n";
echo "------------------------------------\n";

try {
    // 2. Fix Database Migration State
    echo "[1/4] Checking Database Migration State...\n";
    $tableExists = Illuminate\Support\Facades\Schema::hasTable('wallet_transactions');
    $migrationExists = Illuminate\Support\Facades\DB::table('migrations')
        ->where('migration', '2026_04_14_075938_create_wallet_transactions_table')
        ->exists();

    if ($tableExists && !$migrationExists) {
        echo "Found orphaned 'wallet_transactions' table. Faking migration record...\n";
        Illuminate\Support\Facades\DB::table('migrations')->insert([
            'migration' => '2026_04_14_075938_create_wallet_transactions_table',
            'batch' => 1
        ]);
        echo "SUCCESS: Migration record added.\n";
    } else {
        echo "Migration state for 'wallet_transactions' is correct.\n";
    }

    // 3. Fix Storage Link
    echo "[2/4] Verifying Storage Link...\n";
    $link = public_path('storage');
    if (is_link($link)) {
        echo "Existing symlink found. Recreating to be safe...\n";
        unlink($link);
    } elseif (file_exists($link) && is_dir($link)) {
        echo "WARNING: 'public/storage' is a real directory. Moving to 'public/storage_old'...\n";
        rename($link, public_path('storage_old_' . time()));
    }
    
    Illuminate\Support\Facades\Artisan::call('storage:link');
    echo "SUCCESS: Storage link recreated.\n";

    // 4. Clear and Rebuild Cache
    echo "[3/4] Clearing Application Cache...\n";
    Illuminate\Support\Facades\Artisan::call('config:clear');
    Illuminate\Support\Facades\Artisan::call('route:clear');
    Illuminate\Support\Facades\Artisan::call('cache:clear');
    Illuminate\Support\Facades\Artisan::call('view:clear');
    echo "SUCCESS: All caches cleared.\n";

    // 5. Run Remaining Migrations
    echo "[4/4] Running Pending Migrations...\n";
    Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
    echo "Artisan Output: " . Illuminate\Support\Facades\Artisan::output() . "\n";
    echo "SUCCESS: Migrations updated.\n";

    echo "------------------------------------\n";
    echo "RESCUE COMPLETE! Please refresh your browser.\n";
    echo "Don't forget to delete this file for security: public/rescue.php\n";

} catch (\Exception $e) {
    echo "FATAL ERROR during rescue: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}

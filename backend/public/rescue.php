<?php
/**
 * SOKO MTAA RESCUE SCRIPT
 * Purpose: Fix migrations and show logs when the app is crashing.
 */

define('LARAVEL_START', microtime(true));

// 1. Boot Laravel
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';

// We need to use the Console kernel to run Artisan commands
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

echo "<html><head><title>Soko Mtaa Rescue</title><style>body{font-family:sans-serif;padding:20px;line-height:1.5;} pre{background:#f4f4f4;padding:15px;border:1px solid #ddd;overflow-x:auto;white-space:pre-wrap;} .error{color:red;border-color:red;}</style></head><body>";
echo "<h1>Soko Mtaa Rescue System</h1>";

try {
    echo "<h3>1. Clearing Caches...</h3>";
    $kernel->call('config:clear');
    $kernel->call('route:clear');
    $kernel->call('cache:clear');
    echo "<pre>" . $kernel->output() . "</pre>";

    echo "<h3>2. Running Pending Migrations...</h3>";
    // We use --force because it's production
    $kernel->call('migrate', ['--force' => true]);
    echo "<pre>" . $kernel->output() . "</pre>";

    echo "<h3>3. Last 50 Lines of Production Log:</h3>";
    $logPath = storage_path('logs/laravel.log');
    if (file_exists($logPath)) {
        // Use PHP to read the last 50 lines safely
        $file = file($logPath);
        $lines = array_slice($file, -50);
        echo "<pre>" . htmlspecialchars(implode("", $lines)) . "</pre>";
    } else {
        echo "<p>Log file not found at: $logPath</p>";
    }

} catch (\Exception $e) {
    echo "<div class='error'>";
    echo "<h4>FATAL ERROR DURING RESCUE:</h4>";
    echo "<pre>" . $e->getMessage() . "</pre>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
    echo "</div>";
}

echo "<hr><p><strong>IMPORTANT:</strong> Delete this file (<code>public/rescue.php</code>) immediately after use for security!</p>";
echo "</body></html>";

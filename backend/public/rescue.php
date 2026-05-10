<?php
define('LARAVEL_START', microtime(true));

// This script forces a cache clear and migration if the app is stuck in a 500 loop.
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

// Force the cache driver to 'file' before booting to bypass DB permission issues
putenv('CACHE_STORE=file');
putenv('CACHE_DRIVER=file');

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

echo "<h1>Soko Mtaa Rescue System</h1>";

try {
    echo "Clearing Config Cache... ";
    Artisan::call('config:clear');
    echo "DONE<br>";

    echo "Clearing Route Cache... ";
    Artisan::call('route:clear');
    echo "DONE<br>";

    echo "Clearing Application Cache... ";
    Artisan::call('cache:clear');
    echo "DONE<br>";

    echo "Running Migrations... ";
    Artisan::call('migrate', ['--force' => true]);
    echo "DONE<br>";

    echo "<h2 style='color:green'>System Rescued! Try logging in now.</h2>";
    echo "<p>Please delete this file (public/rescue.php) for security once done.</p>";

} catch (\Exception $e) {
    echo "<h2 style='color:red'>Rescue Failed</h2>";
    echo "<pre>" . $e->getMessage() . "</pre>";
}

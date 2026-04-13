<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Trader\TraderProfileController;
use App\Http\Controllers\Trader\ProductController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/verify-phone', [AuthController::class, 'verifyPhone']);
    });
});

Route::get('/categories', function () {
    return response()->json([
        'success' => true, 
        'data' => \App\Models\Category::all()
    ]);
});

// Market Discovery (Resident Focused)
Route::prefix('markets')->group(function () {
    Route::get('/', [\App\Http\Controllers\Resident\MarketController::class, 'index']);
    Route::get('/{market}', [\App\Http\Controllers\Resident\MarketController::class, 'show']);
});

// Global Search & Recommendations (Resident Focused)
Route::get('/search', [\App\Http\Controllers\SearchController::class, 'index']);
Route::get('/recommendations', [\App\Http\Controllers\SearchController::class, 'recommendations']);

// Trader Discovery (Resident Focused)
Route::prefix('traders')->group(function () {
    Route::get('/search', [\App\Http\Controllers\Resident\TraderController::class, 'search']);
    Route::get('/{trader}', [\App\Http\Controllers\Resident\TraderController::class, 'show']);
});

// M-Pesa Public Callback
Route::post('/payments/mpesa/callback', [\App\Http\Controllers\Payment\MpesaController::class, 'callback']);

Route::middleware(['auth:sanctum'])->group(function () {
    // Trader Profile (Accessible by any role to allow "Setup" or "Me")
    Route::prefix('trader')->group(function () {
        Route::post('/setup', [TraderProfileController::class, 'setup']);
        Route::get('/me', [TraderProfileController::class, 'me']);
        Route::put('/update', [TraderProfileController::class, 'update']);
    });

    // Reservations (Resident/Trader)
    Route::prefix('reservations')->group(function () {
        Route::get('/', [\App\Http\Controllers\Resident\ReservationController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Resident\ReservationController::class, 'store']);
        Route::get('/{reservation}', [\App\Http\Controllers\Resident\ReservationController::class, 'show']);
        Route::patch('/{id}/status', [\App\Http\Controllers\Resident\ReservationController::class, 'updateStatus']);
    });

    // M-Pesa Payment Initiation
    Route::prefix('payments/mpesa')->group(function () {
        Route::post('/stkpush', [\App\Http\Controllers\Payment\MpesaController::class, 'initiateSTK']);
    });

    // Market Fees (Traders Only)
    Route::middleware(['role:trader'])->prefix('fees')->group(function () {
        Route::get('/', [\App\Http\Controllers\Payment\FeeController::class, 'index']);
        Route::get('/summary', [\App\Http\Controllers\Payment\FeeController::class, 'summary']);
    });

    // Trader Analytics (Backend)
    Route::middleware(['role:trader'])->prefix('analytics')->group(function () {
        Route::get('/stats', [\App\Http\Controllers\Trader\TraderAnalyticsController::class, 'dashboardStats']);
        Route::get('/revenue', [\App\Http\Controllers\Trader\TraderAnalyticsController::class, 'revenueTrends']);
        Route::get('/top-products', [\App\Http\Controllers\Trader\TraderAnalyticsController::class, 'topProducts']);
        Route::get('/price-insights', [\App\Http\Controllers\Trader\TraderAnalyticsController::class, 'priceInsights']);
    });

    // Products (Strictly for Traders)
    Route::middleware(['role:trader'])->prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'index']);
        Route::post('/', [ProductController::class, 'store']);
        Route::put('/{product}', [ProductController::class, 'update']);
        Route::delete('/{product}', [ProductController::class, 'destroy']);
        Route::patch('/{product}/status', [ProductController::class, 'toggleStatus']);
    });

    // Notifications
    Route::prefix('notifications')->group(function () {
        Route::get('/', [\App\Http\Controllers\NotificationController::class, 'index']);
        Route::get('/unread-count', [\App\Http\Controllers\NotificationController::class, 'unreadCount']);
        Route::patch('/{id}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead']);
        Route::post('/read-all', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead']);
    });

    // Complaints
    Route::prefix('complaints')->group(function () {
        Route::get('/', [\App\Http\Controllers\ComplaintController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\ComplaintController::class, 'store']);
        Route::patch('/{id}/resolve', [\App\Http\Controllers\ComplaintController::class, 'resolve']); // Admin can resolve
    });

    // Notice Board
    Route::prefix('notices')->group(function () {
        Route::get('/', [\App\Http\Controllers\NoticeController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\NoticeController::class, 'store']); // Admin can post
        Route::delete('/{id}', [\App\Http\Controllers\NoticeController::class, 'destroy']); // Admin can delete
    });

    // Admin Specific Dashboard
    Route::middleware(['role:admin'])->prefix('admin')->group(function () {
        Route::get('/stats', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'stats']);
        Route::get('/trends', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'revenueTrends']);
    });
});

Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});

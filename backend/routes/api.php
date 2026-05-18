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

use App\Http\Controllers\Public\GlobalStatsController;

Route::get('/stats', [GlobalStatsController::class, 'index']);
Route::get('/traders/featured', [GlobalStatsController::class, 'featuredTraders']);

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login'])->name('login');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/verify-phone', [AuthController::class, 'verifyPhone']);
        Route::post('/resend-otp', [AuthController::class, 'resendOtp']);
    });
});

use App\Http\Controllers\CategoryController;

// ... other imports

Route::get('/categories', [CategoryController::class, 'index']);
Route::post('/categories', [CategoryController::class, 'store'])->middleware('auth:sanctum');

// Market Discovery (Public)
Route::prefix('markets')->group(function () {
    Route::get('/', [\App\Http\Controllers\Resident\MarketController::class, 'index']);
    Route::get('/nearby', [\App\Http\Controllers\Resident\MarketController::class, 'nearby']);
    Route::get('/{market}', [\App\Http\Controllers\Resident\MarketController::class, 'show']);
    Route::get('/{market}/compare', [\App\Http\Controllers\Resident\MarketController::class, 'compare']);
});

// Location Discovery (Public)
Route::get('/regions', [\App\Http\Controllers\Public\LocationController::class, 'regions']);
Route::get('/centers', [\App\Http\Controllers\Public\LocationController::class, 'centers']);

// Global Search & Recommendations (Public)
Route::get('/search', [\App\Http\Controllers\SearchController::class, 'index']);
Route::get('/recommendations', [\App\Http\Controllers\SearchController::class, 'recommendations']);

// Geographic Map Discovery
Route::get('/map/discover', [\App\Http\Controllers\Public\MapController::class, 'discover']);
Route::get('/map/nearby',   [\App\Http\Controllers\Public\MapController::class, 'nearby']);

// Trader Discovery (Public)
Route::prefix('traders')->group(function () {
    Route::get('/nearby', [\App\Http\Controllers\Resident\TraderController::class, 'nearby']);
    Route::get('/search', [\App\Http\Controllers\Resident\TraderController::class, 'search']);
    Route::get('/{trader}', [\App\Http\Controllers\Resident\TraderController::class, 'show']);
    Route::get('/{trader}/products', [\App\Http\Controllers\Resident\TraderController::class, 'products']);
    Route::get('/{trader}/reviews', [\App\Http\Controllers\Resident\TraderController::class, 'reviews']);
});

// M-Pesa Public Callbacks
Route::post('/payments/mpesa/callback',        [\App\Http\Controllers\Payment\MpesaController::class, 'callback']);
Route::post('/payments/mpesa/b2c-callback',    [\App\Http\Controllers\Trader\WithdrawalController::class, 'b2cCallback']);

// Public Settings (fee thresholds for checkout UI — no auth required)
Route::get('/settings/public', [\App\Http\Controllers\Admin\AdminSettingController::class, 'publicIndex']);

// ── AUTHENTICATED ROUTES ──────────────────────────────────────────────────────
Route::middleware(['auth:sanctum'])->group(function () {

    // ── Trader Profile (any authenticated user during setup) ─────────────────
    Route::prefix('trader')->group(function () {
        Route::post('/setup', [TraderProfileController::class, 'setup']);
        Route::get('/me', [TraderProfileController::class, 'me']);
        Route::put('/update', [TraderProfileController::class, 'update']);
        Route::post('/avatar', [TraderProfileController::class, 'uploadAvatar']);
        Route::post('/banner', [TraderProfileController::class, 'uploadBanner']);
        Route::post('/kyc', [TraderProfileController::class, 'submitKyc']);
        Route::post('/kyc/update-urls', [TraderProfileController::class, 'updateKycUrls']);
        Route::post('/permit', [TraderProfileController::class, 'uploadPermit']);
        Route::get('/stats', [\App\Http\Controllers\Trader\TraderAnalyticsController::class, 'dashboardStats']);
    });

    // ── Reservations (Resident creates, Trader/Resident views) ───────────────
    Route::prefix('reservations')->group(function () {
        Route::get('/', [\App\Http\Controllers\Resident\ReservationController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Resident\ReservationController::class, 'store']);
        Route::post('/bulk', [\App\Http\Controllers\Resident\ReservationController::class, 'bulkStore']);
        Route::get('/{reservation}', [\App\Http\Controllers\Resident\ReservationController::class, 'show']);
        Route::patch('/{id}/status', [\App\Http\Controllers\Resident\ReservationController::class, 'updateStatus']);
        Route::get('/{reservation}/pickup-code', [\App\Http\Controllers\Resident\ReservationController::class, 'pickupCode']);
        Route::post('/{reservation}/cancel', [\App\Http\Controllers\Resident\ReservationController::class, 'cancel']);
    });

    // ── Watchlist (Resident) ─────────────────────────────────────────────────
    Route::prefix('watchlist')->group(function () {
        Route::get('/', [\App\Http\Controllers\Resident\WatchlistController::class, 'index']);
        Route::post('/{product}', [\App\Http\Controllers\Resident\WatchlistController::class, 'store']);
        Route::delete('/{product}', [\App\Http\Controllers\Resident\WatchlistController::class, 'destroy']);
        Route::patch('/{product}/notify', [\App\Http\Controllers\Resident\WatchlistController::class, 'toggleNotify']);
    });

    Route::middleware(['role:resident'])->prefix('resident')->group(function () {
        Route::get('/dashboard/stats', [\App\Http\Controllers\Resident\ResidentDashboardController::class, 'stats']);
        Route::get('/menu-counts', [\App\Http\Controllers\Resident\ResidentDashboardController::class, 'menuCounts']);
    });

    // ── Resident Reviews (create/list my reviews) ────────────────────────────
    Route::prefix('resident/reviews')->group(function () {
        Route::get('/', [\App\Http\Controllers\Resident\ReviewController::class, 'index']);
        Route::get('/pending', [\App\Http\Controllers\Resident\ReviewController::class, 'pending']);
        Route::post('/', [\App\Http\Controllers\Resident\ReviewController::class, 'store']);
        Route::put('/{review}', [\App\Http\Controllers\Resident\ReviewController::class, 'update']);
    });

    // ── Resident Payments History ────────────────────────────────────────────
    Route::prefix('resident/payments')->group(function () {
        Route::get('/', [\App\Http\Controllers\Resident\PaymentHistoryController::class, 'index']);
        Route::get('/summary', [\App\Http\Controllers\Resident\PaymentHistoryController::class, 'summary']);
    });

    // ── Resident Complaints ──────────────────────────────────────────────────
    Route::prefix('resident/complaints')->group(function () {
        Route::get('/', [\App\Http\Controllers\Resident\ResidentComplaintController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Resident\ResidentComplaintController::class, 'store']);
    });

    // ── Resident Profile & Security ──────────────────────────────────────────
    Route::prefix('profile')->group(function () {
        Route::get('/', [\App\Http\Controllers\Resident\ProfileController::class, 'show']);
        Route::patch('/', [\App\Http\Controllers\Resident\ProfileController::class, 'update']);
        Route::post('/avatar', [\App\Http\Controllers\Resident\ProfileController::class, 'uploadAvatar']);
        Route::post('/password', [\App\Http\Controllers\Resident\ProfileController::class, 'changePassword']);
        Route::delete('/', [\App\Http\Controllers\Resident\ProfileController::class, 'destroy']);

        // Cloudinary Direct Upload Support
        Route::get('/cloudinary/sign', [\App\Http\Controllers\CloudinaryController::class, 'getSignature']);
    });

    // ── M-Pesa Payment Initiation ────────────────────────────────────────────
    Route::prefix('payments/mpesa')->group(function () {
        Route::post('/stkpush', [\App\Http\Controllers\Payment\MpesaController::class, 'initiateSTK']);
        Route::get('/status/{checkoutRequestId}', [\App\Http\Controllers\Payment\MpesaController::class, 'checkStatus']);
        Route::post('/simulate-success/{checkoutRequestId}', [\App\Http\Controllers\Payment\MpesaController::class, 'simulateSuccess']);
    });

    // ── Market Fees & Wallet (Traders Only) ──────────────────────────────────
    Route::middleware(['role:trader'])->group(function () {
        Route::prefix('trader/wallet')->group(function () {
            Route::get('/',              [\App\Http\Controllers\Trader\WalletController::class,    'index']);
            Route::get('/transactions',  [\App\Http\Controllers\Trader\WalletController::class,    'transactions']);
            Route::post('/frequency',    [\App\Http\Controllers\Trader\WalletController::class,    'updateFrequency']);
            Route::get('/withdrawals',   [\App\Http\Controllers\Trader\WithdrawalController::class, 'history']);
            Route::post('/withdraw',     [\App\Http\Controllers\Trader\WithdrawalController::class, 'requestWithdrawal']);
        });

        Route::prefix('fees')->group(function () {
            Route::get('/',        [\App\Http\Controllers\Payment\FeeController::class, 'index']);
            Route::get('/summary', [\App\Http\Controllers\Payment\FeeController::class, 'summary']);
        });
    });

    // ── Trader Analytics ─────────────────────────────────────────────────────
    Route::middleware(['role:trader'])->prefix('trader/analytics')->group(function () {
        Route::get('/stats', [\App\Http\Controllers\Trader\TraderAnalyticsController::class, 'dashboardStats']);
        Route::get('/menu-counts', [\App\Http\Controllers\Trader\TraderAnalyticsController::class, 'menuCounts']);
        Route::get('/revenue', [\App\Http\Controllers\Trader\TraderAnalyticsController::class, 'revenueTrends']);
        Route::get('/top-products', [\App\Http\Controllers\Trader\TraderAnalyticsController::class, 'topProducts']);
        Route::get('/price-insights', [\App\Http\Controllers\Trader\TraderAnalyticsController::class, 'priceInsights']);
    });

    // ── TRADER-ONLY ROUTES (Phase 1) ─────────────────────────────────────────
    Route::middleware(['role:trader'])->group(function () {

        // Trader Reservation Management
        Route::prefix('trader/reservations')->group(function () {
            Route::get('/', [\App\Http\Controllers\Trader\TraderReservationController::class, 'index']);
            Route::get('/stats', [\App\Http\Controllers\Trader\TraderReservationController::class, 'stats']);
            Route::get('/recent', [\App\Http\Controllers\Trader\TraderReservationController::class, 'recent']);
        });

        // Trader Reviews Received
        Route::prefix('trader/reviews')->group(function () {
            Route::get('/', [\App\Http\Controllers\Trader\TraderReviewController::class, 'index']);
            Route::get('/summary', [\App\Http\Controllers\Trader\TraderReviewController::class, 'summary']);
        });

        // Trader Complaints (against + filed by)
        Route::prefix('trader/complaints')->group(function () {
            Route::get('/', [\App\Http\Controllers\Trader\TraderComplaintController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\Trader\TraderComplaintController::class, 'store']);
        });

        // Trader Settings (notifications, privacy, language)
        Route::prefix('trader/settings')->group(function () {
            Route::get('/', [\App\Http\Controllers\Trader\TraderSettingsController::class, 'show']);
            Route::put('/', [\App\Http\Controllers\Trader\TraderSettingsController::class, 'update']);
        });

        // Stall Application
        Route::prefix('trader/stall-application')->group(function () {
            Route::get('/', [\App\Http\Controllers\Trader\TraderStallApplicationController::class, 'show']);
            Route::post('/', [\App\Http\Controllers\Trader\TraderStallApplicationController::class, 'store']);
            Route::delete('/', [\App\Http\Controllers\Trader\TraderStallApplicationController::class, 'destroy']);
        });

        // Available Stalls (zone picker in apply-stall wizard)
        Route::get('/trader/stalls/available', [\App\Http\Controllers\Trader\TraderStallApplicationController::class, 'availableStalls']);

        // Products CRUD (with single show for edit page)
        Route::prefix('products')->group(function () {
            Route::get('/', [ProductController::class, 'index']);
            Route::get('/{product}', [ProductController::class, 'show']);
            Route::post('/', [ProductController::class, 'store']);
            Route::put('/{product}', [ProductController::class, 'update']);
            Route::delete('/{product}', [ProductController::class, 'destroy']);
            Route::patch('/{product}/status', [ProductController::class, 'toggleStatus']);
        });
    });
    // ─────────────────────────────────────────────────────────────────────────

    Route::middleware(['auth:sanctum'])->group(function () {
        // ── Notifications (all roles) ────────────────────────────────────────────
        Route::prefix('notifications')->group(function () {
            Route::get('/', [\App\Http\Controllers\NotificationController::class, 'index']);
            Route::get('/unread-count', [\App\Http\Controllers\NotificationController::class, 'unreadCount']);
            Route::patch('/{id}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead']);
            Route::post('/read-all', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead']);
        });

        // ── Complaints (general — shared endpoint) ───────────────────────────────
        Route::prefix('complaints')->group(function () {
            Route::get('/', [\App\Http\Controllers\ComplaintController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\ComplaintController::class, 'store']);
            Route::patch('/{id}/resolve', [\App\Http\Controllers\ComplaintController::class, 'resolve']);
        });

        // ── Reports & Receipts ──────────────────────────────────────────────────
        Route::prefix('reports')->group(function () {
            Route::get('/', [\App\Http\Controllers\ReportController::class, 'index']);
            Route::post('/receipt/{reservation}', [\App\Http\Controllers\ReportController::class, 'generateReceipt']);
            Route::post('/activity', [\App\Http\Controllers\ReportController::class, 'generateActivityReport']);
            Route::get('/{report}/download', [\App\Http\Controllers\ReportController::class, 'download']);
            Route::delete('/{report}', [\App\Http\Controllers\ReportController::class, 'destroy']);
        });

        // ── Delivery Rider Routes ───────────────────────────────────────────────
        Route::middleware(['role:delivery'])->prefix('delivery')->group(function () {
            Route::get('/orders', [\App\Http\Controllers\Delivery\DeliveryController::class, 'ordersPool']);
            Route::post('/orders/{reservation}/accept', [\App\Http\Controllers\Delivery\DeliveryController::class, 'acceptOrder']);
            Route::post('/orders/{reservation}/pickup', [\App\Http\Controllers\Delivery\DeliveryController::class, 'pickupOrder']);
            Route::post('/orders/{reservation}/notify-arrival', [\App\Http\Controllers\Delivery\DeliveryController::class, 'notifyArrival']);
            Route::post('/orders/{reservation}/complete', [\App\Http\Controllers\Delivery\DeliveryController::class, 'completeDelivery']);
            Route::get('/stats', [\App\Http\Controllers\Delivery\DeliveryController::class, 'stats']);
            Route::post('/toggle-availability', [\App\Http\Controllers\Delivery\DeliveryController::class, 'toggleAvailability']);
            Route::post('/update-location', [\App\Http\Controllers\Delivery\DeliveryController::class, 'updateLocation']);
        });
    });

    // ── ADMIN ROUTES ─────────────────────────────────────────────────────────
    Route::middleware(['role:admin'])->prefix('admin')->group(function () {
        // Dashboard
        Route::get('/stats', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'stats']);
        Route::get('/menu-counts', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'menuCounts']);
        Route::get('/trends', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'revenueTrends']);
        Route::get('/activity', [\App\Http\Controllers\Admin\AdminActivityController::class, 'index']);

        // System Settings
        Route::prefix('settings')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\AdminSettingController::class, 'index']);
            Route::post('/bulk-update', [\App\Http\Controllers\Admin\AdminSettingController::class, 'updateBulk']);
        });

        // Stalls Management
        Route::get('/stalls', [\App\Http\Controllers\Admin\StallController::class, 'index']);
        Route::get('/stalls/summary', [\App\Http\Controllers\Admin\StallController::class, 'summary']);
        Route::get('/stalls/next-number', [\App\Http\Controllers\Admin\StallController::class, 'getNextNumber']);
        Route::post('/stalls', [\App\Http\Controllers\Admin\StallController::class, 'store']);
        Route::patch('/stalls/{stall}', [\App\Http\Controllers\Admin\StallController::class, 'update']);
        Route::delete('/stalls/{stall}', [\App\Http\Controllers\Admin\StallController::class, 'destroy']);
        Route::delete('/stalls/bulk', [\App\Http\Controllers\Admin\StallController::class, 'bulkDestroy']);
        Route::post('/stalls/bulk', [\App\Http\Controllers\Admin\StallController::class, 'bulkGenerate']);
        Route::post('/stalls/bulk-update-fees', [\App\Http\Controllers\Admin\StallController::class, 'bulkUpdateFees']);
        Route::get('/map-data', [\App\Http\Controllers\Admin\StallMapController::class, 'getMapData']);
        Route::post('/allocations', [\App\Http\Controllers\Admin\StallAllocationController::class, 'store']);

        // Locations (Regions, Counties & Centers)
        Route::apiResource('regions', \App\Http\Controllers\Admin\RegionController::class);
        Route::apiResource('counties', \App\Http\Controllers\Admin\CountyController::class);
        Route::apiResource('centers', \App\Http\Controllers\Admin\CenterController::class);

        // Stall Application Review
        Route::get('/applications', [\App\Http\Controllers\Admin\ApplicationReviewController::class, 'index']);
        Route::get('/applications/stats', [\App\Http\Controllers\Admin\ApplicationReviewController::class, 'stats']);
        Route::post('/applications/{application}/action', [\App\Http\Controllers\Admin\ApplicationReviewController::class, 'action']);

        // Fee & Revenue Management
        Route::prefix('fees')->group(function () {
            Route::get('/stats', [\App\Http\Controllers\Admin\FeeManagementController::class, 'stats']);
            Route::get('/transactions', [\App\Http\Controllers\Admin\FeeManagementController::class, 'transactions']);
            Route::get('/delinquents', [\App\Http\Controllers\Admin\FeeManagementController::class, 'delinquents']);
            Route::post('/update-rate', [\App\Http\Controllers\Admin\FeeManagementController::class, 'updateFee']);
            Route::post('/update-global-rate', [\App\Http\Controllers\Admin\FeeManagementController::class, 'updateGlobalRate']);
        });

        // Traders Management
        Route::get('/traders', [\App\Http\Controllers\Admin\TraderController::class, 'index']);
        Route::post('/traders/{trader}/verify', [\App\Http\Controllers\Admin\TraderController::class, 'verify']);

        // Markets Management
        Route::prefix('markets')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\MarketController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\Admin\MarketController::class, 'store']);
            Route::put('/{market}', [\App\Http\Controllers\Admin\MarketController::class, 'update']);
            Route::delete('/{market}', [\App\Http\Controllers\Admin\MarketController::class, 'destroy']);
            Route::patch('/{market}/toggle', [\App\Http\Controllers\Admin\MarketController::class, 'toggleStatus']);
            Route::post('/{market}/reset-stalls', [\App\Http\Controllers\Admin\MarketController::class, 'resetStalls']);
        });

        // Analytics & Ledgers
        Route::get('/analytics', [\App\Http\Controllers\Admin\AnalyticsController::class, 'getAnalytics']);
        Route::get('/payments', [\App\Http\Controllers\Admin\PaymentController::class, 'index']);
        Route::get('/reviews', [\App\Http\Controllers\Admin\ReviewController::class, 'index']);
        Route::get('/reviews/stats', [\App\Http\Controllers\Admin\ReviewController::class, 'stats']);
        Route::post('/reviews/{id}/toggle-visibility', [\App\Http\Controllers\Admin\ReviewController::class, 'toggleVisibility']);
        Route::delete('/reviews/{id}', [\App\Http\Controllers\Admin\ReviewController::class, 'destroy']);
        Route::get('/reservations', [\App\Http\Controllers\Admin\ReservationController::class, 'index']);
        Route::get('/reservations/stats', [\App\Http\Controllers\Admin\ReservationController::class, 'stats']);
        Route::post('/reservations/propagate-report', [\App\Http\Controllers\Admin\ReservationController::class, 'propagateReport']);
        Route::get('/users', [\App\Http\Controllers\Admin\UserController::class, 'index']);
        Route::post('/users/{user}/sms', [\App\Http\Controllers\Admin\UserController::class, 'sendSms']);
        Route::get('/audit-logs', [\App\Http\Controllers\Admin\AuditLogController::class, 'index']);

        // System Maintenance
        Route::prefix('maintenance')->group(function () {
            Route::get('/status', [\App\Http\Controllers\Admin\SystemMaintenanceController::class, 'status']);
            Route::post('/migrate', [\App\Http\Controllers\Admin\SystemMaintenanceController::class, 'migrate']);
            Route::post('/clear-cache', [\App\Http\Controllers\Admin\SystemMaintenanceController::class, 'clearCache']);
            Route::post('/optimize', [\App\Http\Controllers\Admin\SystemMaintenanceController::class, 'optimize']);
            Route::post('/storage-link', [\App\Http\Controllers\Admin\SystemMaintenanceController::class, 'storageLink']);
            Route::post('/seed', [\App\Http\Controllers\Admin\SystemMaintenanceController::class, 'seed']);
            Route::get('/logs', [\App\Http\Controllers\Admin\SystemMaintenanceController::class, 'logs']);
        });

        // System Settings
        Route::prefix('settings')->group(function () {
            Route::get('/stats', [\App\Http\Controllers\Admin\SystemSettingsController::class, 'stats']);
            Route::post('/security', [\App\Http\Controllers\Admin\SystemSettingsController::class, 'updateSecurity']);
        });
    });
});

Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});

// AI Routes
Route::group(['prefix' => 'ai'], function () {
    Route::get('trends', [\App\Http\Controllers\AiController::class, 'trends']);
    Route::get('suggest-description', [\App\Http\Controllers\AiController::class, 'suggestDescription']);
    
    Route::group(['middleware' => 'auth:sanctum'], function () {
        Route::post('chat', [\App\Http\Controllers\AiController::class, 'chat']);
    });
});

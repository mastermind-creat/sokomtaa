# AGENTS.md — Soko Mtaa: AI Agent Build Instructions

> This file is the single source of truth for any AI agent building the Soko Mtaa platform.
> Read every section before writing a single line of code. Do not skip sections.
> Follow instructions in the exact order given.

---

## 0. PROJECT OVERVIEW

**Soko Mtaa** is a neighbourhood-based digital marketplace connecting informal traders,
local residents, and county administrators within pilot urban/peri-urban markets in Kenya.

**Three user roles:**
- `TRADER` — registers stall, manages products, receives reservations, pays market fees
- `RESIDENT` — discovers traders, reserves items, pays via M-Pesa, leaves reviews
- `ADMIN` — county official managing stalls, traders, reports, complaints, allocations

**Core Modules:**
1. Authentication & Role Management
2. Trader Profiles & Stall Management
3. Product Listings & Stock Management
4. Digital Market Map / Stall Directory
5. Item Reservation System
6. M-Pesa Daraja API Payment Integration
7. Market Fee Collection (Trader → County)
8. County Admin Dashboard & Analytics
9. Trader Analytics Dashboard
10. Notification System (SMS + In-App)
11. Dispute & Complaint Resolution
12. Stall Allocation Workflow
13. Community Notice Board
14. AI-Powered Search & Recommendations
15. Offline / PWA Support

---

## 1. TECH STACK

### Backend
- **Framework:** Laravel 11 (PHP 8.2+)
- **Architecture:** RESTful API (JSON responses only — no Blade views except for emails)
- **Database:** MySQL 8.0+
- **ORM:** Eloquent
- **Auth:** Laravel Sanctum (token-based for SPA)
- **Queue:** Database driver (for shared hosting compatibility)
- **Cache:** File driver (shared hosting) → upgrade to Redis on VPS
- **Storage:** Cloudinary (images/files) via `cloudinary-labs/cloudinary-laravel`
- **Payments:** M-Pesa Daraja API (via Guzzle HTTP client)
- **SMS:** Africa's Talking API
- **Real-time:** Pusher (free tier) for notifications

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** Zustand (lightweight, mobile-friendly)
- **Data Fetching:** TanStack Query (React Query v5)
- **Forms:** React Hook Form + Zod validation
- **Maps:** Leaflet.js (open source, offline-capable)
- **PWA:** next-pwa plugin
- **Animations:** Framer Motion (subtle, performance-conscious)
- **Icons:** Lucide React

### Infrastructure
- **Backend Hosting:** Truehost Shared Hosting (pilot) → VPS (scale)
- **Frontend Hosting:** Vercel (free tier)
- **Media Storage:** Cloudinary
- **Database Backups:** Automated via cPanel cron (pilot)

---

## 2. DESIGN SYSTEM & MOBILE-FIRST RULES

> Soko Mtaa's primary users are traders on cheap Android phones in noisy, bright market
> stalls. Every UI decision must reflect this reality.

### Color Palette (CSS Variables)
```css
:root {
  --color-primary: #1B6B3A;        /* Deep market green */
  --color-primary-light: #2D9653;  /* Active/hover green */
  --color-accent: #F5A623;         /* Warm amber — M-Pesa feel */
  --color-accent-dark: #D4891A;    /* Accent hover */
  --color-surface: #FAFAF8;        /* Warm off-white background */
  --color-surface-card: #FFFFFF;
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #6B7280;
  --color-text-muted: #9CA3AF;
  --color-border: #E5E7EB;
  --color-success: #16A34A;
  --color-warning: #D97706;
  --color-error: #DC2626;
  --color-info: #2563EB;
}
```

### Typography
- **Display/Headings:** `Plus Jakarta Sans` (Google Fonts) — bold, modern, African tech feel
- **Body:** `Inter` — clean, highly legible on small screens
- **Monospace (prices, codes):** `JetBrains Mono`

### Mobile-First Rules (ENFORCE STRICTLY)
1. **Minimum tap target: 48x48px** — every button, link, icon must meet this
2. **Font sizes:** minimum 16px for body text (prevents iOS zoom on input focus)
3. **No hover-only interactions** — all hover states must have equivalent touch states
4. **Bottom navigation** on mobile for primary actions (not hamburger menus)
5. **Sticky action buttons** at bottom of screen for key CTAs (Reserve, Pay, Submit)
6. **Skeleton loaders** instead of spinners — better perceived performance on slow connections
7. **Images:** lazy loaded, WebP format via Cloudinary transformations, max width 800px
8. **Forms:** one field visible at a time on mobile where possible (wizard/step pattern)
9. **Swahili as default language** with English toggle
10. **High contrast mode** for outdoor/bright sunlight readability
11. **Input fields:** large, full-width, with clear labels above (not placeholder-only)
12. **Error messages:** always shown inline, in red, with actionable text
13. **Offline indicator:** persistent banner when connection drops
14. **No infinite scroll** — use paginated "Load More" buttons (better for slow connections)

### Component Rules
- All cards have `min-height: 0` and must not overflow on small screens
- All modals are bottom sheets on mobile (`position: fixed; bottom: 0`)
- Tables are never used for mobile views — use card lists instead
- All data tables on admin dashboard are horizontally scrollable with sticky first column

---

## 3. FOLDER STRUCTURE

### Laravel Backend (`/backend`)
```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/
│   │   │   │   ├── AuthController.php
│   │   │   │   └── VerificationController.php
│   │   │   ├── Trader/
│   │   │   │   ├── TraderProfileController.php
│   │   │   │   ├── ProductController.php
│   │   │   │   └── TraderAnalyticsController.php
│   │   │   ├── Resident/
│   │   │   │   ├── ReservationController.php
│   │   │   │   └── ReviewController.php
│   │   │   ├── Admin/
│   │   │   │   ├── StallController.php
│   │   │   │   ├── AllocationController.php
│   │   │   │   ├── AdminDashboardController.php
│   │   │   │   └── ReportController.php
│   │   │   ├── Payment/
│   │   │   │   ├── MpesaController.php
│   │   │   │   └── FeeController.php
│   │   │   ├── ComplaintController.php
│   │   │   ├── NoticeController.php
│   │   │   └── SearchController.php
│   │   ├── Middleware/
│   │   │   ├── RoleMiddleware.php
│   │   │   ├── EnsureTraderVerified.php
│   │   │   └── LocaleMiddleware.php
│   │   └── Requests/
│   │       ├── Auth/
│   │       ├── Trader/
│   │       ├── Reservation/
│   │       └── Payment/
│   ├── Models/
│   │   ├── User.php
│   │   ├── Trader.php
│   │   ├── Stall.php
│   │   ├── Product.php
│   │   ├── Category.php
│   │   ├── Reservation.php
│   │   ├── Payment.php
│   │   ├── MarketFee.php
│   │   ├── Review.php
│   │   ├── Complaint.php
│   │   ├── Allocation.php
│   │   ├── Notice.php
│   │   ├── Market.php
│   │   └── Notification.php
│   ├── Services/
│   │   ├── MpesaService.php
│   │   ├── AfricasTalkingService.php
│   │   ├── CloudinaryService.php
│   │   ├── ReservationService.php
│   │   ├── FeeCalculationService.php
│   │   ├── SearchService.php
│   │   └── NotificationService.php
│   ├── Jobs/
│   │   ├── SendSmsNotification.php
│   │   ├── ProcessMpesaCallback.php
│   │   └── SendReservationReminder.php
│   └── Policies/
│       ├── TraderPolicy.php
│       ├── ReservationPolicy.php
│       └── StallPolicy.php
├── database/
│   ├── migrations/          (see Section 5)
│   ├── seeders/
│   │   ├── DatabaseSeeder.php
│   │   ├── MarketSeeder.php
│   │   ├── CategorySeeder.php
│   │   └── AdminUserSeeder.php
│   └── factories/
├── routes/
│   └── api.php              (all routes here — see Section 6)
├── config/
│   ├── mpesa.php
│   ├── africastalking.php
│   └── cloudinary.php
└── tests/
    ├── Feature/
    └── Unit/
```

### Next.js Frontend (`/frontend`)
```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── verify/page.tsx
│   ├── (resident)/
│   │   ├── page.tsx                    # Home/Discovery
│   │   ├── market/[id]/page.tsx        # Market view
│   │   ├── trader/[id]/page.tsx        # Trader profile
│   │   ├── search/page.tsx
│   │   ├── reservations/page.tsx
│   │   └── profile/page.tsx
│   ├── (trader)/
│   │   ├── dashboard/page.tsx
│   │   ├── products/page.tsx
│   │   ├── reservations/page.tsx
│   │   ├── payments/page.tsx
│   │   └── analytics/page.tsx
│   ├── (admin)/
│   │   ├── dashboard/page.tsx
│   │   ├── stalls/page.tsx
│   │   ├── traders/page.tsx
│   │   ├── allocations/page.tsx
│   │   ├── fees/page.tsx
│   │   ├── complaints/page.tsx
│   │   └── reports/page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                             # shadcn/ui components
│   ├── shared/
│   │   ├── BottomNav.tsx
│   │   ├── TopBar.tsx
│   │   ├── SkeletonCard.tsx
│   │   ├── OfflineBanner.tsx
│   │   ├── LanguageToggle.tsx
│   │   ├── MpesaPaymentSheet.tsx
│   │   └── ConfirmSheet.tsx
│   ├── trader/
│   │   ├── TraderCard.tsx
│   │   ├── ProductCard.tsx
│   │   ├── StockBadge.tsx
│   │   └── TraderAnalyticsChart.tsx
│   ├── resident/
│   │   ├── SearchBar.tsx
│   │   ├── CategoryFilter.tsx
│   │   ├── ReservationCard.tsx
│   │   └── ReviewForm.tsx
│   ├── admin/
│   │   ├── StallMap.tsx
│   │   ├── OccupancyChart.tsx
│   │   ├── ComplaintTable.tsx
│   │   └── RevenueChart.tsx
│   └── map/
│       ├── MarketMap.tsx
│       └── StallMarker.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useReservation.ts
│   ├── useMpesa.ts
│   ├── useOffline.ts
│   └── useLocale.ts
├── lib/
│   ├── api.ts                          # Axios instance + interceptors
│   ├── constants.ts
│   ├── utils.ts
│   └── validations/
├── store/
│   ├── authStore.ts                    # Zustand auth store
│   ├── cartStore.ts
│   └── notificationStore.ts
├── types/
│   └── index.ts                        # All TypeScript interfaces
├── public/
│   ├── manifest.json                   # PWA manifest
│   └── icons/
└── next.config.js
```

---

## 4. DATABASE SCHEMA

> Create migrations in this exact order to respect foreign key dependencies.

### Migration 1: `create_markets_table`
```php
Schema::create('markets', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('location');
    $table->string('county');
    $table->string('estate');
    $table->text('description')->nullable();
    $table->decimal('latitude', 10, 7)->nullable();
    $table->decimal('longitude', 10, 7)->nullable();
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});
```

### Migration 2: `create_users_table`
```php
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('phone', 20)->unique();   // Primary identifier (Kenyan market)
    $table->string('email')->nullable()->unique();
    $table->string('password');
    $table->enum('role', ['trader', 'resident', 'admin'])->default('resident');
    $table->string('national_id')->nullable();
    $table->string('preferred_language', 5)->default('en'); // en = English (default)
    $table->boolean('phone_verified')->default(false);
    $table->timestamp('phone_verified_at')->nullable();
    $table->string('avatar_url')->nullable();
    $table->boolean('is_active')->default(true);
    $table->rememberToken();
    $table->timestamps();
    $table->softDeletes();
});
```

### Migration 3: `create_categories_table`
```php
Schema::create('categories', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('name_sw');             // Swahili name
    $table->string('icon')->nullable();    // Lucide icon name
    $table->string('color', 7)->nullable();
    $table->timestamps();
});
```

### Migration 4: `create_stalls_table`
```php
Schema::create('stalls', function (Blueprint $table) {
    $table->id();
    $table->foreignId('market_id')->constrained()->cascadeOnDelete();
    $table->string('stall_number');           // e.g. "A1", "B7", "C3"
    $table->string('block')->default('A');    // Building block: "A", "B", "C"
    $table->enum('zone', ['A', 'B', 'C']);    // A=left wall, B=centre, C=right wall
    $table->decimal('size_sqm', 5, 2)->nullable();
    $table->decimal('map_x', 8, 4)->nullable(); // Pixel x-position in building schematic
    $table->decimal('map_y', 8, 4)->nullable(); // Pixel y-position in building schematic
    $table->enum('status', ['available', 'occupied', 'maintenance'])
          ->default('available');
    $table->decimal('monthly_fee', 10, 2)->default(0);
    $table->text('notes')->nullable();        // Used for maintenance reason
    $table->timestamps();
    $table->unique(['market_id', 'block', 'stall_number']); // Unique per block
});

/*
 ZONE MEANING (matches physical government market building layout):
   Zone A = Left wall stalls  — face the centre aisle, back to outer left wall
   Zone B = Centre stalls     — double row, back-to-back, centre aisle between them
   Zone C = Right wall stalls — face the centre aisle, back to outer right wall
   Entrances = top and bottom of building (2 per side) — stored as building_config JSON

 MAP COORDINATES:
   map_x and map_y are pixel offsets in the schematic canvas (Leaflet CRS.Simple).
   Zone A: map_x ≈ 0–80
   Zone B: map_x ≈ 90–380 (two sub-columns of stalls)
   Zone C: map_x ≈ 390–460
   Rows increase map_y top to bottom.
*/
```

### Migration 5: `create_traders_table`
```php
Schema::create('traders', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('stall_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('market_id')->constrained();
    $table->string('business_name');
    $table->string('business_name_sw')->nullable();
    $table->text('description')->nullable();
    $table->string('mpesa_number', 20)->nullable();
    $table->string('permit_number')->nullable();
    $table->string('permit_image_url')->nullable();
    $table->enum('verification_status', ['pending', 'verified', 'rejected'])
          ->default('pending');
    $table->text('rejection_reason')->nullable();
    $table->string('avatar_url')->nullable();
    $table->string('banner_url')->nullable();
    $table->boolean('is_open')->default(false);
    $table->string('opening_time', 5)->nullable();   // "06:00"
    $table->string('closing_time', 5)->nullable();   // "18:00"
    $table->decimal('average_rating', 3, 2)->default(0);
    $table->integer('total_reviews')->default(0);
    $table->integer('profile_views')->default(0);
    $table->timestamps();
    $table->softDeletes();
});
```

### Migration 6: `create_products_table`
```php
Schema::create('products', function (Blueprint $table) {
    $table->id();
    $table->foreignId('trader_id')->constrained()->cascadeOnDelete();
    $table->foreignId('category_id')->constrained();
    $table->string('name');
    $table->string('name_sw')->nullable();
    $table->text('description')->nullable();
    $table->decimal('price', 10, 2);
    $table->string('unit')->default('piece');    // "kg", "piece", "bunch", "litre"
    $table->enum('stock_status', ['available', 'low', 'out_of_stock'])
          ->default('available');
    $table->integer('stock_quantity')->nullable();
    $table->string('image_url')->nullable();
    $table->boolean('is_active')->default(true);
    $table->integer('total_reservations')->default(0);
    $table->timestamps();
});
```

### Migration 7: `create_reservations_table`
```php
Schema::create('reservations', function (Blueprint $table) {
    $table->id();
    $table->string('reservation_code')->unique();
    $table->foreignId('resident_id')->constrained('users')->cascadeOnDelete();
    $table->foreignId('trader_id')->constrained()->cascadeOnDelete();
    $table->foreignId('product_id')->constrained()->cascadeOnDelete();
    $table->integer('quantity')->default(1);
    $table->decimal('unit_price', 10, 2);
    $table->decimal('total_amount', 10, 2);
    $table->enum('status', [
        'pending',      // Created, awaiting payment
        'paid',         // Payment confirmed
        'ready',        // Trader confirms item ready for pickup
        'completed',    // Resident picked up
        'cancelled',    // Cancelled by either party
        'expired'       // Not picked up within window
    ])->default('pending');
    $table->text('notes')->nullable();
    $table->timestamp('pickup_deadline')->nullable();
    $table->timestamp('picked_up_at')->nullable();
    $table->timestamps();
});
```

### Migration 8: `create_payments_table`
```php
Schema::create('payments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('reservation_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('user_id')->constrained();
    $table->string('mpesa_transaction_id')->nullable()->unique();
    $table->string('mpesa_checkout_request_id')->nullable();
    $table->decimal('amount', 10, 2);
    $table->string('phone_number', 20);
    $table->enum('type', ['reservation', 'market_fee']);
    $table->enum('status', ['pending', 'completed', 'failed', 'refunded'])
          ->default('pending');
    $table->json('mpesa_response')->nullable();
    $table->timestamp('paid_at')->nullable();
    $table->timestamps();
});
```

### Migration 9: `create_market_fees_table`
```php
Schema::create('market_fees', function (Blueprint $table) {
    $table->id();
    $table->foreignId('trader_id')->constrained()->cascadeOnDelete();
    $table->foreignId('market_id')->constrained();
    $table->decimal('amount', 10, 2);
    $table->string('period');              // "2025-01" (YYYY-MM)
    $table->enum('status', ['unpaid', 'paid', 'waived'])->default('unpaid');
    $table->foreignId('payment_id')->nullable()->constrained()->nullOnDelete();
    $table->timestamp('due_date');
    $table->timestamp('paid_at')->nullable();
    $table->text('notes')->nullable();
    $table->timestamps();
});
```

### Migration 10: `create_reviews_table`
```php
Schema::create('reviews', function (Blueprint $table) {
    $table->id();
    $table->foreignId('resident_id')->constrained('users')->cascadeOnDelete();
    $table->foreignId('trader_id')->constrained()->cascadeOnDelete();
    $table->foreignId('reservation_id')->nullable()->constrained()->nullOnDelete();
    $table->tinyInteger('rating');          // 1-5
    $table->text('comment')->nullable();
    $table->boolean('is_visible')->default(true);
    $table->timestamps();
    $table->unique(['resident_id', 'reservation_id']); // One review per reservation
});
```

### Migration 11: `create_complaints_table`
```php
Schema::create('complaints', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained();
    $table->foreignId('trader_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('reservation_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('market_id')->constrained();
    $table->enum('category', [
        'trader_conduct',
        'product_quality',
        'payment_dispute',
        'cleanliness',
        'security',
        'water_sanitation',
        'stall_allocation',
        'other'
    ]);
    $table->string('subject');
    $table->text('description');
    $table->enum('status', ['open', 'in_review', 'resolved', 'closed'])
          ->default('open');
    $table->text('admin_response')->nullable();
    $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('resolved_at')->nullable();
    $table->integer('priority')->default(1); // 1=low, 2=medium, 3=high
    $table->timestamps();
});
```

### Migration 12: `create_allocations_table`
```php
Schema::create('allocations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('stall_id')->constrained();
    $table->foreignId('trader_id')->constrained();
    $table->foreignId('allocated_by')->constrained('users');
    $table->date('start_date');
    $table->date('end_date')->nullable();
    $table->enum('status', ['active', 'expired', 'revoked'])->default('active');
    $table->text('notes')->nullable();
    $table->text('revocation_reason')->nullable();
    $table->timestamps();
});
```

### Migration 13: `create_stall_applications_table`
```php
Schema::create('stall_applications', function (Blueprint $table) {
    $table->id();
    $table->foreignId('trader_id')->constrained()->cascadeOnDelete();
    $table->foreignId('market_id')->constrained();
    $table->foreignId('preferred_stall_id')->nullable()->constrained('stalls')->nullOnDelete();
    $table->string('preferred_zone')->nullable();
    $table->text('motivation');
    $table->enum('status', ['pending', 'approved', 'rejected', 'waitlisted'])
          ->default('pending');
    $table->text('admin_notes')->nullable();
    $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('reviewed_at')->nullable();
    $table->timestamps();
});
```

### Migration 14: `create_notices_table`
```php
Schema::create('notices', function (Blueprint $table) {
    $table->id();
    $table->foreignId('market_id')->constrained();
    $table->foreignId('created_by')->constrained('users');
    $table->string('title');
    $table->string('title_sw')->nullable();
    $table->text('content');
    $table->text('content_sw')->nullable();
    $table->enum('type', ['general', 'event', 'maintenance', 'promotion', 'urgent']);
    $table->enum('audience', ['all', 'traders', 'residents'])->default('all');
    $table->timestamp('expires_at')->nullable();
    $table->boolean('is_pinned')->default(false);
    $table->timestamps();
});
```

### Migration 15: `create_notifications_table`
```php
Schema::create('notifications', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('title');
    $table->text('body');
    $table->string('type');                 // 'reservation', 'payment', 'complaint', etc.
    $table->json('data')->nullable();
    $table->boolean('is_read')->default(false);
    $table->timestamp('read_at')->nullable();
    $table->timestamps();
});
```

### Migration 16: `create_product_watchlist_table`
```php
Schema::create('product_watchlist', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('product_id')->constrained()->cascadeOnDelete();
    $table->boolean('notify_on_available')->default(true);
    $table->timestamps();
    $table->unique(['user_id', 'product_id']);
});
```

---

## 5. LARAVEL SETUP INSTRUCTIONS

### Step 1: Create Laravel Project
```bash
composer create-project laravel/laravel backend
cd backend
composer require laravel/sanctum
composer require cloudinary-labs/cloudinary-laravel
composer require africastalking/africastalking
php artisan install:api
php artisan vendor:publish --provider="CloudinaryLabs\CloudinaryLaravel\CloudinaryServiceProvider"
```

### Step 2: Environment Variables (`.env`)
```env
APP_NAME="Soko Mtaa"
APP_ENV=production
APP_URL=https://api.sokomtaa.co.ke

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sokomtaa
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password

QUEUE_CONNECTION=database
CACHE_DRIVER=file
SESSION_DRIVER=file

SANCTUM_STATEFUL_DOMAINS=sokomtaa.vercel.app,localhost:3000

# M-Pesa Daraja
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_PASSKEY=
MPESA_SHORTCODE=
MPESA_CALLBACK_URL=https://api.sokomtaa.co.ke/api/payments/mpesa/callback
MPESA_ENV=sandbox   # Change to 'production' when live

# Africa's Talking (SMS)
AT_USERNAME=sandbox
AT_API_KEY=
AT_SENDER_ID="SOKOMTAA"

# Cloudinary
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Pusher
PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_APP_CLUSTER=ap2
```

### Step 3: Configure CORS (`config/cors.php`)
```php
'allowed_origins' => [
    'https://sokomtaa.vercel.app',
    'http://localhost:3000',
],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
'supports_credentials' => true,
```

### Step 4: Create `config/mpesa.php`
```php
return [
    'consumer_key'    => env('MPESA_CONSUMER_KEY'),
    'consumer_secret' => env('MPESA_CONSUMER_SECRET'),
    'passkey'         => env('MPESA_PASSKEY'),
    'shortcode'       => env('MPESA_SHORTCODE'),
    'callback_url'    => env('MPESA_CALLBACK_URL'),
    'env'             => env('MPESA_ENV', 'sandbox'),
    'base_url'        => env('MPESA_ENV') === 'production'
                         ? 'https://api.safaricom.co.ke'
                         : 'https://sandbox.safaricom.co.ke',
];
```

---

## 6. API ROUTES (`routes/api.php`)

```php
// Public routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/verify-phone', [AuthController::class, 'verifyPhone']);
Route::post('/payments/mpesa/callback', [MpesaController::class, 'callback']);

Route::get('/markets', [MarketController::class, 'index']);
Route::get('/markets/{market}', [MarketController::class, 'show']);
Route::get('/search', [SearchController::class, 'search']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markRead']);

    // --- RESIDENT routes ---
    Route::middleware('role:resident,trader,admin')->group(function () {
        Route::get('/traders', [TraderProfileController::class, 'index']);
        Route::get('/traders/{trader}', [TraderProfileController::class, 'show']);
        Route::get('/traders/{trader}/products', [ProductController::class, 'byTrader']);
        Route::get('/markets/{market}/map', [StallController::class, 'map']);

        Route::post('/reservations', [ReservationController::class, 'store']);
        Route::get('/reservations', [ReservationController::class, 'myReservations']);
        Route::get('/reservations/{reservation}', [ReservationController::class, 'show']);
        Route::delete('/reservations/{reservation}', [ReservationController::class, 'cancel']);

        Route::post('/payments/mpesa/initiate', [MpesaController::class, 'initiate']);
        Route::get('/payments/status/{checkoutRequestId}', [MpesaController::class, 'checkStatus']);

        Route::post('/reviews', [ReviewController::class, 'store']);
        Route::post('/complaints', [ComplaintController::class, 'store']);
        Route::get('/notices', [NoticeController::class, 'index']);

        Route::post('/watchlist', [WatchlistController::class, 'store']);
        Route::delete('/watchlist/{product}', [WatchlistController::class, 'destroy']);
    });

    // --- TRADER routes ---
    Route::middleware('role:trader')->group(function () {
        Route::get('/trader/profile', [TraderProfileController::class, 'myProfile']);
        Route::post('/trader/profile', [TraderProfileController::class, 'setup']);
        Route::put('/trader/profile', [TraderProfileController::class, 'update']);
        Route::put('/trader/status', [TraderProfileController::class, 'toggleOpen']);

        Route::apiResource('/trader/products', ProductController::class);
        Route::put('/trader/products/{product}/stock', [ProductController::class, 'updateStock']);

        Route::get('/trader/reservations', [ReservationController::class, 'traderReservations']);
        Route::put('/trader/reservations/{reservation}/ready', [ReservationController::class, 'markReady']);
        Route::put('/trader/reservations/{reservation}/complete', [ReservationController::class, 'markComplete']);

        Route::get('/trader/fees', [FeeController::class, 'traderFees']);
        Route::post('/trader/fees/{fee}/pay', [FeeController::class, 'initiatePay']);

        Route::get('/trader/analytics', [TraderAnalyticsController::class, 'index']);

        Route::post('/trader/apply-stall', [StallApplicationController::class, 'store']);
    });

    // --- ADMIN routes ---
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/dashboard', [AdminDashboardController::class, 'index']);

        Route::apiResource('/admin/markets', AdminMarketController::class);
        Route::apiResource('/admin/stalls', StallController::class);
        Route::apiResource('/admin/traders', AdminTraderController::class);

        Route::put('/admin/traders/{trader}/verify', [AdminTraderController::class, 'verify']);
        Route::put('/admin/traders/{trader}/reject', [AdminTraderController::class, 'reject']);

        Route::apiResource('/admin/allocations', AllocationController::class);
        Route::get('/admin/applications', [StallApplicationController::class, 'index']);
        Route::put('/admin/applications/{application}', [StallApplicationController::class, 'review']);

        Route::get('/admin/fees', [FeeController::class, 'index']);
        Route::post('/admin/fees/generate', [FeeController::class, 'generate']);

        Route::get('/admin/complaints', [ComplaintController::class, 'index']);
        Route::put('/admin/complaints/{complaint}', [ComplaintController::class, 'update']);

        Route::apiResource('/admin/notices', NoticeController::class);
        Route::get('/admin/reports', [ReportController::class, 'index']);
    });
});
```

---

## 7. KEY SERVICE IMPLEMENTATIONS

### MpesaService.php
```php
class MpesaService
{
    public function getAccessToken(): string
    {
        $response = Http::withBasicAuth(
            config('mpesa.consumer_key'),
            config('mpesa.consumer_secret')
        )->get(config('mpesa.base_url') . '/oauth/v1/generate?grant_type=client_credentials');

        return $response->json()['access_token'];
    }

    public function stkPush(string $phone, float $amount, string $reference, string $description): array
    {
        $timestamp = now()->format('YmdHis');
        $password  = base64_encode(
            config('mpesa.shortcode') . config('mpesa.passkey') . $timestamp
        );

        $phone = '254' . ltrim(preg_replace('/^0/', '', $phone), '0');

        $response = Http::withToken($this->getAccessToken())
            ->post(config('mpesa.base_url') . '/mpesa/stkpush/v1/processrequest', [
                'BusinessShortCode' => config('mpesa.shortcode'),
                'Password'          => $password,
                'Timestamp'         => $timestamp,
                'TransactionType'   => 'CustomerPayBillOnline',
                'Amount'            => (int) $amount,
                'PartyA'            => $phone,
                'PartyB'            => config('mpesa.shortcode'),
                'PhoneNumber'       => $phone,
                'CallBackURL'       => config('mpesa.callback_url'),
                'AccountReference'  => $reference,
                'TransactionDesc'   => $description,
            ]);

        return $response->json();
    }
}
```

### ReservationService.php
```php
class ReservationService
{
    public function create(User $resident, Product $product, int $quantity): Reservation
    {
        // Check stock
        if ($product->stock_status === 'out_of_stock') {
            throw new \Exception('Product is out of stock');
        }

        $code = strtoupper(Str::random(8));

        return Reservation::create([
            'reservation_code' => $code,
            'resident_id'      => $resident->id,
            'trader_id'        => $product->trader_id,
            'product_id'       => $product->id,
            'quantity'         => $quantity,
            'unit_price'       => $product->price,
            'total_amount'     => $product->price * $quantity,
            'status'           => 'pending',
            'pickup_deadline'  => now()->addHours(24),
        ]);
    }
}
```

---

## 8. NEXT.JS SETUP INSTRUCTIONS

### Step 1: Create Project
```bash
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"

cd frontend
npm install @tanstack/react-query axios zustand react-hook-form zod \
  @hookform/resolvers framer-motion lucide-react leaflet react-leaflet \
  next-pwa @types/leaflet
npx shadcn@latest init
```

### Step 2: API Client (`lib/api.ts`)
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('soko_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('soko_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Step 3: PWA Config (`next.config.js`)
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.sokomtaa\.co\.ke\/api\/traders/,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'traders-cache', expiration: { maxAgeSeconds: 60 * 60 } },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|webp|svg|ico)$/,
      handler: 'CacheFirst',
      options: { cacheName: 'images-cache', expiration: { maxEntries: 100 } },
    },
  ],
});

module.exports = withPWA({ reactStrictMode: true });
```

### Step 4: Zustand Auth Store (`store/authStore.ts`)
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  name: string;
  phone: string;
  role: 'trader' | 'resident' | 'admin';
  preferred_language: 'sw' | 'en';
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      isAuthenticated: () => !!get().token,
    }),
    { name: 'soko_auth' }
  )
);
```

---

## 9. MOBILE NAVIGATION PATTERN

All logged-in pages on mobile must use a **Bottom Navigation Bar**.
Never use a hamburger sidebar as the primary navigation on mobile.

### Role-Based Bottom Nav

**Resident Bottom Nav:**
- 🏠 Home (Discovery)
- 🔍 Search
- 📋 Reservations
- 👤 Profile

**Trader Bottom Nav:**
- 📊 Dashboard
- 📦 Products
- 🛒 Orders
- 💰 Payments
- 👤 Profile

**Admin Bottom Nav:**
- 📊 Dashboard
- 🏪 Stalls
- 👥 Traders
- 📋 Reports
- ⚙️ Settings

---

## 10. M-PESA PAYMENT FLOW

Implement this exact flow — do not deviate:

```
1. Resident taps "Reserve & Pay" on product
2. Frontend shows MpesaPaymentSheet (bottom sheet) with amount + phone pre-filled
3. Resident confirms phone number and taps "Lipa Na M-Pesa"
4. POST /api/payments/mpesa/initiate → backend calls STK Push
5. Frontend polls GET /api/payments/status/{checkoutRequestId} every 3 seconds
6. M-Pesa sends callback to POST /api/payments/mpesa/callback
7. Backend updates payment status, updates reservation to 'paid'
8. Backend dispatches SMS notification to trader via Africa's Talking
9. Backend creates in-app notification for both trader and resident
10. Frontend polling detects 'completed' status → shows success screen
11. Frontend navigates to reservation detail page with pickup code
```

**Timeout:** Stop polling after 2 minutes. Show "Check your M-Pesa messages" message.
**Failure:** Show specific error from M-Pesa response (wrong PIN, insufficient funds, etc.)

---

## 11. AUTHENTICATION FLOW

- **Phone number is the primary identifier** (not email) — most Kenyan traders don't use email
- OTP verification via Africa's Talking SMS on registration
- Sanctum token stored in localStorage (acceptable for mobile web SPA)
- Tokens expire after 30 days
- Role is assigned at registration and cannot be self-changed
- Admin accounts are seeded — never created via public registration

---

## 12. TRADER VERIFICATION FLOW

```
1. Trader registers with phone number
2. Trader completes profile (business name, M-Pesa number, market permit)
3. Trader uploads permit image (via Cloudinary)
4. Status = 'pending' — trader can set up products but cannot be discovered yet
5. Admin reviews in dashboard → Approves or Rejects with reason
6. Status = 'verified' → Trader appears in search and market map
7. SMS sent to trader on approval/rejection
```

---

## 13. SWAHILI LOCALIZATION

Use `next-intl` for internationalization in Next.js.

```bash
npm install next-intl
```

Create translation files:
- `messages/sw.json` — Swahili (default)
- `messages/en.json` — English

All UI strings must have both translations. Never hardcode English strings in components.

Key translation conventions:
```json
{
  "nav.home": "Nyumbani",
  "nav.search": "Tafuta",
  "nav.reservations": "Mahitaji",
  "actions.reserve": "Hifadhi Bidhaa",
  "actions.pay": "Lipa Sasa",
  "status.available": "Inapatikana",
  "status.out_of_stock": "Imeisha",
  "status.low_stock": "Inakaribia Kuisha"
}
```

---

## 14. SEARCH & AI RECOMMENDATIONS

### Basic Search (Phase 1 — Build First)
- Full-text search on `products.name`, `products.name_sw`, `traders.business_name`
- Filter by: category, market, stock status, price range
- Sort by: rating, distance, newest
- Implement using MySQL `FULLTEXT` index

### AI Recommendations (Phase 2 — After MVP)
- Use product view counts and reservation data to rank results
- "Popular today" — products with most reservations in last 24 hours
- "Near you" — when geolocation is available, prioritize nearby markets
- Price insight for traders: compare their price vs average for same category
- Implement as a separate lightweight scoring function in `SearchService.php`

---

## 15. COUNTY ADMIN DASHBOARD METRICS

The admin dashboard must display these metrics in real-time (refresh every 60 seconds):

| Metric | Data Source |
|---|---|
| Total active traders | `traders` where `verification_status = verified` |
| Stall occupancy rate | occupied stalls / total stalls × 100 |
| Today's reservations | `reservations` created today |
| Today's revenue (fees) | `payments` completed today where `type = market_fee` |
| Open complaints | `complaints` where `status = open` |
| Pending verifications | `traders` where `verification_status = pending` |
| Top selling categories | Aggregate from `reservations` joined to `products` |
| Peak trading hours | Aggregate `reservations` by hour |

---

## 16. TRADER ANALYTICS DASHBOARD METRICS

Each trader sees their own data:

| Metric | Description |
|---|---|
| Profile views | Count from `traders.profile_views` |
| Total reservations | Count of completed reservations |
| Top products | Products with most reservations |
| Revenue (completed orders) | Sum of completed reservation amounts |
| Average rating | From `traders.average_rating` |
| Busiest hours | Reservations grouped by hour of day |
| Outstanding fees | Unpaid market fees |

---

## 17. DEPLOYMENT CHECKLIST

### Laravel on Truehost Shared Hosting
- [ ] Upload Laravel project **outside** `public_html`
- [ ] Move contents of `/public` to `public_html` and update paths in `index.php`
- [ ] Set file permissions: `storage/` and `bootstrap/cache/` to `755`
- [ ] Run `php artisan key:generate` via SSH
- [ ] Run `php artisan migrate --seed` via SSH
- [ ] Set cron job in cPanel: `* * * * * php /path/to/artisan schedule:run`
- [ ] Run queue worker via cron: `*/5 * * * * php /path/to/artisan queue:work --max-time=240`
- [ ] Set `APP_ENV=production` and `APP_DEBUG=false`
- [ ] Configure SSL certificate in cPanel (Let's Encrypt)

### Next.js on Vercel
- [ ] Connect GitHub repository to Vercel
- [ ] Set environment variables in Vercel dashboard
- [ ] Set `NEXT_PUBLIC_API_URL=https://api.sokomtaa.co.ke`
- [ ] Configure custom domain in Vercel
- [ ] Enable Web Analytics in Vercel (free)
- [ ] Test PWA installation on Android Chrome

---

## 18. SECURITY REQUIREMENTS

- [ ] All API endpoints are rate limited (use Laravel's `throttle` middleware)
- [ ] M-Pesa callback validates request origin IP whitelist (Safaricom IPs only)
- [ ] All file uploads validated for type and size (images only, max 5MB)
- [ ] Sensitive fields (`national_id`, `permit_number`) never returned in API responses to non-admin
- [ ] Admin routes double-verified with both `auth:sanctum` and `role:admin` middleware
- [ ] All database queries use Eloquent (no raw SQL) to prevent injection
- [ ] HTTPS enforced on all environments
- [ ] Trader can only see their own reservations, products, and analytics
- [ ] Resident can only see their own reservations and payment history
- [ ] Payment callbacks are idempotent (duplicate callbacks don't double-process)

---

## 19. BUILD ORDER (FOLLOW STRICTLY)

Build in this sequence — each phase must be working before starting the next:

### Phase 1 — Foundation
1. Laravel project setup + database migrations
2. Authentication (register, login, OTP verification, logout)
3. Role middleware
4. Market & Category seeders
5. Next.js project setup + API client + auth store
6. Login/Register pages (mobile-first)

### Phase 2 — Core Trader Features
7. Trader profile setup & management API
8. Product CRUD API + Cloudinary image upload
9. Trader-facing pages: dashboard, products, profile
10. Admin trader verification flow

### Phase 3 — Core Resident Features
11. Market map with Leaflet (stall directory)
12. Trader discovery & search
13. Product listing pages
14. Reservation creation flow

### Phase 4 — Payments
15. M-Pesa STK Push integration (sandbox)
16. Payment callback handler
17. Reservation payment flow end-to-end
18. Market fee payment for traders

### Phase 5 — Administration
19. County admin dashboard with all metrics
20. Stall management & allocation workflow
21. Stall application & waitlist
22. Complaint management

### Phase 6 — Communication & Community
23. In-app notifications
24. SMS notifications via Africa's Talking
25. Review & rating system
26. Community notice board
27. Dispute resolution flow

### Phase 7 — Intelligence & Polish
28. Trader analytics dashboard
29. AI-powered search ranking
30. Price insights for traders
31. PWA configuration + offline support
32. Swahili localization (all strings)
33. Performance optimization (lazy loading, caching)
34. Security audit & hardening
35. M-Pesa switch to production

---

## 20. TESTING REQUIREMENTS

- [ ] Feature tests for all API endpoints (Laravel `tests/Feature/`)
- [ ] Unit tests for `MpesaService`, `ReservationService`, `FeeCalculationService`
- [ ] Test M-Pesa flow in sandbox before production switch
- [ ] Test on real low-end Android device (not just Chrome DevTools)
- [ ] Test on slow 3G connection using Chrome Network throttling
- [ ] Test offline mode — ensure cached pages load without connection
- [ ] Cross-browser test: Chrome Android, Firefox Android, Samsung Internet
- [ ] Accessibility: all interactive elements reachable by keyboard, ARIA labels on icons

---

> **Last updated:** 2025 | **Project:** Soko Mtaa | **Stack:** Laravel 11 + Next.js 14 + MySQL
> Any AI agent reading this file must follow these instructions completely and in order.
> Do not make architectural decisions not specified here without flagging them first.

---

## 21. API RESPONSE FORMAT STANDARD

> Every single API response — success or failure — MUST follow this exact structure.
> No exceptions. Consistency here is what makes the frontend predictable and maintainable.

### Success Response
```json
{
  "success": true,
  "message": "Reservation created successfully",
  "data": { },
  "meta": null
}
```

### Success Response with Pagination
```json
{
  "success": true,
  "message": "Traders retrieved successfully",
  "data": [ ],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 87,
    "last_page": 6,
    "from": 1,
    "to": 15
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "phone": ["Phone number is required", "Phone number must be a valid Kenyan number"],
    "name": ["Name is required"]
  },
  "code": "VALIDATION_ERROR"
}
```

### Error Codes Reference
Always include one of these exact `code` strings in every error response:

| Code | HTTP Status | When to Use |
|---|---|---|
| `VALIDATION_ERROR` | 422 | Form/request validation failed |
| `UNAUTHENTICATED` | 401 | No token or token expired |
| `UNAUTHORIZED` | 403 | Token valid but wrong role/permission |
| `NOT_FOUND` | 404 | Resource does not exist |
| `ALREADY_EXISTS` | 409 | Duplicate record (e.g. phone already registered) |
| `PAYMENT_FAILED` | 402 | M-Pesa transaction failed |
| `PAYMENT_PENDING` | 202 | M-Pesa STK pushed, awaiting user confirmation |
| `OUT_OF_STOCK` | 409 | Product unavailable for reservation |
| `TRADER_NOT_VERIFIED` | 403 | Trader profile not yet approved by admin |
| `STALL_UNAVAILABLE` | 409 | Stall already occupied or under maintenance |
| `SMS_FAILED` | 500 | Africa's Talking delivery failure (non-blocking) |
| `MPESA_TIMEOUT` | 504 | M-Pesa API did not respond in time |
| `SERVER_ERROR` | 500 | Unexpected server error |

### Laravel Implementation

Create a reusable trait `app/Traits/ApiResponse.php`:

```php
<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponse
{
    protected function success(
        mixed $data = null,
        string $message = 'Success',
        int $status = 200,
        ?array $meta = null
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
            'meta'    => $meta,
        ], $status);
    }

    protected function paginated(
        \Illuminate\Pagination\LengthAwarePaginator $paginator,
        string $message = 'Data retrieved successfully'
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $paginator->items(),
            'meta'    => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
                'from'         => $paginator->firstItem(),
                'to'           => $paginator->lastItem(),
            ],
        ], 200);
    }

    protected function error(
        string $message,
        string $code = 'SERVER_ERROR',
        int $status = 500,
        ?array $errors = null
    ): JsonResponse {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors'  => $errors,
            'code'    => $code,
        ], $status);
    }
}
```

Use this trait in every controller:
```php
class TraderProfileController extends Controller
{
    use ApiResponse;

    public function show(Trader $trader): JsonResponse
    {
        return $this->success($trader, 'Trader retrieved successfully');
    }
}
```

### Frontend API Response Handling

Create a typed response wrapper in `lib/api.ts`:

```typescript
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  meta: PaginationMeta | null;
  errors?: Record<string, string[]>;
  code?: string;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

// Always destructure like this in components:
const { data, meta } = response.data as ApiResponse<Trader[]>;
```

---

## 22. ERROR HANDLING STRATEGY

> Errors must be handled at every layer — service, controller, frontend fetch, and UI.
> Never let an unhandled error reach the user as a blank screen or raw JSON.

### Backend Error Handling

#### Global Exception Handler (`app/Exceptions/Handler.php`)
Override the `register()` method to catch all exceptions and return consistent JSON:

```php
public function register(): void
{
    $this->renderable(function (ValidationException $e, Request $request) {
        if ($request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
                'code'    => 'VALIDATION_ERROR',
            ], 422);
        }
    });

    $this->renderable(function (ModelNotFoundException $e, Request $request) {
        if ($request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => 'The requested resource was not found',
                'errors'  => null,
                'code'    => 'NOT_FOUND',
            ], 404);
        }
    });

    $this->renderable(function (AuthenticationException $e, Request $request) {
        if ($request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated. Please log in.',
                'errors'  => null,
                'code'    => 'UNAUTHENTICATED',
            ], 401);
        }
    });

    $this->renderable(function (AuthorizationException $e, Request $request) {
        if ($request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to perform this action',
                'errors'  => null,
                'code'    => 'UNAUTHORIZED',
            ], 403);
        }
    });

    $this->renderable(function (Throwable $e, Request $request) {
        if ($request->expectsJson()) {
            $status  = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;
            $message = app()->isProduction() ? 'An unexpected error occurred' : $e->getMessage();

            Log::error($e->getMessage(), [
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $message,
                'errors'  => null,
                'code'    => 'SERVER_ERROR',
            ], $status);
        }
    });
}
```

#### Service Layer Error Handling
All custom exceptions must be stored in `app/Exceptions/`:

```
app/Exceptions/
├── MpesaException.php          # M-Pesa API failures
├── PaymentFailedException.php  # Transaction declined
├── OutOfStockException.php     # Product unavailable
├── TraderNotVerifiedException.php
└── StallUnavailableException.php
```

Each custom exception example:
```php
<?php
namespace App\Exceptions;

class OutOfStockException extends \Exception
{
    public function __construct(string $productName)
    {
        parent::__construct("'{$productName}' is currently out of stock");
    }
}
```

#### M-Pesa Specific Error Handling
M-Pesa failures must never crash the system. Always wrap in try/catch:
```php
try {
    $result = $this->mpesaService->stkPush($phone, $amount, $ref, $desc);
} catch (MpesaException $e) {
    Log::channel('mpesa')->error('STK Push failed', ['error' => $e->getMessage()]);
    return $this->error('Mobile payment service is temporarily unavailable. Try again.', 'MPESA_TIMEOUT', 504);
}
```

Create a dedicated `mpesa` log channel in `config/logging.php`:
```php
'mpesa' => [
    'driver' => 'daily',
    'path'   => storage_path('logs/mpesa.log'),
    'days'   => 30,
],
```

### Frontend Error Handling

#### TanStack Query Global Error Handler (`app/providers.tsx`)
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) return false;
        return failureCount < 2;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
    mutations: {
      onError: (error: any) => {
        const code    = error?.response?.data?.code;
        const message = error?.response?.data?.message;

        if (code === 'UNAUTHENTICATED') {
          useAuthStore.getState().logout();
          window.location.href = '/login';
          return;
        }
        // Show toast for all other errors
        toast.error(message || 'Something went wrong. Please try again.');
      },
    },
  },
});
```

#### Every Page Must Handle These Four States
No page may be considered complete without all four states implemented:

```typescript
// 1. LOADING STATE — show skeleton, never a blank page
if (isLoading) return <TraderCardSkeleton />;

// 2. ERROR STATE — show friendly message with retry button
if (isError) return (
  <ErrorState
    message="Could not load traders. Check your connection."
    onRetry={() => refetch()}
  />
);

// 3. EMPTY STATE — show helpful prompt, never a blank list
if (!data || data.length === 0) return (
  <EmptyState
    icon={<ShoppingBag />}
    title="Hakuna wachuuzi bado"
    subtitle="No traders found in this market yet"
  />
);

// 4. SUCCESS STATE — render the actual content
return <TraderList traders={data} />;
```

#### Offline Error Handling
Detect network loss and show a persistent non-blocking banner:
```typescript
// hooks/useOffline.ts
export function useOffline() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const onOnline  = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return isOffline;
}
```

#### What to Show Users for Each Error Code

| Error Code | User-Facing Message (Swahili) | User-Facing Message (English) |
|---|---|---|
| `VALIDATION_ERROR` | Show inline field errors | Show inline field errors |
| `UNAUTHENTICATED` | Redirect to login silently | Redirect to login silently |
| `UNAUTHORIZED` | "Huna ruhusa ya kufanya hivi" | "You don't have permission" |
| `NOT_FOUND` | "Bidhaa haipatikani" | "Item not found" |
| `OUT_OF_STOCK` | "Bidhaa hii imeisha" | "This item is out of stock" |
| `PAYMENT_FAILED` | "Malipo hayakufanikiwa. Jaribu tena." | "Payment failed. Please try again." |
| `PAYMENT_PENDING` | "Angalia simu yako ya M-Pesa" | "Check your M-Pesa prompt" |
| `MPESA_TIMEOUT` | "Huduma ya malipo haipo sasa. Jaribu baadaye." | "Payment service unavailable. Try later." |
| `SERVER_ERROR` | "Hitilafu imetokea. Jaribu tena." | "Something went wrong. Try again." |

---

## 23. DATABASE SEEDER PLAN

> Run seeders in this exact order. All seed data is for the pilot market.
> Seeders must be idempotent — running them twice must not create duplicates.

### Seeder Run Order (`DatabaseSeeder.php`)
```php
public function run(): void
{
    $this->call([
        CategorySeeder::class,      // 1. Categories first (no dependencies)
        MarketSeeder::class,        // 2. Pilot market
        StallSeeder::class,         // 3. Stalls (depends on market)
        AdminUserSeeder::class,     // 4. Admin account
        DemoTraderSeeder::class,    // 5. Demo trader (depends on market + stalls)
        DemoResidentSeeder::class,  // 6. Demo resident (no dependencies)
    ]);
}
```

### CategorySeeder — 12 Default Categories
```php
$categories = [
    ['name' => 'Vegetables',     'name_sw' => 'Mboga',          'icon' => 'Leaf',        'color' => '#16A34A'],
    ['name' => 'Fruits',         'name_sw' => 'Matunda',        'icon' => 'Apple',        'color' => '#EA580C'],
    ['name' => 'Grains & Flour', 'name_sw' => 'Nafaka na Unga', 'icon' => 'Wheat',        'color' => '#CA8A04'],
    ['name' => 'Meat & Fish',    'name_sw' => 'Nyama na Samaki','icon' => 'Fish',          'color' => '#DC2626'],
    ['name' => 'Dairy & Eggs',   'name_sw' => 'Maziwa na Mayai','icon' => 'Egg',           'color' => '#D97706'],
    ['name' => 'Cooking Oil',    'name_sw' => 'Mafuta ya Kupikia','icon' => 'Droplets',   'color' => '#B45309'],
    ['name' => 'Spices',         'name_sw' => 'Viungo',         'icon' => 'Sparkles',     'color' => '#7C3AED'],
    ['name' => 'Clothing',       'name_sw' => 'Nguo',           'icon' => 'Shirt',        'color' => '#2563EB'],
    ['name' => 'Household',      'name_sw' => 'Vifaa vya Nyumba','icon' => 'Home',        'color' => '#0891B2'],
    ['name' => 'Electronics',    'name_sw' => 'Vifaa vya Umeme','icon' => 'Zap',          'color' => '#4F46E5'],
    ['name' => 'Beverages',      'name_sw' => 'Vinywaji',       'icon' => 'Coffee',       'color' => '#92400E'],
    ['name' => 'Street Food',    'name_sw' => 'Chakula cha Mtaani','icon' => 'UtensilsCrossed','color' => '#BE185D'],
];
```

### MarketSeeder — Pilot Market
```php
Market::firstOrCreate(
    ['name' => 'Kolenyo Market'],
    [
        'location'    => 'Kolenyo Estate, Kisumu',
        'county'      => 'Kisumu',
        'estate'      => 'Kolenyo',
        'description' => 'Pilot market for Soko Mtaa digital marketplace platform',
        'latitude'    => -0.0917,
        'longitude'   => 34.7679,
        'is_active'   => true,
    ]
);
```

### StallSeeder — 30 Pilot Stalls (Block A, matching physical layout)
```php
$market = Market::where('name', 'Kolenyo Market')->first();

/*
 Building layout: 3 zones per block
   Zone A — 8 stalls, left wall (A1–A8), map_x: 10, map_y: 10 to 370
   Zone B — 14 stalls, centre double-row (B1–B14), map_x: 95 or 175, map_y: 10 to 370
   Zone C — 8 stalls, right wall (C1–C8), map_x: 270, map_y: 10 to 370
 Total: 30 stalls per block (matching government building standard)
*/

$stallData = [
    // Zone A — Left wall (8 stalls)
    ['stall_number'=>'A1','block'=>'A','zone'=>'A','map_x'=>10,'map_y'=>10, 'monthly_fee'=>1500],
    ['stall_number'=>'A2','block'=>'A','zone'=>'A','map_x'=>10,'map_y'=>60, 'monthly_fee'=>1500],
    ['stall_number'=>'A3','block'=>'A','zone'=>'A','map_x'=>10,'map_y'=>110,'monthly_fee'=>1500],
    ['stall_number'=>'A4','block'=>'A','zone'=>'A','map_x'=>10,'map_y'=>160,'monthly_fee'=>1500],
    ['stall_number'=>'A5','block'=>'A','zone'=>'A','map_x'=>10,'map_y'=>210,'monthly_fee'=>1500],
    ['stall_number'=>'A6','block'=>'A','zone'=>'A','map_x'=>10,'map_y'=>260,'monthly_fee'=>1500],
    ['stall_number'=>'A7','block'=>'A','zone'=>'A','map_x'=>10,'map_y'=>310,'monthly_fee'=>1500],
    ['stall_number'=>'A8','block'=>'A','zone'=>'A','map_x'=>10,'map_y'=>360,'monthly_fee'=>1500],

    // Zone B — Centre double-row (14 stalls, 2 columns back-to-back)
    // Left sub-column of centre
    ['stall_number'=>'B1', 'block'=>'A','zone'=>'B','map_x'=>95,'map_y'=>10, 'monthly_fee'=>1200],
    ['stall_number'=>'B3', 'block'=>'A','zone'=>'B','map_x'=>95,'map_y'=>60, 'monthly_fee'=>1200],
    ['stall_number'=>'B5', 'block'=>'A','zone'=>'B','map_x'=>95,'map_y'=>110,'monthly_fee'=>1200],
    ['stall_number'=>'B7', 'block'=>'A','zone'=>'B','map_x'=>95,'map_y'=>160,'monthly_fee'=>1200],
    ['stall_number'=>'B9', 'block'=>'A','zone'=>'B','map_x'=>95,'map_y'=>210,'monthly_fee'=>1200],
    ['stall_number'=>'B11','block'=>'A','zone'=>'B','map_x'=>95,'map_y'=>260,'monthly_fee'=>1200],
    ['stall_number'=>'B13','block'=>'A','zone'=>'B','map_x'=>95,'map_y'=>310,'monthly_fee'=>1200],
    // Right sub-column of centre
    ['stall_number'=>'B2', 'block'=>'A','zone'=>'B','map_x'=>175,'map_y'=>10, 'monthly_fee'=>1200],
    ['stall_number'=>'B4', 'block'=>'A','zone'=>'B','map_x'=>175,'map_y'=>60, 'monthly_fee'=>1200],
    ['stall_number'=>'B6', 'block'=>'A','zone'=>'B','map_x'=>175,'map_y'=>110,'monthly_fee'=>1200],
    ['stall_number'=>'B8', 'block'=>'A','zone'=>'B','map_x'=>175,'map_y'=>160,'monthly_fee'=>1200],
    ['stall_number'=>'B10','block'=>'A','zone'=>'B','map_x'=>175,'map_y'=>210,'monthly_fee'=>1200],
    ['stall_number'=>'B12','block'=>'A','zone'=>'B','map_x'=>175,'map_y'=>260,'monthly_fee'=>1200],
    ['stall_number'=>'B14','block'=>'A','zone'=>'B','map_x'=>175,'map_y'=>310,'monthly_fee'=>1200],

    // Zone C — Right wall (8 stalls)
    ['stall_number'=>'C1','block'=>'A','zone'=>'C','map_x'=>270,'map_y'=>10, 'monthly_fee'=>1000],
    ['stall_number'=>'C2','block'=>'A','zone'=>'C','map_x'=>270,'map_y'=>60, 'monthly_fee'=>1000],
    ['stall_number'=>'C3','block'=>'A','zone'=>'C','map_x'=>270,'map_y'=>110,'monthly_fee'=>1000],
    ['stall_number'=>'C4','block'=>'A','zone'=>'C','map_x'=>270,'map_y'=>160,'monthly_fee'=>1000],
    ['stall_number'=>'C5','block'=>'A','zone'=>'C','map_x'=>270,'map_y'=>210,'monthly_fee'=>1000],
    ['stall_number'=>'C6','block'=>'A','zone'=>'C','map_x'=>270,'map_y'=>260,'monthly_fee'=>1000],
    ['stall_number'=>'C7','block'=>'A','zone'=>'C','map_x'=>270,'map_y'=>310,'monthly_fee'=>1000],
    ['stall_number'=>'C8','block'=>'A','zone'=>'C','map_x'=>270,'map_y'=>360,'monthly_fee'=>1000],
];

foreach ($stallData as $data) {
    Stall::firstOrCreate(
        ['market_id' => $market->id, 'block' => $data['block'], 'stall_number' => $data['stall_number']],
        array_merge($data, ['market_id' => $market->id, 'size_sqm' => 9.0, 'status' => 'available'])
    );
}

// Fee structure by zone (KES/month):
// Zone A (wall): KES 1,500 — premium wall-facing position
// Zone B (centre): KES 1,200 — centre aisle — highest foot traffic
// Zone C (wall): KES 1,000 — right wall — slightly lower demand
```

### AdminUserSeeder — Default Admin Account
```php
// IMPORTANT: Change these credentials immediately after first login
$admin = User::firstOrCreate(
    ['phone' => '0700000001'],
    [
        'name'               => 'Soko Mtaa Admin',
        'email'              => 'admin@sokomtaa.co.ke',
        'password'           => Hash::make('SokoAdmin@2025!'),
        'role'               => 'admin',
        'phone_verified'     => true,
        'phone_verified_at'  => now(),
        'is_active'          => true,
    ]
);
```

### DemoTraderSeeder — One Verified Demo Trader
```php
$user = User::firstOrCreate(
    ['phone' => '0700000002'],
    [
        'name'               => 'Mama Wanjiru',
        'role'               => 'trader',
        'password'           => Hash::make('Demo@1234'),
        'phone_verified'     => true,
        'phone_verified_at'  => now(),
    ]
);

$stall = Stall::where('stall_number', 'A1')->first();

$trader = Trader::firstOrCreate(
    ['user_id' => $user->id],
    [
        'stall_id'            => $stall->id,
        'market_id'           => Market::first()->id,
        'business_name'       => "Mama Wanjiru's Mboga",
        'business_name_sw'    => 'Duka la Mboga la Mama Wanjiru',
        'description'         => 'Fresh vegetables and fruits daily from local farms',
        'mpesa_number'        => '0700000002',
        'verification_status' => 'verified',
        'is_open'             => true,
        'opening_time'        => '06:00',
        'closing_time'        => '18:00',
    ]
);

// Update stall status
$stall->update(['status' => 'occupied']);

// Seed 5 demo products
$products = [
    ['name' => 'Tomatoes',  'name_sw' => 'Nyanya',   'price' => 50,  'unit' => 'kg',    'stock_status' => 'available'],
    ['name' => 'Onions',    'name_sw' => 'Vitunguu', 'price' => 80,  'unit' => 'kg',    'stock_status' => 'available'],
    ['name' => 'Sukuma Wiki','name_sw' => 'Sukuma Wiki','price' => 20,'unit' => 'bunch', 'stock_status' => 'available'],
    ['name' => 'Potatoes',  'name_sw' => 'Viazi',    'price' => 60,  'unit' => 'kg',    'stock_status' => 'low'],
    ['name' => 'Mangoes',   'name_sw' => 'Maembe',   'price' => 30,  'unit' => 'piece', 'stock_status' => 'available'],
];

$vegCategory = Category::where('name', 'Vegetables')->first();
foreach ($products as $product) {
    Product::firstOrCreate(
        ['trader_id' => $trader->id, 'name' => $product['name']],
        array_merge($product, ['category_id' => $vegCategory->id, 'is_active' => true])
    );
}
```

### DemoResidentSeeder — One Demo Resident
```php
User::firstOrCreate(
    ['phone' => '0700000003'],
    [
        'name'               => 'John Odhiambo',
        'role'               => 'resident',
        'password'           => Hash::make('Demo@1234'),
        'phone_verified'     => true,
        'phone_verified_at'  => now(),
    ]
);
```

### Demo Credentials Summary (README must display this table)

| Role | Phone | Password | Notes |
|---|---|---|---|
| Admin | 0700000001 | SokoAdmin@2025! | Change immediately on first login |
| Trader | 0700000002 | Demo@1234 | Mama Wanjiru — verified, stall A1 |
| Resident | 0700000003 | Demo@1234 | John Odhiambo |

---

## 24. ROLES & PERMISSIONS MATRIX

> This matrix is the single authority on what each role can do.
> Any access not explicitly listed here is DENIED by default.
> Implement using Laravel Policies. Never check roles directly in controllers.

### Permission Definitions

| Action | Resident | Trader | Admin | Notes |
|---|---|---|---|---|
| **AUTH** | | | | |
| Register (resident/trader) | ✅ | ✅ | ❌ | Admin accounts seeded only |
| Login | ✅ | ✅ | ✅ | |
| Update own profile | ✅ | ✅ | ✅ | |
| Change own password | ✅ | ✅ | ✅ | |
| **MARKETS** | | | | |
| View markets & stall map | ✅ | ✅ | ✅ | Public — no login required |
| Create / edit / delete market | ❌ | ❌ | ✅ | |
| **TRADERS** | | | | |
| View verified trader profiles | ✅ | ✅ | ✅ | Public — no login required |
| View unverified trader profiles | ❌ | ❌ | ✅ | Admin only |
| Create own trader profile | ❌ | ✅ | ❌ | One profile per trader account |
| Edit own trader profile | ❌ | ✅ | ❌ | |
| Edit any trader profile | ❌ | ❌ | ✅ | |
| Toggle own open/closed status | ❌ | ✅ | ❌ | |
| Verify / reject trader | ❌ | ❌ | ✅ | |
| Deactivate any trader | ❌ | ❌ | ✅ | |
| **PRODUCTS** | | | | |
| View active products | ✅ | ✅ | ✅ | Public — no login required |
| Create product (own stall only) | ❌ | ✅ | ❌ | |
| Edit product (own stall only) | ❌ | ✅ | ❌ | |
| Delete product (own stall only) | ❌ | ✅ | ❌ | |
| Update stock status (own only) | ❌ | ✅ | ❌ | |
| Manage any trader's products | ❌ | ❌ | ✅ | |
| **RESERVATIONS** | | | | |
| Create reservation | ✅ | ❌ | ❌ | Residents only |
| View own reservations | ✅ | ✅ | ✅ | Traders see incoming, residents see outgoing |
| Cancel own reservation | ✅ | ❌ | ✅ | Within cancellation window |
| Mark reservation as ready | ❌ | ✅ | ❌ | Trader confirms item ready for pickup |
| Mark reservation as complete | ❌ | ✅ | ✅ | |
| View all reservations | ❌ | ❌ | ✅ | |
| **PAYMENTS** | | | | |
| Initiate M-Pesa payment | ✅ | ✅ | ❌ | Residents for reservations, traders for fees |
| View own payment history | ✅ | ✅ | ❌ | |
| View all payments | ❌ | ❌ | ✅ | |
| Issue refund | ❌ | ❌ | ✅ | Manual process — admin only |
| **MARKET FEES** | | | | |
| View own fee balance | ❌ | ✅ | ❌ | |
| Pay own market fee | ❌ | ✅ | ❌ | |
| View all fees | ❌ | ❌ | ✅ | |
| Generate monthly fee invoices | ❌ | ❌ | ✅ | |
| Waive a fee | ❌ | ❌ | ✅ | |
| **STALLS** | | | | |
| View stall map (occupancy only) | ✅ | ✅ | ✅ | Public |
| Create / edit / delete stalls | ❌ | ❌ | ✅ | |
| Apply for stall | ❌ | ✅ | ❌ | Unallocated traders only |
| View stall applications | ❌ | ✅ (own) | ✅ | |
| Approve / reject stall application | ❌ | ❌ | ✅ | |
| Allocate stall to trader | ❌ | ❌ | ✅ | |
| Revoke stall allocation | ❌ | ❌ | ✅ | |
| **REVIEWS** | | | | |
| Leave review on completed reservation | ✅ | ❌ | ❌ | One per reservation |
| View all reviews | ✅ | ✅ | ✅ | |
| Hide / remove a review | ❌ | ❌ | ✅ | Moderation only |
| **COMPLAINTS** | | | | |
| Submit complaint | ✅ | ✅ | ❌ | |
| View own complaints | ✅ | ✅ | ❌ | |
| View all complaints | ❌ | ❌ | ✅ | |
| Update complaint status / respond | ❌ | ❌ | ✅ | |
| **NOTICES** | | | | |
| View notices | ✅ | ✅ | ✅ | |
| Create / edit / delete notices | ❌ | ❌ | ✅ | |
| **NOTIFICATIONS** | | | | |
| View own notifications | ✅ | ✅ | ✅ | |
| Mark own notifications as read | ✅ | ✅ | ✅ | |
| Send broadcast notifications | ❌ | ❌ | ✅ | |
| **ANALYTICS** | | | | |
| View own trader analytics | ❌ | ✅ | ❌ | Own data only |
| View county-wide analytics | ❌ | ❌ | ✅ | |
| Export reports | ❌ | ❌ | ✅ | |
| **WATCHLIST** | | | | |
| Add / remove product from watchlist | ✅ | ❌ | ❌ | |
| View own watchlist | ✅ | ❌ | ❌ | |

### Edge Cases — Read Carefully

1. **Can a trader also browse as a resident?**
   No. Roles are mutually exclusive. A trader account cannot make reservations.
   If a trader wants to buy, they must register a separate resident account.

2. **Can admin make reservations or place orders?**
   No. Admin is an operational role only, not a shopper role.

3. **Can a trader see other traders' products?**
   Yes — read-only, same as any public user. This is intentional (market price awareness).

4. **What happens when a trader's verification is revoked?**
   Their products become hidden from search. Existing active reservations continue to
   completion. New reservations are blocked. Their stall status returns to 'available'.

5. **Can a resident leave a review without completing a reservation?**
   No. Reviews are locked to a completed `reservation_id`. No free-text reviews allowed.

6. **Who can cancel a reservation?**
   - Resident: only if status is `pending` (before payment) or within 1 hour of payment
   - Admin: at any time, with a mandatory reason recorded
   - Trader: cannot cancel — they must contact admin

### Laravel Policy Implementation

Create a policy for each major resource. Example for `ReservationPolicy.php`:
```php
public function cancel(User $user, Reservation $reservation): bool
{
    // Admin can always cancel
    if ($user->role === 'admin') return true;

    // Resident can cancel own pending reservations only
    if ($user->role === 'resident') {
        return $reservation->resident_id === $user->id
            && in_array($reservation->status, ['pending', 'paid'])
            && $reservation->created_at->diffInHours(now()) <= 1;
    }

    return false;
}
```

Register all policies in `AuthServiceProvider.php` and always call them via
`$this->authorize()` in controllers — never do manual role checks inline.

---

> **Last updated:** 2025 | **Project:** Soko Mtaa | **Stack:** Laravel 11 + Next.js 14 + MySQL
> Any AI agent reading this file must follow these instructions completely and in order.
> Do not make architectural decisions not specified here without flagging them first.
> Sections 21–24 added: API Response Format, Error Handling Strategy, Database Seeder Plan, Roles & Permissions Matrix.

---

## 25. ONBOARDING FLOWS (UX)

> First impressions determine adoption. These flows must be smooth, friendly, low-friction,
> and fully functional on a 360px Android screen with 3G connectivity.
> Every step must show progress. No user should ever feel lost or stuck.

---

### 25A. RESIDENT ONBOARDING FLOW

**Goal:** Get a resident from download → first reservation in under 3 minutes.

```
STEP 1 — SPLASH & LANGUAGE SELECTION
┌─────────────────────────────┐
│        [Soko Mtaa Logo]     │
│   Karibu! / Welcome!        │
│                             │
│   Choose your language:     │
│   ┌─────────┐ ┌─────────┐  │
│   │ Kiswahili│ │ English │  │
│   └─────────┘ └─────────┘  │
│                             │
│   [This can be changed      │
│    anytime in settings]     │
└─────────────────────────────┘
  ↓
STEP 2 — PHONE NUMBER ENTRY
┌─────────────────────────────┐
│   ← Back                    │
│   Ingiza Nambari Yako       │
│   Enter Your Phone Number   │
│                             │
│   [+254] [7XX XXX XXX    ]  │
│                             │
│   Tutakutumia nambari ya    │
│   uthibitisho               │
│   (We'll send you an OTP)   │
│                             │
│   [████ Endelea / Continue] │
└─────────────────────────────┘
  ↓
STEP 3 — OTP VERIFICATION
┌─────────────────────────────┐
│   ← Back          (1 of 3)  │
│                             │
│   Thibitisha Nambari Yako   │
│   Verify Your Number        │
│                             │
│   Code sent to 07XX XXX XX  │
│                             │
│   [_] [_] [_] [_] [_] [_]  │
│   (auto-focus OTP boxes)    │
│                             │
│   Hukupata? Tuma tena (45s) │
│   Didn't get it? Resend     │
│                             │
│   [████ Thibitisha/Verify]  │
└─────────────────────────────┘
  ↓
STEP 4 — NAME ENTRY (minimal)
┌─────────────────────────────┐
│   ← Back          (2 of 3)  │
│                             │
│   Jina lako ni nani?        │
│   What's your name?         │
│                             │
│   [Jina la Kwanza / Name  ] │
│                             │
│   (This is shown to traders │
│    when you make a order)   │
│                             │
│   [████ Endelea / Continue] │
└─────────────────────────────┘
  ↓
STEP 5 — MARKET SELECTION
┌─────────────────────────────┐
│   ← Back          (3 of 3)  │
│                             │
│   Chagua Soko Lako          │
│   Choose Your Market        │
│                             │
│   📍 Soko karibu nawe:      │
│   Markets near you:         │
│                             │
│   ┌─────────────────────┐   │
│   │ 🏪 Kolenyo Market   │   │
│   │ Kolenyo Estate      │   │
│   │ 0.3 km away    [>]  │   │
│   └─────────────────────┘   │
│                             │
│   [Tazama soko zote /       │
│    See all markets]         │
└─────────────────────────────┘
  ↓
STEP 6 — WELCOME COMPLETE
┌─────────────────────────────┐
│                             │
│   ✅  Umefanikiwa!          │
│       You're all set!       │
│                             │
│   Karibu Soko Mtaa,         │
│   [Name]!                   │
│                             │
│   Unaweza sasa:             │
│   • Tafuta wachuuzi         │
│   • Ona bei za bidhaa       │
│   • Hifadhi bidhaa          │
│                             │
│   [████ Tazama Soko /       │
│        Explore Market]      │
└─────────────────────────────┘
```

**UX Rules for Resident Onboarding:**
- Steps 1–6 must complete in under 90 seconds on a slow connection
- OTP boxes must auto-advance on each digit entry
- OTP must auto-submit when 6th digit is entered
- Market selection uses geolocation (with permission prompt) to sort by proximity
- If geolocation denied, show alphabetical list of markets
- Language choice is saved immediately to `localStorage` before any API call
- No password required — phone + OTP is the only auth method for residents
- Skip button is NOT offered — all steps are required but kept minimal

---

### 25B. TRADER ONBOARDING FLOW

**Goal:** Guide a trader from registration → verified profile → first product listed.
This is a multi-session flow. Traders may complete it across 2–3 sessions.

```
SESSION 1 — REGISTRATION (Same as resident steps 1–4, role = 'trader')
  ↓
TRADER DASHBOARD — SETUP PROGRESS BANNER
┌─────────────────────────────────────────┐
│ ⚠️  Wasifu wako haujawaka bado          │
│     Your profile is not live yet        │
│                                         │
│ ████████░░░░░░░░░░  40% Complete        │
│                                         │
│ ✅ Nambari imethibitishwa               │
│ ✅ Jina la biashara limewekwa           │
│ ⏳ Picha ya leseni / Permit photo       │
│ ⏳ Nambari ya M-Pesa                    │
│ ⏳ Inasubiri idhini ya admin            │
│                                         │
│ [████ Kamilisha Wasifu / Complete]      │
└─────────────────────────────────────────┘

PROFILE SETUP — STEP 1: Business Identity
┌─────────────────────────────────────────┐
│ ← Back                      (1 of 4)   │
│                                         │
│ Biashara Yako / Your Business           │
│                                         │
│ Jina la Biashara *                      │
│ [Mama Wanjiru's Mboga         ]         │
│                                         │
│ Jina kwa Kiswahili (optional)           │
│ [Duka la Mboga la Mama Wanjiru]         │
│                                         │
│ Maelezo mafupi / Description            │
│ [Fresh vegetables daily from  ]         │
│ [local farms...               ]         │
│                                         │
│ [████ Endelea / Continue      ]         │
└─────────────────────────────────────────┘

PROFILE SETUP — STEP 2: Market & Stall
┌─────────────────────────────────────────┐
│ ← Back                      (2 of 4)   │
│                                         │
│ Uko Wapi? / Where Are You?              │
│                                         │
│ Chagua Soko / Select Market             │
│ [▼ Kolenyo Market              ]        │
│                                         │
│ Una standi? / Do you have a stall?      │
│ ◉ Ndiyo, nina standi (Yes)              │
│ ○ Hapana, nataka kuomba (No, apply)     │
│                                         │
│ [If yes → stall number input appears]   │
│ Nambari ya Standi / Stall Number        │
│ [A1                            ]        │
│                                         │
│ [████ Endelea / Continue      ]         │
└─────────────────────────────────────────┘

PROFILE SETUP — STEP 3: Payment & Documents
┌─────────────────────────────────────────┐
│ ← Back                      (3 of 4)   │
│                                         │
│ Malipo / Payments                       │
│                                         │
│ Nambari yako ya M-Pesa *               │
│ [07XX XXX XXX                 ]         │
│ (Wateja watalipa nambari hii)           │
│ (Customers will pay this number)        │
│                                         │
│ ─────────────────────────────           │
│                                         │
│ Leseni ya Soko / Market Permit          │
│                                         │
│ ┌───────────────────────────┐           │
│ │  📷 Piga Picha / Take     │           │
│ │     Photo of Permit       │           │
│ │   or Upload from Gallery  │           │
│ └───────────────────────────┘           │
│                                         │
│ [████ Endelea / Continue      ]         │
└─────────────────────────────────────────┘

PROFILE SETUP — STEP 4: Trading Hours
┌─────────────────────────────────────────┐
│ ← Back                      (4 of 4)   │
│                                         │
│ Masaa ya Biashara / Trading Hours       │
│                                         │
│ Unafungua saa ngapi?                    │
│ Opening time:                           │
│ [▼ 6:00 AM                    ]         │
│                                         │
│ Unafunga saa ngapi?                     │
│ Closing time:                           │
│ [▼ 6:00 PM                    ]         │
│                                         │
│ 💡 Unaweza kubadilisha hii wakati       │
│    wowote kwenye wasifu wako            │
│    (You can update this anytime)        │
│                                         │
│ [████ Wasilisha / Submit Profile]       │
└─────────────────────────────────────────┘

SUBMISSION CONFIRMATION
┌─────────────────────────────────────────┐
│                                         │
│   🕐 Wasifu Unapitiwa                  │
│      Profile Under Review               │
│                                         │
│   Asante [Name]! Wasifu wako           │
│   umewasilishwa kwa ukaguzi.            │
│                                         │
│   Utapata ujumbe wa SMS ndani           │
│   ya masaa 24 ukijua iwapo             │
│   umeidhinishwa.                        │
│                                         │
│   You'll receive an SMS within          │
│   24 hours with your approval status.  │
│                                         │
│   Wakati unasubiri, unaweza:            │
│   While waiting, you can:               │
│   → Ongeza bidhaa zako (zitaonekana    │
│     baada ya idhini)                   │
│   → Add products (visible after         │
│     approval)                           │
│                                         │
│   [████ Ongeza Bidhaa / Add Products]  │
│   [○ Rudi Baadaye / Come Back Later]   │
└─────────────────────────────────────────┘
```

**UX Rules for Trader Onboarding:**
- Progress bar must persist across sessions — trader can exit and resume
- Permit photo upload must support camera capture directly on mobile
- If trader selects "No stall", redirect to stall application form after profile completion
- Validation errors shown inline immediately — never block progression silently
- Trader can add products during `pending` verification — products activate upon approval
- The setup progress banner shows on every trader dashboard page until 100% complete
- Admin receives an in-app notification and email immediately upon submission

---

### 25C. ADMIN FIRST-LOGIN FLOW

```
FIRST LOGIN DETECTED → Force password change
┌─────────────────────────────────────────┐
│   🔐 Badilisha Nenosiri                 │
│      Change Your Password               │
│                                         │
│   Kwa usalama, tafadhali weka           │
│   nenosiri jipya kabla ya kuendelea.    │
│   For security, set a new password      │
│   before continuing.                    │
│                                         │
│   Nenosiri Jipya / New Password         │
│   [                              ]  👁  │
│                                         │
│   Thibitisha / Confirm Password         │
│   [                              ]  👁  │
│                                         │
│   [████ Hifadhi / Save & Continue]     │
└─────────────────────────────────────────┘
  ↓
ADMIN DASHBOARD TOUR (4-step tooltip tour)
  Tip 1: "Hapa unaona muhtasari wa soko" → Dashboard overview
  Tip 2: "Hapa unaidhinisha wachuuzi wapya" → Pending verifications
  Tip 3: "Hapa unasimamia malalamiko" → Complaints panel
  Tip 4: "Hapa unasimamia stendi na mgao" → Stall management
  [Skip Tour] button always visible
```

---

### 25D. EMPTY STATE DESIGNS

Every major page must have a defined empty state. Never show a blank list.

| Page | Swahili Empty State | English Empty State | Icon | Action Button |
|---|---|---|---|---|
| Resident Home (no traders) | "Hakuna wachuuzi bado katika soko hili" | "No traders yet in this market" | 🏪 | "Angalia masoko mengine" |
| Search Results (no match) | "Hakuna bidhaa zinazolingana na utafutaji wako" | "No products match your search" | 🔍 | "Futa utafutaji" |
| Reservations (none yet) | "Bado hujahifadhi bidhaa yoyote" | "You haven't reserved anything yet" | 📋 | "Tafuta bidhaa" |
| Trader Products (none) | "Bado hujaongeza bidhaa yoyote" | "You haven't added any products yet" | 📦 | "Ongeza Bidhaa" |
| Trader Reservations (none) | "Bado hujapata order yoyote" | "No orders received yet" | 🛒 | null |
| Admin Complaints (none) | "Hakuna malalamiko wazi" | "No open complaints" | ✅ | null |
| Notifications (none) | "Hakuna arifa mpya" | "No new notifications" | 🔔 | null |
| Notice Board (none) | "Hakuna matangazo kwa sasa" | "No notices at this time" | 📢 | null |

---

## 26. NOTIFICATION TEMPLATES

> Every notification must have: an in-app version, an SMS version, and follow-up timing.
> SMS must be under 160 characters (single SMS unit) wherever possible.
> All messages are in Swahili by default with English fallback based on user preference.
> Never send more than 3 SMS per day to the same user — implement rate limiting.

### Notification Channels Per Event

| Event | In-App | SMS | Who Receives |
|---|---|---|---|
| OTP Verification | ❌ | ✅ | User registering |
| Registration Success | ✅ | ✅ | New user |
| Trader Profile Submitted | ✅ | ✅ | Trader + Admin |
| Trader Approved | ✅ | ✅ | Trader |
| Trader Rejected | ✅ | ✅ | Trader |
| New Reservation | ✅ | ✅ | Trader |
| Reservation Confirmed (paid) | ✅ | ✅ | Resident |
| Item Ready for Pickup | ✅ | ✅ | Resident |
| Reservation Pickup Reminder | ✅ | ✅ | Resident |
| Reservation Expired | ✅ | ❌ | Resident + Trader |
| Reservation Cancelled | ✅ | ✅ | Both parties |
| Payment Successful | ✅ | ✅ | Payer |
| Payment Failed | ✅ | ❌ | Payer |
| Market Fee Due (3 days before) | ✅ | ✅ | Trader |
| Market Fee Overdue | ✅ | ✅ | Trader |
| Market Fee Paid | ✅ | ✅ | Trader |
| Complaint Received | ✅ | ❌ | Admin |
| Complaint Status Updated | ✅ | ✅ | Complainant |
| Complaint Resolved | ✅ | ✅ | Complainant |
| Stall Application Submitted | ✅ | ❌ | Admin |
| Stall Application Approved | ✅ | ✅ | Trader |
| Stall Application Rejected | ✅ | ✅ | Trader |
| New Market Notice | ✅ | ❌ | All users in market |
| Product Back In Stock | ✅ | ❌ | Watchlist users |
| New Review Received | ✅ | ❌ | Trader |
| Low Stock Alert | ✅ | ❌ | Trader (self-alert) |

---

### Full Template Reference

Each template is defined in this format:
- **[SW]** = Swahili version (default)
- **[EN]** = English version (fallback)
- **{variable}** = dynamic placeholder
- **[SMS]** = what goes in the SMS (≤160 chars)
- **[IN-APP TITLE]** / **[IN-APP BODY]** = what shows in notification center

---

#### T01 — OTP Verification
```
[SMS-SW] Nambari yako ya uthibitisho ni: {otp}. Halali kwa dakika 10. Usishiriki na mtu yeyote. - Soko Mtaa
[SMS-EN] Your Soko Mtaa verification code is: {otp}. Valid for 10 minutes. Do not share this code.
```

---

#### T02 — Registration Success
```
[IN-APP TITLE-SW] Karibu Soko Mtaa! 🎉
[IN-APP BODY-SW]  Akaunti yako imefunguliwa. Anza kuchunguza soko sasa hivi.

[IN-APP TITLE-EN] Welcome to Soko Mtaa! 🎉
[IN-APP BODY-EN]  Your account is ready. Start exploring your local market.

[SMS-SW] Karibu Soko Mtaa, {name}! Akaunti yako imefunguliwa. Anza kununua leo. sokomtaa.co.ke
[SMS-EN] Welcome to Soko Mtaa, {name}! Your account is ready. Start shopping today. sokomtaa.co.ke
```

---

#### T03 — Trader Profile Submitted (to Admin)
```
[IN-APP TITLE] Mchuuzi Mpya Anasubiri Idhini
[IN-APP BODY]  {trader_name} ({business_name}) amewasilisha ombi la kujiunga. Pitia sasa.

[IN-APP TITLE-EN] New Trader Awaiting Verification
[IN-APP BODY-EN]  {trader_name} ({business_name}) has submitted a registration request. Review now.
```
> Note: No SMS to admin — admin uses the dashboard.

---

#### T04 — Trader Profile Submitted (to Trader)
```
[IN-APP TITLE-SW] Ombi Lako Limepokelewa ✅
[IN-APP BODY-SW]  Wasifu wako umewasilishwa kwa ukaguzi. Utaarifiwa ndani ya masaa 24.

[IN-APP TITLE-EN] Your Application Was Received ✅
[IN-APP BODY-EN]  Your trader profile has been submitted for review. You'll hear back within 24 hours.

[SMS-SW] Soko Mtaa: Asante {name}! Wasifu wako unapitiwa. Utapata jibu ndani ya masaa 24.
[SMS-EN] Soko Mtaa: Thanks {name}! Your trader profile is under review. Expect a response within 24hrs.
```

---

#### T05 — Trader Approved
```
[IN-APP TITLE-SW] 🎉 Umeidhinishwa! Duka lako liko hai!
[IN-APP BODY-SW]  Hongera {name}! Wasifu wako umeidhinishwa. Wateja sasa wanaweza kukupata. Ongeza bidhaa zaidi ili upate mauzo mengi!

[IN-APP TITLE-EN] 🎉 You're Approved! Your shop is live!
[IN-APP BODY-EN]  Congratulations {name}! Your profile is verified. Customers can now find you. Add more products to maximize sales!

[SMS-SW] Soko Mtaa: Hongera {name}! Duka lako {business_name} limeidhinishwa na liko hai sasa. Ongeza bidhaa: sokomtaa.co.ke
[SMS-EN] Soko Mtaa: Congrats {name}! Your shop {business_name} is approved and live. Add products: sokomtaa.co.ke
```

---

#### T06 — Trader Rejected
```
[IN-APP TITLE-SW] ⚠️ Ombi Halikubaliwa
[IN-APP BODY-SW]  Samahani {name}, ombi lako halikubaliwa. Sababu: {rejection_reason}. Unaweza kurekebisha na kuwasilisha tena.

[IN-APP TITLE-EN] ⚠️ Application Not Approved
[IN-APP BODY-EN]  Sorry {name}, your application was not approved. Reason: {rejection_reason}. You may correct and resubmit.

[SMS-SW] Soko Mtaa: Ombi lako {name} halikubaliwa. Sababu: {rejection_reason}. Wasiliana nasi kwa msaada.
[SMS-EN] Soko Mtaa: Your application {name} was not approved. Reason: {rejection_reason}. Contact us for help.
```

---

#### T07 — New Reservation (to Trader)
```
[IN-APP TITLE-SW] 🛒 Order Mpya! #{reservation_code}
[IN-APP BODY-SW]  {resident_name} amehifadhi {quantity}x {product_name} kwa KES {amount}. Andaa bidhaa hii. Muda wa kukusanya: masaa 24.

[IN-APP TITLE-EN] 🛒 New Order! #{reservation_code}
[IN-APP BODY-EN]  {resident_name} reserved {quantity}x {product_name} for KES {amount}. Prepare this item. Pickup window: 24 hours.

[SMS-SW] SokoMtaa: Order #{reservation_code} - {resident_name} amehifadhi {product_name} x{quantity}. KES {amount}. Andaa bidhaa sasa.
[SMS-EN] SokoMtaa: Order #{reservation_code} - {resident_name} reserved {product_name} x{quantity}. KES {amount}. Prepare now.
```

---

#### T08 — Reservation Confirmed / Payment Success (to Resident)
```
[IN-APP TITLE-SW] ✅ Malipo Yamefanikiwa! #{reservation_code}
[IN-APP BODY-SW]  Umelipa KES {amount} kwa {product_name} kutoka {business_name}. Nenda kukusanya bidhaa yako kwenye stendi {stall_number} kabla ya {pickup_deadline}.

[IN-APP TITLE-EN] ✅ Payment Confirmed! #{reservation_code}
[IN-APP BODY-EN]  You paid KES {amount} for {product_name} from {business_name}. Pick it up at stall {stall_number} before {pickup_deadline}.

[SMS-SW] SokoMtaa: Malipo ya KES {amount} yamefanikiwa! Code: #{reservation_code}. Chukua {product_name} kwenye stendi {stall_number} kabla ya {pickup_deadline}.
[SMS-EN] SokoMtaa: Payment of KES {amount} confirmed! Code: #{reservation_code}. Collect {product_name} at stall {stall_number} by {pickup_deadline}.
```

---

#### T09 — Item Ready for Pickup (to Resident)
```
[IN-APP TITLE-SW] 📦 Bidhaa Yako Iko Tayari!
[IN-APP BODY-SW]  {product_name} yako iko tayari kukusanywa kwenye stendi {stall_number} - {business_name}. Kumbuka kukusanya kabla ya {pickup_deadline}.

[IN-APP TITLE-EN] 📦 Your Item Is Ready!
[IN-APP BODY-EN]  Your {product_name} is ready for collection at stall {stall_number} - {business_name}. Remember to collect before {pickup_deadline}.

[SMS-SW] SokoMtaa: {product_name} yako iko tayari! Stendi {stall_number}. Chukua kabla ya {pickup_deadline}. Code: #{reservation_code}
[SMS-EN] SokoMtaa: Your {product_name} is ready! Stall {stall_number}. Collect by {pickup_deadline}. Code: #{reservation_code}
```

---

#### T10 — Pickup Reminder (2 hours before deadline)
```
[IN-APP TITLE-SW] ⏰ Ukumbusho: Chukua Bidhaa Yako
[IN-APP BODY-SW]  Una masaa 2 tu kukusanya {product_name} kutoka stendi {stall_number}. Usikose!

[IN-APP TITLE-EN] ⏰ Reminder: Collect Your Item
[IN-APP BODY-EN]  You have 2 hours left to collect {product_name} from stall {stall_number}. Don't miss it!

[SMS-SW] SokoMtaa: Kumbuka! Masaa 2 tu kukusanya {product_name} stendi {stall_number}. Code: #{reservation_code}
[SMS-EN] SokoMtaa: Reminder! 2hrs left to collect {product_name} stall {stall_number}. Code: #{reservation_code}
```

---

#### T11 — Reservation Cancelled
```
[IN-APP TITLE-SW] ❌ Hifadhi Imefutwa #{reservation_code}
[IN-APP BODY-SW-RESIDENT]  Hifadhi yako ya {product_name} imefutwa. {cancellation_reason}
[IN-APP BODY-SW-TRADER]    Hifadhi #{reservation_code} ya {product_name} imefutwa na mteja.

[IN-APP TITLE-EN] ❌ Reservation Cancelled #{reservation_code}
[IN-APP BODY-EN-RESIDENT]  Your reservation for {product_name} has been cancelled. {cancellation_reason}
[IN-APP BODY-EN-TRADER]    Reservation #{reservation_code} for {product_name} was cancelled by the customer.

[SMS-SW] SokoMtaa: Hifadhi #{reservation_code} ({product_name}) imefutwa. {cancellation_reason} Wasiliana nasi kwa msaada.
[SMS-EN] SokoMtaa: Reservation #{reservation_code} ({product_name}) cancelled. {cancellation_reason} Contact us for help.
```

---

#### T12 — Market Fee Due (3 days before)
```
[IN-APP TITLE-SW] 💳 Kumbuka Kulipa Ada ya Soko
[IN-APP BODY-SW]  Ada yako ya soko ya {period} ni KES {amount} na inahitiajika kulipwa ifikapo {due_date}. Lipa sasa ili kuepuka vikwazo.

[IN-APP TITLE-EN] 💳 Market Fee Payment Reminder
[IN-APP BODY-EN]  Your market fee for {period} is KES {amount}, due on {due_date}. Pay now to avoid disruption.

[SMS-SW] SokoMtaa: Ada ya soko {period} = KES {amount}. Inahitajika {due_date}. Lipa sasa: sokomtaa.co.ke
[SMS-EN] SokoMtaa: Market fee {period} = KES {amount} due {due_date}. Pay now at sokomtaa.co.ke
```

---

#### T13 — Market Fee Overdue
```
[IN-APP TITLE-SW] 🚨 Ada ya Soko Imepita Muda!
[IN-APP BODY-SW]  Ada yako ya KES {amount} ({period}) imepita muda. Wasifu wako unaweza kusimamishwa. Lipa sasa hivi.

[IN-APP TITLE-EN] 🚨 Market Fee Overdue!
[IN-APP BODY-EN]  Your fee of KES {amount} ({period}) is overdue. Your profile may be suspended. Pay immediately.

[SMS-SW] SokoMtaa HARAKA: Ada KES {amount} imepita muda! Lipa sasa ili duka lako lisimamishwe: sokomtaa.co.ke
[SMS-EN] SokoMtaa URGENT: Fee KES {amount} overdue! Pay now to avoid profile suspension: sokomtaa.co.ke
```

---

#### T14 — Market Fee Paid
```
[IN-APP TITLE-SW] ✅ Ada ya Soko Imelipwa
[IN-APP BODY-SW]  Asante! Ada yako ya KES {amount} kwa {period} imelipwa. Nambari ya mpango: {transaction_id}.

[IN-APP TITLE-EN] ✅ Market Fee Paid
[IN-APP BODY-EN]  Thank you! Your market fee of KES {amount} for {period} has been received. Ref: {transaction_id}.

[SMS-SW] SokoMtaa: Ada KES {amount} ({period}) imelipwa. Ref: {transaction_id}. Asante kwa ushirikiano wako!
[SMS-EN] SokoMtaa: Fee KES {amount} ({period}) received. Ref: {transaction_id}. Thank you!
```

---

#### T15 — Complaint Status Updated
```
[IN-APP TITLE-SW] 📋 Hali ya Malalamiko Imebadilika
[IN-APP BODY-SW]  Malalamiko yako #{complaint_id} ({subject}): {new_status}. {admin_response}

[IN-APP TITLE-EN] 📋 Complaint Status Updated
[IN-APP BODY-EN]  Your complaint #{complaint_id} ({subject}) is now: {new_status}. {admin_response}

[SMS-SW] SokoMtaa: Malalamiko #{complaint_id} hali mpya: {new_status}. Angalia maelezo zaidi kwenye programu.
[SMS-EN] SokoMtaa: Complaint #{complaint_id} status: {new_status}. Check the app for more details.
```

---

#### T16 — Stall Application Approved
```
[IN-APP TITLE-SW] 🏪 Ombi la Standi Limeidhinishwa!
[IN-APP BODY-SW]  Hongera! Umepewa standi {stall_number} - Eneo {zone} katika {market_name}. Anza kutumia standi yako sasa.

[IN-APP TITLE-EN] 🏪 Stall Application Approved!
[IN-APP BODY-EN]  Congratulations! You have been allocated stall {stall_number} - Zone {zone} at {market_name}. Start using your stall now.

[SMS-SW] SokoMtaa: Hongera! Standi {stall_number} ({market_name}) imekupewa. Ingia kwenye programu kwa maelezo zaidi.
[SMS-EN] SokoMtaa: Congrats! Stall {stall_number} at {market_name} has been allocated to you. Open the app for details.
```

---

#### T17 — Product Back In Stock (Watchlist Alert)
```
[IN-APP TITLE-SW] 🔔 Bidhaa Unayoipenda Ipo Tena!
[IN-APP BODY-SW]  {product_name} kutoka {business_name} inapatikana tena. Hifadhi kabla haijaisha!

[IN-APP TITLE-EN] 🔔 A Product You Wanted Is Back!
[IN-APP BODY-EN]  {product_name} from {business_name} is available again. Reserve before it runs out!
```
> Note: No SMS for watchlist alerts — in-app only to avoid over-messaging.

---

#### T18 — New Review Received (to Trader)
```
[IN-APP TITLE-SW] ⭐ Tathmini Mpya - {rating}/5
[IN-APP BODY-SW]  {resident_name} amekuachia tathmini: "{comment_preview}". Endelea na huduma nzuri!

[IN-APP TITLE-EN] ⭐ New Review - {rating}/5
[IN-APP BODY-EN]  {resident_name} left you a review: "{comment_preview}". Keep up the great service!
```

---

### Notification Implementation in Laravel

```php
// app/Services/NotificationService.php

class NotificationService
{
    public function send(User $user, string $template, array $data): void
    {
        // 1. Always create in-app notification
        $this->createInApp($user, $template, $data);

        // 2. Send SMS only if template requires it and daily limit not exceeded
        if ($this->shouldSendSms($template) && $this->withinSmsLimit($user)) {
            dispatch(new SendSmsNotification($user, $template, $data));
        }
    }

    private function withinSmsLimit(User $user): bool
    {
        $todayCount = \DB::table('sms_log')
            ->where('user_id', $user->id)
            ->whereDate('sent_at', today())
            ->count();

        return $todayCount < 3; // Max 3 SMS per day per user
    }

    private function shouldSendSms(string $template): bool
    {
        $smsTemplates = [
            'T01', 'T02', 'T04', 'T05', 'T06',
            'T07', 'T08', 'T09', 'T10', 'T11',
            'T12', 'T13', 'T14', 'T15', 'T16',
        ];
        return in_array($template, $smsTemplates);
    }
}
```

Create `sms_log` table to track daily SMS per user:
```php
Schema::create('sms_log', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('template');
    $table->string('phone');
    $table->text('message');
    $table->enum('status', ['sent', 'failed'])->default('sent');
    $table->timestamp('sent_at')->useCurrent();
});
```

---

## 27. SYSTEM STANDOUT FEATURES

> These features are what will make Soko Mtaa unlike any other platform.
> They must be built with exceptional attention to detail.
> Each one is a deliberate design decision to serve the Kenyan informal market context.

---

### 27A. TRADER OPEN/CLOSED LIVE STATUS

Every trader card and profile shows a real-time open/closed badge.

**Rules:**
- Status is calculated from `opening_time` and `closing_time` fields automatically
- Trader can manually override with a "Close Today" toggle (e.g. sick day, holiday)
- Override resets automatically at midnight
- Closed traders appear in search results but are visually dimmed with "Imefungwa / Closed" badge
- Residents can still view their profile and products — just cannot reserve

**Visual:**
```
┌──────────────────────────────┐
│ 🟢 Wazi / Open  ·  Stendi A1 │   ← Green dot pulses
│ Mama Wanjiru's Mboga         │
│ ⭐ 4.8  ·  127 mauzo        │
└──────────────────────────────┘

┌──────────────────────────────┐
│ 🔴 Imefungwa / Closed        │   ← Dimmed card
│ Mama Wanjiru's Mboga         │
│ Inafungua saa 12 asubuhi     │
│ Opens at 6:00 AM tomorrow    │
└──────────────────────────────┘
```

---

### 27B. MARKET HEAT MAP (STALL DIRECTORY)

The stall map is not just a static diagram. It shows live occupancy data.

**Color coding for stalls:**
- 🟢 Green — Occupied & Open (trader is trading right now)
- 🟡 Yellow — Occupied but Closed (trader exists, not currently open)
- 🔵 Blue — Reserved (allocation approved, trader not yet active)
- ⬜ Gray — Available (no trader assigned)
- 🔴 Red — Under Maintenance

**Interaction on tap:**
- If occupied → show mini trader card with name, category, rating, "View Profile" button
- If available → show "Standi inapatikana / Stall Available" + "Omba / Apply" button (for logged-in traders without stalls)
- If maintenance → show "Inakarabatiwa / Under Maintenance" + estimated return date if set

**Implementation notes:**
- Built with Leaflet.js using a custom market floor-plan overlay
- Stall positions defined by `map_x` and `map_y` coordinates in the `stalls` table
- Refreshes every 60 seconds automatically
- Works offline using cached data (shows "Data kutoka akiba / Data from cache" notice)

---

### 27C. RESERVATION PICKUP CODE SYSTEM

Every completed reservation gets a unique 8-character alphanumeric pickup code.

**Format:** `SM-{XXXXXXXX}` e.g. `SM-K7B2QX91`

**How it works:**
- Resident shows the code to the trader at pickup (displayed large on screen)
- Trader enters the code in their app to mark as "Completed"
- Code is single-use — expires immediately after marking complete
- Code expires 24 hours after item is marked "Ready" by trader
- Large QR code display option on resident's reservation screen for easy scanning

**UI for Resident (pickup screen):**
```
┌──────────────────────────────┐
│ 📦 Chukua Bidhaa Yako       │
│    Collect Your Item         │
│                              │
│      ╔══════════════╗        │
│      ║              ║        │
│      ║   [QR CODE]  ║        │
│      ║              ║        │
│      ╚══════════════╝        │
│                              │
│   SM-K7B2QX91               │
│   (code in large mono font)  │
│                              │
│   Onyesha hii kwa mchuuzi   │
│   Show this to your trader   │
│                              │
│   📍 Stendi A1 · Mama Wanjiru│
│   ⏰ Chukua kabla ya 6:00 PM │
└──────────────────────────────┘
```

---

### 27D. TRADER DAILY SUMMARY NOTIFICATION

Every evening at 7:00 PM (scheduled job), each trader receives a daily summary:

**In-app only (no SMS — respects the 3 SMS/day limit):**
```
📊 Muhtasari wa Leo / Today's Summary

Orders leo: 12
Mapato: KES 3,450
Bidhaa maarufu: Nyanya (8 orders)
Rating ya leo: ⭐ 4.9
Watu waliotazama wasifu: 34

Kesho: Jua, 28°C - Siku nzuri ya biashara! ☀️
Tomorrow: Sunny, 28°C - Great trading day! ☀️
```

**Implementation:**
- Scheduled via Laravel's task scheduler at 19:00 daily
- Only sent if trader had at least 1 reservation or profile view that day
- Weather data from Open-Meteo API (free, no key required)
- Motivational message rotates from a curated list of 30 Swahili business proverbs

---

### 27E. SMART PRICE BADGE

On every product card, show a subtle price context badge:

- **"Bei ya kawaida / Fair price"** — within 10% of category average
- **"Bei nzuri! / Great deal!"** — more than 15% below category average → green badge
- **"Bei ya juu / Above average"** — more than 15% above category average → subtle orange

**Implementation in `SearchService.php`:**
```php
public function getPriceBadge(Product $product): string
{
    $avg = Product::where('category_id', $product->category_id)
                  ->where('stock_status', '!=', 'out_of_stock')
                  ->avg('price');

    if (!$avg) return 'fair';

    $diff = (($product->price - $avg) / $avg) * 100;

    return match(true) {
        $diff <= -15 => 'great_deal',
        $diff >= 15  => 'above_average',
        default      => 'fair',
    };
}
```

---

### 27F. OFFLINE-FIRST MARKET DIRECTORY

When a user has no connection, they can still:
- Browse the last-cached list of traders and products
- View trader contact details (to call directly)
- See the stall map with last-known occupancy
- See their active reservations and pickup codes

**What they CANNOT do offline:**
- Create new reservations
- Make payments
- Submit complaints or reviews

**Offline UI behavior:**
- Orange banner at top: "Huna muunganiko wa intaneti. Data ya akiba inaonyeshwa. / No internet. Showing cached data."
- All action buttons (Reserve, Pay) are disabled with tooltip: "Unahitaji mtandao / Requires internet"
- Cached data timestamp shown: "Ilisasishwa: leo 2:30 PM / Last updated: today 2:30 PM"

---

### 27G. COUNTY ADMIN EXPORT & REPORTING

Admin can export reports as CSV or PDF for use in county planning meetings:

**Available reports:**
- Trader directory (all verified traders, stall assignments, contact details)
- Monthly fee collection summary (who paid, who hasn't, total collected)
- Reservation activity report (volume by day, by category, by trader)
- Complaint resolution report (open vs resolved, average resolution time)
- Stall occupancy history (which stalls were occupied each month)
- Market performance dashboard (PDF — formatted for presentation)

**Implementation:**
- CSV: Use Laravel's `League\Csv` for fast generation
- PDF: Use `barryvdh/laravel-dompdf` for formatted reports
- All exports are generated as background jobs (queue) to avoid timeout on shared hosting
- Download link emailed to admin when ready (for large reports)
- Files auto-deleted from storage after 48 hours

---

### 27H. SWAHILI-FIRST SEARCH

Search must understand common Swahili market terms and map them to products:

Define a keyword mapping table `search_aliases`:
```php
Schema::create('search_aliases', function (Blueprint $table) {
    $table->id();
    $table->string('alias');          // What user types
    $table->string('maps_to');        // What to search for
    $table->string('language', 5);
    $table->timestamps();
});
```

Seed common aliases:
```php
$aliases = [
    // Swahili nicknames for products
    ['alias' => 'ugali',       'maps_to' => 'unga wa mahindi',  'language' => 'sw'],
    ['alias' => 'sukuma',      'maps_to' => 'sukuma wiki',      'language' => 'sw'],
    ['alias' => 'maembe',      'maps_to' => 'mangoes',          'language' => 'sw'],
    ['alias' => 'chai',        'maps_to' => 'tea leaves',       'language' => 'sw'],
    ['alias' => 'mchele',      'maps_to' => 'rice',             'language' => 'sw'],
    ['alias' => 'nyanya',      'maps_to' => 'tomatoes',         'language' => 'sw'],
    ['alias' => 'vitunguu',    'maps_to' => 'onions',           'language' => 'sw'],
    ['alias' => 'samaki',      'maps_to' => 'fish',             'language' => 'sw'],
    ['alias' => 'nguo za watoto','maps_to' => 'children clothing','language' => 'sw'],
    ['alias' => 'mkaa',        'maps_to' => 'charcoal',         'language' => 'sw'],
];
```

Search resolves the alias before querying:
```php
public function search(string $query): \Illuminate\Database\Eloquent\Builder
{
    $alias = SearchAlias::where('alias', strtolower(trim($query)))->first();
    $searchTerm = $alias ? $alias->maps_to : $query;

    return Product::whereFullText(['name', 'name_sw'], $searchTerm)
                  ->orWhereHas('trader', fn($q) =>
                      $q->whereFullText(['business_name', 'business_name_sw'], $searchTerm)
                  );
}
```

---

### 27I. TRUST & SAFETY BADGES

Display trust indicators on trader profiles that residents can see at a glance:

| Badge | Icon | Criteria |
|---|---|---|
| Mthibitishwa / Verified | ✅ | Admin-verified trader |
| Mwaminifu / Trusted | 🏅 | 50+ completed orders, rating ≥ 4.5 |
| Mpya / New | 🆕 | Verified in last 30 days |
| Anajaza Haraka / Fast Fulfiller | ⚡ | Marks orders ready within 30 min on average |
| Ada Imelipwa / Fee Compliant | 💳 | All market fees paid and up to date |
| Maarufu Leo / Popular Today | 🔥 | 5+ reservations in the last 24 hours |

Badges are computed dynamically — not stored as flags. Recalculated on each profile view.

---

### 27J. ACCESSIBILITY & LOW-END DEVICE OPTIMIZATIONS

These are non-negotiable for Soko Mtaa's target audience:

**Performance targets (measured on a Tecno Spark or equivalent):**
- First Contentful Paint: < 2.5 seconds on 3G
- Time to Interactive: < 4 seconds on 3G
- Largest Contentful Paint: < 3.5 seconds
- Total page weight: < 200KB per route (excluding images)

**Implementation checklist:**
- [ ] All images served via Cloudinary with `q_auto,f_auto,w_400` transformations
- [ ] Next.js `dynamic()` imports for heavy components (map, charts)
- [ ] No third-party analytics scripts that block rendering
- [ ] Font subsetting — load only Latin + Latin Extended character sets
- [ ] `preconnect` hints for Cloudinary and API domain in `<head>`
- [ ] `rel="preload"` on critical above-the-fold images
- [ ] Service worker caches API responses for trader list and categories
- [ ] Reduce motion media query respected for animations
- [ ] All icon buttons have `aria-label` in both Swahili and English
- [ ] Color contrast ratio ≥ 4.5:1 for all text (WCAG AA)
- [ ] Tap targets ≥ 48×48px universally enforced (see Section 2)
- [ ] No layout shift (CLS < 0.1) — reserve space for images with explicit dimensions
- [ ] `autocomplete` attributes on all form fields to reduce typing on mobile

---

> **Last updated:** 2025 | **Project:** Soko Mtaa | **Stack:** Laravel 11 + Next.js 14 + MySQL
> Any AI agent reading this file must follow these instructions completely and in order.
> Do not make architectural decisions not specified here without flagging them first.
> Sections 25–27 added: Onboarding Flows, Notification Templates, System Standout Features.

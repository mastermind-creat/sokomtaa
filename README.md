# Soko Mtaa

**Soko Mtaa** is a neighbourhood-based digital marketplace connecting informal traders, local residents, delivery riders, and county administrators within pilot urban and peri-urban markets in Kenya.

By bringing physical market stalls into a unified digital platform, Soko Mtaa enables product discovery, item reservations, secure M-Pesa payments, AI-assisted shopping, and efficient market administration.

---

## 👥 User Roles

| Role | Description |
|---|---|
| **Trader** | Manages stall, inventory, reservations, and M-Pesa payments. Can register with phone or email. |
| **Resident** | Discovers traders, reserves products, pays via M-Pesa, and interacts with Soko AI. |
| **Delivery Rider** | Handles last-mile delivery from market to doorstep. |
| **Admin** | County official managing stall allocations, KYC verification, fee collection, complaints, and analytics. |

---

## 🛠️ Technology Stack

### Backend — Laravel 11
- **Framework:** Laravel 11 (PHP 8.2+), RESTful JSON API
- **Database:** MySQL 8.0+ with Eloquent ORM
- **Authentication:** Laravel Sanctum (token-based SPA auth) + Social Auth (Google/Apple via Socialite)
- **Queue:** Database driver (shared hosting compatible)
- **Cache:** File driver (upgradeable to Redis)
- **Email:** Gmail SMTP via Laravel Mail (Symfony Mailer) — HTML + plain text templates
- **SMS:** TalkSasa API for OTP and notifications
- **Payments:** M-Pesa Daraja API (STK Push, B2C, custom per-trader credentials)
- **Storage:** Cloudinary for image optimization and delivery
- **AI Services:** OpenAI GPT-4o-mini (primary) + Google Gemini Flash (fallback)
- **Real-time:** Pusher + Web Push notifications

### Frontend — Next.js 14
- **Framework:** Next.js 14 App Router with TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** Zustand (global) + TanStack React Query v5 (server state)
- **Forms:** React Hook Form + Zod validation
- **PWA:** `next-pwa` — installable, offline-capable
- **Maps:** Leaflet.js — interactive stall directory
- **AI Chat:** Vercel AI SDK with tool calling (Groq/OpenAI models)

---

## ✨ Features

### Authentication & Registration
- **Dual registration path:** Phone number (primary, Kenyan market) or Email address
- **Phone registration:** OTP verification via TalkSasa SMS
- **Email registration:** Secure token-based verification link sent via Gmail SMTP (expires in 60 min)
- **Email login toggle:** Login page supports both phone number and email address
- **Password reset:** OTP via SMS for phone users; OTP via email for email-registered users
- **Social authentication:** Google OAuth and Apple Sign-In via Laravel Socialite
- **Cloudflare Turnstile** bot protection on all auth endpoints

### AI-Powered Features (Soko AI)
- **Conversational assistant** embedded as a floating action button across all pages
- **Full marketplace access:** AI queries live product and trader data from the database — no hallucinations
- **Trader lookup:** Searches traders by name, fetches their full product catalogue
- **Reservation on behalf of user:** AI creates reservations and triggers M-Pesa STK push — user only enters their PIN
- **Voice input/output:** Speech recognition (STT) and text-to-speech (TTS) in Kenyan English
- **Agentic tool calling:** Up to 6 chained tool calls per conversation (search → find trader → get products → reserve → pay → track)
- **Role-aware:** Different capabilities for residents, traders, and admins
- **Admin tools:** Market health stats, fee defaulters, complaint summaries

### Search Pipeline (4-Stage)
1. **Alias resolution** — Swahili/English term mapping via `search_aliases` table (e.g. "nyanya" → "tomatoes")
2. **MySQL FULLTEXT** — Natural language full-text index on `products.name`, `name_sw`, `description`
3. **Fuzzy LIKE fallback** — Token-level approximate matching (tokens ≥ 3 chars, capped at 50)
4. **AI query expansion** — `AiService::expandQuery()` for zero-result queries (cached 30 min)
- AI-generated product insights (`ai_insight`) attached per product, cached 24 hours

### Payments (M-Pesa Daraja)
- STK Push for reservations, market fees, wallet top-ups, and product boosts
- **Custom per-trader Daraja credentials** — funds land directly in trader's M-Pesa
- Platform commission auto-billed as a market fee when custom routing is used
- B2C transfers for trader wallet withdrawals
- Wallet system with partial payment coverage and refund on cancellation
- Idempotent callback handling — duplicate callbacks never double-process

### Trader Features
- KYC verification with National ID front/back upload and selfie
- Product management with Cloudinary image upload
- Discount pricing with date-range schedules
- Product visibility boosting (KES 20 / 24 hours)
- Trader analytics dashboard (revenue trends, top products, profile views)
- Real-time open/closed status with business hours enforcement (Africa/Nairobi timezone)
- Stall application and allocation workflow

### Resident Features
- Interactive market map (Leaflet.js, zone-coded occupancy)
- Cart system with multi-trader checkout
- Delivery option with dynamic fee calculation
- Watchlist with back-in-stock notifications
- Review and rating system (one review per completed reservation)
- Pickup code / QR code for reservation collection

### Admin Features
- County dashboard with live metrics (refresh every 60 seconds)
- Merchant registry with KYC audit modal and document preview
- Bulk SMS to any user directly from the admin panel
- Soft-delete support — accounts deleted by traders are automatically hidden from admin views
- Market fee generation, waiver, and overdue tracking
- Complaint management with priority levels and resolution tracking
- CSV/PDF export for county planning reports
- AI planning insights for strategic decisions

### Notifications
- In-app notification centre
- SMS notifications via TalkSasa (max 3 per user per day)
- Web Push notifications (service worker)
- Daily trader summary at 7:00 PM (reservation count, revenue, top product)

---

## 🔒 Security

| Layer | Implementation |
|---|---|
| **Authentication** | Laravel Sanctum tokens (30-day expiry), revoked on logout and password reset |
| **Bot protection** | Cloudflare Turnstile on register, login, forgot-password endpoints |
| **Rate limiting** | Laravel `throttle` middleware on all auth routes; 5 email resend requests/hour per user |
| **Input validation** | Form Request classes with strict Eloquent rules — no raw SQL |
| **Role enforcement** | `role:` middleware + Laravel Policies — never inline role checks |
| **M-Pesa credentials** | Per-trader keys encrypted at rest (`encrypt()`/`decrypt()`) and never serialised to JSON |
| **M-Pesa callbacks** | Safaricom IP whitelist; idempotent processing |
| **File uploads** | Type and size validation; images routed through Cloudinary — never stored locally |
| **Sensitive fields** | `national_id`, `permit_number` excluded from non-admin API responses |
| **Soft deletes** | User and Trader models use `SoftDeletes` — accounts are recoverable; deleted users excluded from all admin listings via `whereHas('user')` |
| **CORS** | Strict origin allowlist (`sokomtaa.vercel.app`, `localhost:3000`) |
| **HTTPS** | Enforced on all environments via cPanel Let's Encrypt |
| **Internal API** | Server-to-server AI config endpoint protected by `X-Internal-Secret` header |
| **Password reset** | Short-lived OTP (10 min) via SMS or email depending on registration method; no password visible in transit |
| **Queue failures** | Failed jobs logged with user ID and error; auth flow never interrupted by email/SMS failures |

---

## 🚀 Getting Started

### Prerequisites
- PHP >= 8.2 + Composer
- Node.js >= 18.x + npm
- MySQL 8.0+

### Backend Setup

```bash
# Install dependencies
composer install

# Copy and configure environment
cp .env.example .env
php artisan key:generate

# Edit .env — set DB, M-Pesa, TalkSasa, Cloudinary, Gmail SMTP, AI keys
# (see .env.example for all required keys)

# Run migrations and seed demo data
php artisan migrate --seed

# Start the server
php artisan serve
```

Start the queue worker (required for emails and notifications):
```bash
php artisan queue:work --tries=3
```

On shared hosting (cPanel), add this cron:
```
*/5 * * * * php /path/to/artisan queue:work --max-time=240
```

### Frontend Setup

```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL, API_URL, INTERNAL_API_SECRET,
# NEXT_PUBLIC_TURNSTILE_SITE_KEY, GROQ_API_KEY or OPENAI_API_KEY

# Start development server
npm run dev
```

Visit `http://localhost:3000`.

### Demo Credentials

| Role | Phone | Password |
|---|---|---|
| Admin | 0700000001 | SokoAdmin@2025! |
| Trader (Mama Wanjiru) | 0700000002 | Demo@1234 |
| Resident (John Odhiambo) | 0700000003 | Demo@1234 |

> Change admin credentials immediately after first login.

---

## 📦 Core Modules

1. **Digital Market Map** — Leaflet coordinate mapping of stalls (Zones A, B, C) with live occupancy colours
2. **Item Reservations** — Pending → Paid → Ready → Completed workflow with pickup codes and QR display
3. **M-Pesa Integration** — Daraja STK Push, per-trader custom routing, B2C withdrawals, idempotent callbacks
4. **Soko AI** — Agentic assistant with full DB access, voice I/O, reservation and payment on behalf of user
5. **AI Search Pipeline** — 4-stage: alias resolution → FULLTEXT → fuzzy LIKE → AI expansion
6. **Email System** — Gmail SMTP with HTML + plain-text branded templates for verification and password reset
7. **KYC Verification** — Document upload, admin review, SMS/in-app approval or rejection notifications
8. **Dispute Resolution** — Ticket system with priority levels, admin response, and resolution tracking
9. **Community Notice Board** — Geo-fenced announcements by audience (all / traders / residents)
10. **Delivery Module** — Dynamic fee calculation, rider assignment, real-time status tracking
11. **Wallet System** — Balance top-up, partial payment coverage, refunds on cancellation
12. **Analytics Dashboards** — Trader-level revenue trends and admin-level county-wide metrics

---

## 🗂️ Project Structure

```
sokomtaa/
├── backend/                  # Laravel 11 API
│   ├── app/
│   │   ├── Http/Controllers/ # Auth, Trader, Resident, Admin, Payment, AI
│   │   ├── Models/           # Eloquent models with SoftDeletes
│   │   ├── Services/         # MpesaService, AiService, SearchService, TalkSasaService
│   │   ├── Jobs/             # SendVerificationEmail, SendSmsNotification
│   │   ├── Mail/             # EmailVerificationMailable, PasswordResetMailable
│   │   └── Traits/           # ApiResponse, PhoneNormalization, VerifyTurnstile
│   ├── database/
│   │   ├── migrations/       # Full schema including FULLTEXT index
│   │   └── seeders/          # Categories, Markets, Stalls, Admin, Demo users, SearchAliases
│   └── resources/views/emails/ # HTML + plain-text email templates
├── frontend/                 # Next.js 14 App Router PWA
│   ├── app/
│   │   ├── (auth)/           # Login, Register, Verify phone/email, Forgot password
│   │   ├── (resident)/       # Home, Search, Trader profiles, Reservations
│   │   ├── (trader)/         # Dashboard, Products, Orders, Payments, Analytics
│   │   ├── (admin)/          # Dashboard, Merchants, Stalls, Fees, Reports
│   │   └── api/chat/         # Next.js route handler — Soko AI agentic pipeline
│   ├── components/shared/    # AiAssistantFab, MpesaPaymentSheet, BottomNav, TopBar
│   └── store/                # Zustand stores (auth, cart, notifications)
└── README.md
```

---

## 🛡️ License

Proprietary Software. All rights reserved. © 2025 Soko Mtaa.

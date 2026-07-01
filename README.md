# Soko Mtaa

**Soko Mtaa** is a neighbourhood-based digital marketplace designed to connect informal traders, local residents, and county administrators within pilot urban and peri-urban markets in Kenya. 

By bringing physical market stalls into a unified digital directory, Soko Mtaa enables seamless product discovery, item reservations, secure digital payments, and efficient market administration.

---

## 👥 User Roles

Soko Mtaa serves four distinct user groups:
- **Trader**: Registers their market stall, manages product inventory, receives reservations, processes M-Pesa payments, and pays mandatory county market fees.
- **Resident**: Discovers local traders via a digital map, reserves fresh products, pays securely via the M-Pesa Daraja API, and leaves reviews.
- **Delivery / Rider**: Connects with residents to facilitate last-mile delivery of reserved products from the market directly to their doorstep.
- **Admin**: County officials who manage stall allocations, monitor trader compliance, collect market fees, and handle community complaints and dispute resolutions.

---

## 🛠️ Technology Stack

Soko Mtaa is built with a modern, scalable, and decoupled architecture.

### Backend (Laravel API)
- **Framework:** Laravel 11 (PHP 8.2+)
- **Architecture:** RESTful API (JSON responses)
- **Database:** MySQL 8.0+ / Eloquent ORM
- **Authentication:** Laravel Sanctum (Token-based SPA auth)
- **Integrations:**
  - **M-Pesa Daraja API**: For item reservations and market fee collection.
  - **Africa's Talking**: For robust SMS notifications.
  - **Cloudinary**: For high-performance image optimization and storage.
  - **Pusher / WebPush**: For real-time, cross-platform notifications.

### Frontend (Next.js PWA)
- **Framework:** Next.js 14 (App Router) with TypeScript
- **Styling:** Tailwind CSS + custom mobile-first `shadcn/ui` components
- **State Management:** Zustand (global state) & TanStack React Query (server state)
- **PWA Capabilities:** Fully installable Progressive Web App (`next-pwa`) with offline support and native Push Notifications.
- **Mapping:** Leaflet.js for interactive, offline-capable digital market stall directories.

---

## 📱 Mobile-First Design Philosophy

The primary users of Soko Mtaa are traders operating in noisy, bright market environments using affordable Android devices. The UI is strictly governed by these constraints:
- **Touch-First Navigation:** Minimum 48x48px tap targets and bottom navigation bars.
- **High-Contrast Typography:** `Plus Jakarta Sans` for headers and `Inter` for highly legible body text, ensuring readability in direct sunlight.
- **Performance:** Aggressive caching, skeleton loaders (no spinners), and WebP image formats.
- **Localization:** Swahili as the primary default language with English fallbacks.

---

## 🚀 Getting Started

### Prerequisites
- PHP >= 8.2 & Composer
- Node.js >= 18.x & npm/pnpm
- MySQL 8.0+
- Composer & NPM

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   composer install
   ```
3. Setup environment configuration:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
4. Configure your `.env` with Database, M-Pesa, Africa's Talking, and Cloudinary credentials.
5. Run migrations and seed the database:
   ```bash
   php artisan migrate --seed
   ```
6. Start the local server:
   ```bash
   php artisan serve
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the environment:
   ```bash
   cp .env.example .env.local
   ```
   *(Ensure `NEXT_PUBLIC_API_URL` points to your local Laravel server)*
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Visit `http://localhost:3000` in your browser.

---

## 📦 Core Modules
1. **Digital Market Map:** Leaflet-based coordinate mapping of physical market stalls (Zones A, B, C).
2. **Item Reservations:** Asynchronous order workflow (Pending → Paid → Ready → Completed).
3. **M-Pesa Integration:** Fully automated Daraja API webhook processing for checkout and market fee compliance.
4. **Dispute Resolution:** In-app ticket system for trader conduct, product quality, and sanitation reporting.
5. **Community Notice Board:** Geo-fenced digital announcements for traders and residents.

---

## 🛡️ License

Proprietary Software. All rights reserved.

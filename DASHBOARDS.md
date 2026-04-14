# DASHBOARDS.md — Soko Mtaa User Interface Specifications

> This file defines every page, sidebar link, layout, widget, and UI state
> for all three user roles: Admin, Trader, and Resident.
> Read alongside AGENTS.md and STYLING.md before building any dashboard page.
> Mobile-first always. Desktop sidebar appears at ≥1024px only.
>
> **DEFAULT LANGUAGE: English.** All UI labels, headings, buttons, and placeholder
> text are written in English by default. Swahili is available as a toggle via
> the language switcher in the top bar avatar dropdown and settings page.
> All Swahili strings are loaded from `messages/sw.json` via next-intl.
> Do not hardcode Swahili strings as default in any component.
>
> **TRADER REVENUE PRIVACY RULE:** Admin must NEVER see individual trader revenue,
> earnings, or income figures. Admin sees only: order counts, product names,
> quantities, reservation statuses, and market fee payments. Revenue data belongs
> exclusively to the trader. Any component, chart, table, or API response visible
> to admin must strip all revenue/earnings fields before rendering.

---

## LAYOUT ARCHITECTURE

### Responsive Layout Modes

```
MOBILE (< 1024px):
┌─────────────────────────┐
│ TOP BAR (sticky)        │
├─────────────────────────┤
│                         │
│   PAGE CONTENT          │
│                         │
│                         │
├─────────────────────────┤
│ BOTTOM NAV (fixed)      │
└─────────────────────────┘

DESKTOP (≥ 1024px):
┌──────────┬──────────────────────────────┐
│          │ TOP BAR (sticky)             │
│ SIDEBAR  ├──────────────────────────────┤
│ (fixed,  │                              │
│ 260px)   │   PAGE CONTENT               │
│          │   (scrollable)               │
│          │                              │
└──────────┴──────────────────────────────┘
```

### Layout Component Rules

- Sidebar is **fixed, non-scrolling** on desktop — content scrolls independently
- Sidebar width: `260px` collapsed label + icon, `72px` icon-only (togglable)
- Bottom nav is hidden on desktop (`hidden lg:flex` or `@media (min-width: 1024px) { display: none }`)
- Sidebar is hidden on mobile — replaced entirely by bottom nav
- Top bar height: `64px` on desktop, `56px` on mobile
- Content area max-width: `1200px` centered within the right panel
- Content padding: `24px` on desktop, `16px` on mobile
- All pages account for bottom nav height on mobile: `padding-bottom: calc(72px + env(safe-area-inset-bottom))`

### Shared Top Bar Elements (all roles)

```
LEFT:   [☰ Menu toggle — desktop only] [Logo / Market name]
CENTER: [Page title — desktop] or [empty — mobile]
RIGHT:  [🔔 Notifications badge] [Avatar + name dropdown]
```

- Notification bell shows unread count badge (amber, max "99+")
- Avatar dropdown: View Profile / Switch Language / Logout
- On mobile, top bar shows logo left + bell + avatar right only

---

## 1. ADMIN DASHBOARD

### 1A. Sidebar Navigation — Admin

```
┌─────────────────────────────────────┐
│  [SM Logo]  Soko Mtaa Admin         │
│  ─────────────────────────────────  │
│  📍 Kolenyo Market          [▼]     │  ← market switcher dropdown
│  ─────────────────────────────────  │
│                                     │
│  OVERVIEW                           │
│  ▸ 📊  Dashboard              /admin│
│  ▸ 📈  Analytics          /analytics│
│                                     │
│  MARKET MANAGEMENT                  │
│  ▸ 🏪  Markets             /markets │
│  ▸ 🗺️   Stall Map               /map│
│  ▸ 🏬  Stalls             /stalls   │
│  ▸ 📋  Allocations    /allocations  │
│  ▸ 📝  Applications   /applications │
│                                     │
│  TRADERS                            │
│  ▸ 👥  All Traders        /traders  │
│  ▸ ⏳  Pending Verification         │
│         (badge count)  /traders?status=pending
│  ▸ ✅  Verified           /traders?status=verified
│  ▸ ❌  Rejected           /traders?status=rejected
│                                     │
│  FINANCIALS                         │
│  ▸ 💳  Market Fees          /fees   │
│  ▸ 💰  Payments         /payments   │
│  ▸ 📊  Fee Reports      /reports    │
│         (county levy income only —  │
│          no trader revenue data)    │
│                                     │
│  COMMUNITY                          │
│  ▸ 📢  Notices           /notices   │
│  ▸ 🚨  Complaints     /complaints   │
│  ▸ ⭐  Reviews           /reviews   │
│                                     │
│  RESERVATIONS                       │
│  ▸ 🛒  All Reservations /reservations│
│                                     │
│  SYSTEM                             │
│  ▸ ⚙️   Settings         /settings  │
│  ▸ 👤  Admin Profile      /profile  │
│  ▸ 📜  Audit Log       /audit-log   │
│  ▸ 🔒  User Management    /users    │
│  ─────────────────────────────────  │
│  [🚪 Logout]                        │
└─────────────────────────────────────┘
```

**Sidebar badge counts (live):**
- Pending Verification → count of `traders` where `verification_status = pending`
- Complaints → count of `complaints` where `status = open`
- Applications → count of `stall_applications` where `status = pending`
- Notices → no badge
- Payments → no badge (use reports instead)

---

### 1B. Admin — Dashboard Page `/admin`

**Purpose:** Single-glance view of the entire market's health right now.

```
PAGE LAYOUT:
┌──────────────────────────────────────────────────────┐
│ HEADER: "Good morning, [Admin Name] 👋"              │
│ SUBTEXT: "Kolenyo Market · Tuesday, 14 Jan 2025"     │
├──────────────────────────────────────────────────────┤
│ ALERT STRIP (if any pending items):                  │
│ [⚠️ 3 traders awaiting verification → Review now]    │
│ [🔴 2 overdue market fees → View]                    │
├──────────────────────────────────────────────────────┤
│ STAT CARDS ROW (4 cards, 2×2 on mobile, 4×1 desktop)│
│  ┌──────────────┐ ┌──────────────┐                  │
│  │ Active Traders│ │ Stall Occ. % │                  │
│  │     34        │ │    78%       │                  │
│  │ ↑2 this week  │ │ 23/30 stalls │                  │
│  └──────────────┘ └──────────────┘                  │
│  ┌──────────────┐ ┌──────────────┐                  │
│  │ Today's Orders│ │ Fees Collected Today            │
│  │     127       │ │ KES 14,500   │                  │
│  │ ↑18% vs yest. │ │ 9 payments   │                  │
│  └──────────────┘ └──────────────┘                  │
│                                                      │
│ ⚠️ NOTE: "Fees Collected Today" shows only market    │
│   levy payments made TO the county — NOT trader      │
│   sales revenue. These are two completely different  │
│   figures. Never conflate them.                      │
├──────────────────────────────────────────────────────┤
│ SECOND ROW STAT CARDS (3 cards)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │ Open     │ │ Pending  │ │ Market   │             │
│  │Complaints│ │  Verif.  │ │ Avg ⭐   │             │
│  │    5     │ │    3     │ │  4.6     │             │
│  └──────────┘ └──────────┘ └──────────┘             │
│  (Avg rating = average of all verified traders'      │
│   public ratings — not revenue-related)              │
├──────────────────────────────────────────────────────┤
│ TWO-COLUMN ROW (desktop) / stacked (mobile):         │
│                                                      │
│ LEFT: STALL MAP (Leaflet — live occupancy heatmap)   │
│   Physical building layout rendered as schematic:    │
│   - 3-column layout: Zone A (left) · Zone B (centre) │
│     · Zone C (right), with centre aisle running N–S  │
│   - Entrances marked in red at top and bottom edges  │
│   - Color coded per stall status:                    │
│     Green=open, Amber=closed, Blue=vacant, Gray=maint│
│   - Each stall shows category icon + stall number    │
│   - Tap a stall → mini popup with trader name,       │
│     open status, rating — NO revenue figures shown   │
│   - Refresh every 60s automatically                  │
│   - Block tabs if market has multiple buildings      │
│   - Occupancy % bar shown per block                  │
│                                                      │
│ RIGHT: RECENT ACTIVITY FEED                          │
│   - Live-ish feed of events (poll every 30s)         │
│   - [✅] Wanjiru's Mboga — reservation confirmed     │
│   - [🆕] New trader application: John Kamau          │
│   - [💳] Fee paid: Mwangi Electronics KES 1,500      │
│   - [⚠️] Complaint opened: stall B4 cleanliness      │
│   - [⭐] New review: 5★ for Mama Atieno              │
│   - Activity feed shows fee amounts (county income)  │
│     but NEVER shows reservation transaction totals   │
│     as those represent trader sales revenue          │
├──────────────────────────────────────────────────────┤
│ THREE-COLUMN ROW (desktop) / stacked (mobile):       │
│                                                      │
│ LEFT: MOST ACTIVE TRADERS THIS WEEK                  │
│   ⚠️ PRIVACY: Ranked by order COUNT only.            │
│   Revenue column is REMOVED entirely for admin.      │
│   Rank list: avatar, name, orders, rating only.      │
│   #1 Mama Wanjiru    43 orders   ⭐4.9               │
│   #2 Ochieng Fish    38 orders   ⭐4.7               │
│   #3 Kamau Cereals   31 orders   ⭐4.8               │
│   (No KES figures shown — those belong to trader)   │
│                                                      │
│ CENTER: TOP SELLING CATEGORIES (donut chart)         │
│   Measured by number of reservations, not revenue.  │
│   Vegetables 34% · Grains 22% · Fish 18%            │
│   Fruits 12% · Other 14%                            │
│   Chart tooltip shows: "X reservations" — not KES   │
│                                                      │
│ RIGHT: PEAK TRADING HOURS (bar chart)                │
│   Y-axis: number of reservations (not KES amount)   │
│   X-axis: hours 6am–8pm                              │
│   Highlight: peak at 8am and 5pm                     │
├──────────────────────────────────────────────────────┤
│ PENDING ACTIONS (full width):                        │
│   TABS: [Verifications(3)] [Applications(2)] [Fees(2)]│
│   Each tab shows a quick-action table:               │
│   Name · Submitted · Action buttons [Approve][Reject]│
└──────────────────────────────────────────────────────┘
```

---

### 1C. Admin — Analytics Page `/admin/analytics`

> ⚠️ PRIVACY RULE: All charts and metrics on this page reflect market operations
> and county fee collection ONLY. No trader sales revenue appears anywhere here.
> The word "Revenue" in this context means county levy income — not trader earnings.

**Sections:**
- Date range picker (Today / This Week / This Month / Custom)
- **Market Levy Collection** — line graph of daily fee payments received by the county (this is county income, not trader revenue)
- **Reservation Volume** — bar chart of daily reservation count (counts only, no KES totals)
- **Trader Growth** — cumulative trader signups over time
- **Stall Occupancy History** — area chart showing occupancy % over time
- **Category Demand Breakdown** — horizontal bar chart ranked by number of reservations (not value)
- **Peak Trading Hours** — heatmap of busiest hours by reservation count
- **Complaint Resolution Rate** — open vs closed complaints over time
- **Geographic Activity** (if multi-market) — which market has the most reservations
- Export buttons: [Download CSV] [Download PDF Report]

**What admin analytics does NOT show:**
- Individual trader sales totals
- Trader income or earnings
- Reservation amounts aggregated per trader
- Any per-trader KES figures beyond their market fee payments

---

### 1D. Admin — Markets Page `/admin/markets`

**Table columns:** Name · Location · Estate · Total Stalls · Occupied · Active Traders · Status · Actions
**Actions per row:** View Map · Edit · Deactivate
**Top actions:** [+ Add New Market]
**Empty state:** "No markets yet. Add the first market to get started."

---

### 1E. Admin — Stall Map Page `/admin/map`

> This map reflects the real physical layout of a government-built market building.
> Each building has three columns: left wall stalls (Zone A), centre double-row
> with a walking aisle between them (Zone B), and right wall stalls (Zone C).
> Entrances sit at the top and bottom edges of the building — two per side.
> A single market centre like Kolenyo can contain multiple buildings (Block A, B, C…).

#### Physical Layout Structure

```
SINGLE BUILDING — top-down schematic view:

  [Entrance N]          [Entrance N2]
  ┌────────────────────────────────────────┐
  │  ZONE A   │   ZONE B (centre)  │ZONE C │
  │  (left    │  ┌───────┬────────┐│(right │
  │   wall)   │  │  B1   │  B2   ││ wall) │
  │  [A1]     │  ├───────┼────────┤│ [C1]  │
  │  [A2]     │  │  B3   │  B4   ││ [C2]  │
  │  [A3]     │  ├───────┼────────┤│ [C3]  │
  │  [A4]     │  │  B5   │  B6   ││ [C4]  │
  │  [A5]     │  ├───────┼────────┤│ [C5]  │
  │  [A6]     │  │  B7   │  B8   ││ [C6]  │
  │  [A7]     │  ├───────┼────────┤│ [C7]  │
  │  [A8]     │  │  B9   │  B10  ││ [C8]  │
  │           │  ├───────┼────────┤│       │
  │           │  │  B11  │  B12  ││       │
  │           │  ├───────┼────────┤│       │
  │           │  │  B13  │  B14  ││       │
  │           │  └───────┴────────┘│       │
  │           │   ← Centre Aisle →  │       │
  └────────────────────────────────────────┘
  [Entrance S]          [Entrance S2]
```

#### Stall Status — Color Coding

| Status | Stall Color | Border | Icon | Meaning |
|---|---|---|---|---|
| Occupied & Open | Green tint `#D4EDDA` | `#3B7D4E` solid | House icon | Trader active right now |
| Occupied & Closed | Amber tint `#FEF3C7` | `#B07D2A` solid | House icon | Trader assigned, not open today |
| Vacant | Blue tint `#D6E4F7` | `#2A6099` dashed | Dashed rect | No trader assigned — available |
| Maintenance | Warm amber `#F5E6C8` | `#B07D2A` solid | Wrench icon | Stall temporarily unavailable |
| Entrance / Exit | Red `#E8736A` | `#C0392B` solid | Arrow icon | Entry/exit point — not a stall |

#### Stall Icon System

Each occupied stall displays an SVG icon indicating the trader's primary category:

```
House icon (shopfront)   → General goods, clothing, household
Bag icon (shopping)      → Groceries, vegetables, fruits
Fish outline             → Fish / seafood traders
Wheat / leaf             → Cereals, grains, flour
Coffee cup               → Beverages, street food
Zap / bolt               → Electronics, mobile phones
Wrench                   → Maintenance (not a category — status only)
Dashed rectangle         → Vacant stall (no icon, just outline)
```

Category icon is derived from `traders.primary_category` and rendered
as an inline SVG path inside each stall cell. Size: 20×20px always.
Stroke color matches the stall status (dark green for occupied, etc.)

#### Page Layout — Admin View

```
HEADER BAR (sticky):
  [← Markets]  Block A — Kolenyo Market    [Filter ▼] [+ Add Stall]

BUILDING SELECTOR TABS (if multiple blocks):
  [Block A] [Block B] [Block C]   ← switches active building rendered

MAP CANVAS (main area, fills viewport):
  ┌─────────────────────────────────────────────────────┐
  │  [Entrance N]           [Entrance N2]               │
  │  ┌───────┬──────────────────────────┬───────┐       │
  │  │  A1   │  B1  │  B2  │  B3  │... │  C1   │       │
  │  │  A2   │  B4  │  B5  │  B6  │... │  C2   │       │
  │  │  ...  │  ... │  ... │  ... │... │  ...  │       │
  │  └───────┴──────────────────────────┴───────┘       │
  │  [Entrance S]           [Entrance S2]               │
  └─────────────────────────────────────────────────────┘

OCCUPANCY SUMMARY BAR (below map):
  Occupied: 22  ·  Vacant: 6  ·  Maintenance: 1  ·  73% occupancy

LEGEND STRIP (bottom right of map):
  🟢 Occupied & Open  🟡 Occupied & Closed  🔵 Vacant  🔴 Maintenance  🚪 Entrance
```

#### Stall Click — Admin Side Panel

Clicking any stall slides in a right-side detail panel (desktop) or
bottom sheet (mobile) showing:

```
IF OCCUPIED:
  [Stall icon — large]  Stall A1 · Zone A · 9 sqm
  ──────────────────────────────────────────────
  [Avatar]  Mama Wanjiru's Mboga
  Status:   ✅ Verified  ·  🟢 Open Now
  Category: Vegetables · Fruits
  Rating:   ⭐ 4.8 · 127 reviews
  Fee:      ✅ Paid — January 2025
  Since:    Allocated Jan 2024
  ──────────────────────────────────────────────
  [View Trader Profile]
  [Edit Stall Details]
  [Revoke Allocation]   ← requires confirmation + reason
  [Mark as Maintenance]

IF VACANT:
  [Dashed stall icon]  Stall B7 · Zone B · 9 sqm
  Status: Available for allocation
  Zone: B — Monthly fee: KES 1,200
  ──────────────────────────────────────────────
  [Allocate to Trader]  ← opens trader search
  [Edit Stall Details]
  [Mark as Maintenance]

IF MAINTENANCE:
  [Wrench icon]  Stall B8 · Zone B · 9 sqm
  Status: Under Maintenance
  Notes: "Roof leak — awaiting repair" (editable)
  ──────────────────────────────────────────────
  [Mark as Available]
  [Edit Notes]

ENTRANCE MARKERS (click):
  No side panel — entrances are structural, not actionable
```

#### Multi-Building Overview

When admin is on the Markets page or the top-level map, they see a
bird's-eye grid thumbnail for each block:

```
KOLENYO MARKET CENTRE
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Block A    │ │   Block B    │ │   Block C    │
│  [mini grid] │ │  [mini grid] │ │  [mini grid] │
│ 73% occupied │ │ 67% occupied │ │ 83% occupied │
│ [View Map →] │ │ [View Map →] │ │ [View Map →] │
└──────────────┘ └──────────────┘ └──────────────┘
Overall: 90 stalls · 74% occupied · 5 vacant
```

Mini grid color rules: each cell is a 20×20px square.
Green = occupied, blue = vacant, red = entrance, gray dashed = aisle.

#### Leaflet.js Implementation Notes

The market map is NOT a geographic map — it is a schematic floor plan overlay.

```typescript
// components/map/MarketMap.tsx

// The map uses a custom CRS (coordinate reference system)
// so stall map_x / map_y values from the DB map directly to pixels.
const map = L.map('market-map', {
  crs: L.CRS.Simple,          // Flat coordinate system — no geo projection
  minZoom: -1,
  maxZoom: 2,
  zoomControl: true,
});

// Each stall is rendered as a custom L.divIcon
stalls.forEach((stall) => {
  const icon = L.divIcon({
    className: `stall-marker stall-${stall.status} stall-${stall.is_open ? 'open' : 'closed'}`,
    html: `
      <div class="stall-cell">
        <div class="stall-icon">${getCategoryIcon(stall.trader?.primary_category)}</div>
        <span class="stall-num">${stall.stall_number}</span>
        <span class="stall-name">${stall.trader?.business_name ?? 'Available'}</span>
      </div>
    `,
    iconSize: [72, 64],
    iconAnchor: [36, 32],
  });

  L.marker([stall.map_y, stall.map_x], { icon })
    .on('click', () => openStallPanel(stall))
    .addTo(map);
});

// Entrances rendered as fixed markers — not clickable
entrances.forEach((entrance) => {
  L.divIcon({ className: 'entrance-marker', html: entranceIcon })
    .addTo(map);
});

// Refresh every 60 seconds
setInterval(() => refreshStallStatuses(), 60_000);
```

#### Database Fields Required for Map Rendering

The following fields in the `stalls` table power the map:

```
map_x         → horizontal position in the building schematic
map_y         → vertical position in the building schematic
zone          → 'A' (left wall), 'B' (centre), 'C' (right wall)
stall_number  → displayed label (A1, B3, C7 etc.)
status        → 'occupied' | 'vacant' | 'maintenance'
```

The `traders` table join provides:
```
business_name        → shown in stall label
is_open              → determines open/closed color variant
primary_category     → determines which icon to render
average_rating       → shown in click-panel
verification_status  → shown in click-panel
```

Entrance positions are hardcoded per building in a `building_config` JSON
field on the `markets` table — they do not change and do not need DB rows.

---

### 1F. Admin — Stalls Page `/admin/stalls`

> Stalls are organised into three zones per building, matching the physical layout:
> Zone A = left wall, Zone B = centre double-row, Zone C = right wall.
> Each building (Block A, B, C…) has its own set of zones.

**Table columns:** Stall No. · Block · Zone · Size (sqm) · Status · Trader Assigned · Monthly Fee · Fee Status · Actions
**Filters:** All / Available / Occupied / Maintenance | Block: [All ▼] | Zone: [All ▼]
**Actions per row:** View on Map · Edit · Allocate / Revoke · Mark Maintenance
**Bulk actions:** Select multiple → Change Status / Generate Fee Invoices
**Top actions:** [+ Add Stall] [Export CSV]

**Stall number convention:**
- Zone A stalls: `A1` through `A8` (left wall, top to bottom)
- Zone B stalls: `B1` through `B14` (centre, pairs top to bottom)
- Zone C stalls: `C1` through `C8` (right wall, top to bottom)
- Multiple blocks prefix the block letter: `BLK-A-A1`, or use separate block filter

---

### 1G. Admin — Allocations Page `/admin/allocations`

**Table columns:** Stall · Trader · Start Date · End Date · Status · Allocated By · Actions
**Filters:** Active / Expired / Revoked
**Actions:** View · Revoke (with reason modal)
**Top actions:** [+ New Allocation]

**New Allocation form fields:**
- Select Stall (dropdown — only available stalls)
- Select Trader (search — only verified, unallocated traders)
- Start Date
- End Date (optional — leave blank for indefinite)
- Notes

---

### 1H. Admin — Applications Page `/admin/applications`

**Pending stall applications from traders without stalls.**

**Table columns:** Trader Name · Market · Preferred Stall · Preferred Zone · Submitted · Status · Actions
**Actions:** [Review] → opens detail modal with:
  - Trader profile summary
  - Their motivation text
  - Available stalls in requested zone
  - [Approve & Allocate Stall] [Waitlist] [Reject with Reason]

---

### 1I. Admin — Traders Page `/admin/traders`

> ⚠️ PRIVACY RULE: This table must never include a revenue, income, earnings,
> or sales column. Traders' financial performance is private to the trader only.

**Table columns:** Photo · Name · Business · Stall · Market · Status · Rating · Orders (count) · Fee Status · Joined · Actions
**Filters:** All / Pending / Verified / Rejected / Suspended
**Search:** by name, phone, business name
**Actions per row:** View Profile · Verify · Reject · Suspend · Edit
**Top actions:** [Export CSV]

**Trader Detail Page `/admin/traders/{id}`:**
```
LEFT PANEL:
  - Avatar, business name, verification badge
  - Phone, email, national ID (admin only)
  - Permit image (zoomable)
  - Stall assignment + zone
  - Verification status + history log
  - [Verify] [Reject] [Suspend] buttons

RIGHT PANEL — TABS:
  Products     → list of their products with names, prices, stock status
                 ⚠️ Prices shown here are PUBLIC listing prices (visible to
                 all residents too) — not private earnings data. This is fine.
  Reservations → order history: code, product, quantity, status, date
                 ⚠️ Admin sees reservation STATUS and COUNT only.
                 The KES amount column is HIDDEN from admin view.
                 Admin can see: #SM-K7B, Nyanya × 2kg, Status: Completed
                 Admin cannot see: KES 100 (that is trader revenue)
  Fee Payments → market levy payment history only (county income records)
                 Admin CAN see fee amounts — these are county transactions.
  Reviews      → reviews received from residents (public data)
  Complaints   → complaints filed about this trader
  Activity Log → timestamped log of account actions (verify, suspend, etc.)

WHAT ADMIN NEVER SEES IN TRADER DETAIL:
  ✗ Total sales / total revenue / total earnings
  ✗ Income summaries or charts
  ✗ Reservation amounts aggregated as income
  ✗ Any "KES earned" figure
```

---

### 1J. Admin — Market Fees Page `/admin/fees`

**Summary bar:** Total Collected This Month · Pending · Overdue · Waived

**Table columns:** Trader · Stall · Period · Amount · Due Date · Status · Paid At · Receipt · Actions
**Filters:** All / Unpaid / Paid / Overdue / Waived
**Actions per row:** View Receipt · Mark Waived · Send Reminder SMS
**Top actions:** [Generate Monthly Invoices] [Export Statement]

**Generate Monthly Invoices modal:**
- Select month (defaults to next month)
- Preview: list of traders + amounts
- [Confirm Generate] → creates unpaid fee records for all active traders

---

### 1K. Admin — Payments Page `/admin/payments`

> ⚠️ PRIVACY RULE: This page shows ONLY market fee payments and reservation
> payment records for operational/dispute purposes. It does NOT present trader
> revenue summaries, trader income totals, or any aggregated earnings view.
> The "Amount" column on reservation rows exists for dispute resolution only
> (e.g. admin needs to process a refund). It is a transactional record, not an
> income report. Never add a "Trader Total" or "Earnings" column here.

**All M-Pesa transactions across the platform — two types only:**

**Type 1: Market Fee Payments** (trader paying county levy)
Table columns: Ref # · Trader · Stall · Period · Amount · Phone · Status · M-Pesa ID · Date · Receipt

**Type 2: Reservation Payments** (resident paying for reserved item)
Table columns: Ref # · Reservation Code · Resident · Trader · Product · Amount · Status · M-Pesa ID · Date
These are shown for dispute/refund resolution ONLY. Admin cannot filter or sort
these by trader to build income reports. No "subtotal per trader" grouping allowed.

**Filters:** All / Market Fees / Reservations / Completed / Pending / Failed / Refunded
**Actions:** View Details · Issue Refund (opens confirmation modal with reason — fee payments only)

**EXPORT RESTRICTION:** The CSV export of reservation payments must exclude
any aggregation columns. Exporting raw rows is permitted; pre-aggregated
"total per trader" is not.

---

### 1L. Admin — Notices Page `/admin/notices`

**Table columns:** Title · Audience · Type · Created · Expires · Pinned · Actions
**Actions:** Edit · Delete · Pin/Unpin · Duplicate
**Top actions:** [+ New Notice]

**New Notice form:**
- Title (English) + Title (Swahili)
- Content (English) — rich text
- Content (Swahili) — rich text
- Type: General / Event / Maintenance / Promotion / Urgent
- Audience: All / Traders Only / Residents Only
- Expiry date (optional)
- Pin to top toggle

---

### 1M. Admin — Complaints Page `/admin/complaints`

**Table columns:** # · Category · Subject · Filed By · Against · Priority · Status · Opened · Actions
**Priority coding:** 🔴 High · 🟡 Medium · 🟢 Low
**Filters:** Open / In Review / Resolved / Closed / All
**Top actions:** [Export Report]

**Complaint Detail Page:**
```
HEADER: Complaint #ID — subject — status badge — priority badge
───────────────────────────────────────────────
Complainant: name, phone, role
Against: trader name + stall (if trader complaint)
Reservation: linked reservation (if applicable)
Category: tag badge

DESCRIPTION: full complaint text

ADMIN RESPONSE:
  [Text area for response]
  Status: [Open ▼] [In Review ▼] [Resolved ▼] [Closed ▼]
  [Save Response]

ACTIVITY TIMELINE:
  · Complaint opened — Jan 14, 9:03 AM
  · Status changed to In Review — Jan 14, 11:30 AM — by Admin
  · Response sent to complainant — Jan 14, 11:31 AM
```

---

### 1N. Admin — Reviews Page `/admin/reviews`

**Table columns:** Reviewer · Trader · Rating · Comment (preview) · Date · Visible · Actions
**Actions:** Hide Review · Show Review · Delete
**Filter:** All / Visible / Hidden / 1★ / 2★ / 3★ / 4★ / 5★

---

### 1O. Admin — Reservations Page `/admin/reservations`

> ⚠️ PRIVACY RULE: The Amount column exists here for platform-level dispute
> management only (e.g. confirming a payment before issuing a refund). Admin
> cannot use this page to assess trader income. There is no "subtotal per trader"
> grouping, no export that aggregates KES by trader, and no revenue summary card.

**Table columns:** Code · Resident · Trader · Product · Qty · Status · Pickup Deadline · Created · Actions
**Filters:** All / Pending / Paid / Ready / Completed / Cancelled / Expired
**Actions:** View Details · Cancel (with reason) · Issue Refund (if paid, for dispute resolution)

**Reservation Detail (admin view):**
- Shows: code, resident, trader, product, quantity, status timeline, pickup deadline
- Shows: payment status and M-Pesa ref (for dispute resolution)
- Does NOT show: a "Trader Earnings" summary or running total

---

### 1P. Admin — Settings Page `/admin/settings`

**Sections:**
```
MARKET SETTINGS
  - Market name, description, coordinates
  - Operating hours (market-wide defaults)
  - Market fee rate (KES per month per stall, by zone)
  - Reservation pickup window (default: 24 hours)
  - Max reservations per resident per day

NOTIFICATION SETTINGS
  - Toggle: SMS notifications on/off per event type
  - SMS sender ID
  - Daily SMS limit per user (default: 3)

PAYMENT SETTINGS
  - M-Pesa Shortcode
  - M-Pesa environment (Sandbox / Production)
  - Fee payment due day (default: 5th of month)

SECURITY SETTINGS
  - Session timeout (minutes)
  - Two-factor auth toggle for admin accounts
  - IP whitelist for admin login

SYSTEM
  - Clear cache
  - Run pending migrations (dev only)
  - Download error logs
  - System version info
```

---

### 1Q. Admin — Audit Log Page `/admin/audit-log`

**Every admin action logged with full context.**

**Table columns:** Timestamp · Admin · Action · Resource · Before · After · IP Address
**Actions logged:** trader verified/rejected, stall allocated/revoked, fee waived, complaint resolved, notice created/deleted, review hidden, refund issued, settings changed

---

### 1R. Admin — User Management Page `/admin/users`

**All registered users (all roles).**

**Table columns:** Name · Phone · Role · Status · Joined · Last Active · Actions
**Actions:** View · Suspend · Activate · Reset Password · Delete
**Filters:** All / Traders / Residents / Active / Suspended
**Top actions:** [Export Users]

---

## 2. TRADER DASHBOARD

### 2A. Sidebar Navigation — Trader

```
┌─────────────────────────────────────┐
│  [SM Logo]  Soko Mtaa               │
│  ─────────────────────────────────  │
│  [Avatar]  Mama Wanjiru             │
│  Mboga · Stendi A1 · ⭐ 4.8         │
│  ─────────────────────────────────  │
│  [🟢 Duka Liko Wazi / Open]  [Toggle]│  ← live open/close toggle
│  ─────────────────────────────────  │
│                                     │
│  OVERVIEW                           │
│  ▸ 📊  Dashibodi / Dashboard  /trader│
│                                     │
│  BIDHAA / PRODUCTS                  │
│  ▸ 📦  Bidhaa Zangu       /products │
│  ▸ ➕  Ongeza Bidhaa  /products/new │
│  ▸ 📂  Kategoria       /categories  │  ← view only
│                                     │
│  MAAGIZO / ORDERS                   │
│  ▸ 🛒  Maagizo Yote   /reservations │
│  ▸ 🆕  Mapya (badge)  /reservations?status=pending
│  ▸ 📦  Tayari         /reservations?status=ready
│  ▸ ✅  Zilizokamilika /reservations?status=completed
│  ▸ ❌  Zilizofutwa    /reservations?status=cancelled
│                                     │
│  MALIPO / PAYMENTS                  │
│  ▸ 💳  Ada ya Soko       /fees      │
│  ▸ 💰  Historia ya Malipo /payments │
│                                     │
│  TATHMINI / ANALYTICS               │
│  ▸ 📈  Takwimu Zangu   /analytics   │
│                                     │
│  SOKO                               │
│  ▸ 🗺️   Ramani ya Soko       /map   │
│  ▸ 📢  Matangazo         /notices   │
│  ▸ 🏬  Omba Stendi   /apply-stall  │  ← only if no stall assigned
│                                     │
│  AKAUNTI / ACCOUNT                  │
│  ▸ 👤  Wasifu Wangu      /profile   │
│  ▸ ⭐  Tathmini         /reviews    │
│  ▸ 🚨  Malalamiko      /complaints  │
│  ▸ 🔔  Arifa         /notifications │
│  ▸ ⚙️   Mipangilio       /settings  │
│  ─────────────────────────────────  │
│  [🚪 Toka / Logout]                 │
└─────────────────────────────────────┘
```

**Sidebar badge counts:**
- Mapya (New Orders) → pending + paid reservations
- Ada ya Soko → unpaid fee count (red badge if overdue)

---

### 2B. Trader — Dashboard Page `/trader`

**Purpose:** Give the trader a fast pulse of their business today.

```
PAGE LAYOUT:
┌──────────────────────────────────────────────────────┐
│ HEADER: "Habari, Mama Wanjiru! 👋"                   │
│ SUBTEXT: "Stendi A1 · Kolenyo Market"                │
│                                                      │
│ PROFILE COMPLETION BANNER (if < 100%):               │
│ ████████░░  80% — Ongeza picha ya banner yako        │
│ [Kamilisha Wasifu / Complete Profile →]              │
├──────────────────────────────────────────────────────┤
│ VERIFICATION PENDING BANNER (if pending):            │
│ 🕐 Wasifu wako unapitiwa na admin. Itachukua masaa 24│
├──────────────────────────────────────────────────────┤
│ FEE OVERDUE BANNER (if overdue):                     │
│ 🚨 Ada ya Januari haijalipiwa! Lipa sasa → [Lipa]   │
├──────────────────────────────────────────────────────┤
│ OPEN/CLOSE TOGGLE — large, prominent:                │
│  ┌────────────────────────────────────┐              │
│  │  🟢  Duka Liko Wazi               │              │
│  │  Inafungua: 6:00 AM               │  ← tap to    │
│  │  Inafunga: 6:00 PM                │    toggle    │
│  │  [Funga Leo / Close for Today ▸]  │              │
│  └────────────────────────────────────┘              │
├──────────────────────────────────────────────────────┤
│ TODAY'S STAT CARDS (2×2 mobile, 4×1 desktop)         │
│  ┌──────────────┐ ┌──────────────┐                  │
│  │ Maagizo Leo  │ │ Mapato Leo   │                  │
│  │      12      │ │  KES 3,450   │                  │
│  │ +4 kuliko jana│ │              │                  │
│  └──────────────┘ └──────────────┘                  │
│  ┌──────────────┐ ┌──────────────┐                  │
│  │ Watazamaji   │ │ Rating Yako  │                  │
│  │   Profile    │ │   ⭐ 4.8     │                  │
│  │     34       │ │  127 reviews │                  │
│  └──────────────┘ └──────────────┘                  │
├──────────────────────────────────────────────────────┤
│ PENDING ORDERS SECTION (most urgent):                │
│ "Maagizo Yanayosubiri / Orders Needing Attention"    │
│                                                      │
│ [ORDER CARD — paid, needs to be marked ready]        │
│  Order #SM-K7B2QX91                                  │
│  Amina Odhiambo → Nyanya × 2kg — KES 100            │
│  Lipa: ✅ Ililipwa · Cha: 2h 15min                   │
│  [Mark Ready ✓]  [View Details]                      │
│                                                      │
│ [ORDER CARD — ready, awaiting pickup]                │
│  Order #SM-PQ3M8X22                                  │
│  Brian Mwangi → Sukuma Wiki × 3 bundles — KES 60     │
│  Status: Iko Tayari · Muda: 4h 30min iliyobaki       │
│  [Mark Complete ✓]  [View Details]                   │
├──────────────────────────────────────────────────────┤
│ TWO-COLUMN (desktop) / stacked (mobile):             │
│                                                      │
│ LEFT: BIDHAA ZINAZOISHA / LOW STOCK ALERTS           │
│   Product list — name, current status, [Update Stock]│
│   🟡 Viazi — Inakaribia kuisha                       │
│   🔴 Vitunguu — Imeisha                              │
│   [Manage All Products →]                            │
│                                                      │
│ RIGHT: WEEKLY REVENUE CHART                          │
│   Bar chart — Mon through Sun                        │
│   This week vs last week line overlay                │
├──────────────────────────────────────────────────────┤
│ RECENT REVIEWS                                       │
│ Last 3 reviews received                              │
│ [⭐⭐⭐⭐⭐] "Mboga safi sana na bei nzuri!"           │
│ Fatuma A. · 2 hours ago                              │
│ [View All Reviews →]                                 │
└──────────────────────────────────────────────────────┘
```

---

### 2C. Trader — Products Page `/trader/products`

```
HEADER: "Bidhaa Zangu / My Products" + [+ Ongeza Bidhaa]

FILTER TABS: Zote / Zinapatikana / Zinazoisha / Zimeisha / Zimefichwa

PRODUCT GRID (2 cols mobile, 3 cols tablet, 4 cols desktop):
┌────────────────────┐
│  [Product Image]   │
│  📍 Category badge │
│  Nyanya            │
│  KES 50 / kg       │
│  🟢 Inapatikana    │
│  34 orders total   │
│  [Edit] [Hide]     │
└────────────────────┘

EMPTY STATE: "Bado hujaweka bidhaa. Anza sasa!"
             [+ Ongeza Bidhaa ya Kwanza]
```

**Add / Edit Product Form:**
```
- Product Name (English) *
- Product Name (Swahili) *
- Category * (dropdown)
- Price (KES) * + unit (kg / piece / bunch / litre / packet)
- Stock Status * (Available / Low / Out of Stock)
- Stock Quantity (optional — number)
- Description (optional textarea)
- Product Photo (Cloudinary upload — camera + gallery)
- Active toggle (show/hide from public)
[Save Product] [Cancel]
```

---

### 2D. Trader — Orders / Reservations Page `/trader/reservations`

```
HEADER: "Maagizo / Orders"

QUICK STATS BAR:
  Mapya: 4 · Yaliyolipwa: 2 · Tayari: 3 · Wiki hii: 47

STATUS TABS:
  [Mapya] [Yaliyolipwa] [Tayari] [Kukamilika] [Yote]

ORDER CARDS (each card):
┌──────────────────────────────────────────┐
│ #SM-K7B2QX91            [Status Badge]  │
│ 👤 Amina Odhiambo · 0712 XXX XXX        │
│ 📦 Nyanya × 2 kg                        │
│ 💰 KES 100 · Ililipwa ✅                 │
│ ⏰ Chukua kabla: Leo 6:00 PM            │
│                                          │
│ [Mark Ready ✓]     [View Details →]     │
└──────────────────────────────────────────┘

ORDER DETAIL MODAL / PAGE:
  - Full order info
  - Customer contact (tap to call)
  - Payment receipt (M-Pesa ref)
  - [Mark as Ready] / [Mark Complete] / [Report Issue]
  - Pickup code display (for marking complete — enter code)
```

---

### 2E. Trader — Market Fees Page `/trader/fees`

```
HEADER: "Ada ya Soko / Market Fees"

BALANCE SUMMARY CARD:
  Ada Inayodaiwa: KES 1,500
  Ada Iliyolipwa (mwaka huu): KES 9,000
  Hali: 🟡 Inahitajika Januari 2025

  [💳 Lipa Ada ya Sasa — KES 1,500]  ← triggers M-Pesa STK Push

FEE HISTORY TABLE:
  Kipindi / Period · Kiasi / Amount · Tarehe ya Malipo · Hali · Risiti
  Jan 2025   KES 1,500  —            🔴 Haijalipwa  [Lipa]
  Dec 2024   KES 1,500  Dec 5 2024   ✅ Imelipwa    [Risiti]
  Nov 2024   KES 1,500  Nov 4 2024   ✅ Imelipwa    [Risiti]
```

---

### 2F. Trader — Analytics Page `/trader/analytics`

```
HEADER: "Takwimu Zangu / My Analytics"

DATE RANGE: [Leo] [Wiki] [Mwezi] [Mwaka] [Custom]

ROW 1 — HEADLINE NUMBERS (4 cards):
  Total Orders · Total Revenue · Profile Views · Avg Rating

ROW 2 — CHARTS:
  LEFT:  Revenue Over Time — line chart
  RIGHT: Orders by Day of Week — bar chart

ROW 3:
  LEFT:  Top Products (table) — name, orders, revenue
  RIGHT: Customer Return Rate — donut (new vs returning)

ROW 4 — TRADING PATTERNS:
  Busiest Hours — heatmap or bar (24h × 7days grid)
  "Your busiest hour: 8AM–9AM on weekdays"

ROW 5 — REVIEW INSIGHTS:
  Rating trend over time — line chart
  Recent reviews with sentiment highlight

PRICE INSIGHT WIDGET:
  ┌─────────────────────────────────────────────┐
  │ 💡 Bei ya Bidhaa Zako vs Soko               │
  │ Nyanya: KES 50/kg                           │
  │ Bei ya wastani sokoni: KES 55/kg            │
  │ ✅ Bei yako ni nzuri! Uko chini ya wastani. │
  │                                             │
  │ Vitunguu: KES 80/kg                         │
  │ Bei ya wastani sokoni: KES 65/kg            │
  │ ⚠️ Bei yako ni juu ya wastani kwa 23%       │
  └─────────────────────────────────────────────┘
```

---

### 2G. Trader — Profile Page `/trader/profile`

```
HEADER: "Wasifu Wangu / My Profile"

PROFILE CARD (editable):
  Banner image  [Change Banner Photo]
  Avatar        [Change Avatar Photo]
  Business Name (English + Swahili)
  Description
  M-Pesa Number
  Trading Hours (opening / closing time)
  Market Permit [View] [Re-upload]
  Stall: A1 — Zone A

ACCOUNT DETAILS:
  Full Name
  Phone Number (read-only — primary identifier)
  Email (optional, editable)
  Language Preference (Swahili / English)
  [Change Password]

PUBLIC PROFILE PREVIEW:
  [How customers see your profile →]

DANGER ZONE:
  [Request Account Deletion] (sends request to admin)
```

---

### 2H. Trader — Reviews Page `/trader/reviews`

```
HEADER: "Tathmini / Reviews Received"

SUMMARY:
  ⭐ 4.8 · 127 reviews total
  ★★★★★ 89% · ★★★★ 8% · ★★★ 2% · ★★ 1% · ★ 0%
  Rating bar breakdown

REVIEW LIST (each entry):
  [Avatar] Amina O. · ⭐⭐⭐⭐⭐ · 2 hours ago
  "Mboga safi sana na bei nzuri! Nitarudi tena."
  Order: Nyanya × 2kg · #SM-K7B2QX91
  [Report Inappropriate]
```

---

### 2I. Trader — Complaints Page `/trader/complaints`

```
HEADER: "Malalamiko / Complaints"

TABS: Yaliyowasilishwa Kwangu (filed against me) | Yangu (filed by me)

COMPLAINT CARD:
  #C-00045 · Ubora wa Bidhaa · Imewasilishwa na: Amina O.
  Hali: 🟡 Inapitiwa · Jan 13, 2025
  "Nyanya zilikuwa zimeshaanza kuoza..."
  Admin Response: "Tunachunguza tatizo hili..."
  [View Full Details]

[+ Wasilisha Malalamiko Mapya / New Complaint]
```

---

### 2J. Trader — Settings Page `/trader/settings`

```
NOTIFICATIONS
  ✅ Arifa za maagizo mapya (SMS)
  ✅ Arifa za maagizo mapya (In-App)
  ✅ Ukumbusho wa ada ya soko (SMS)
  ✅ Tathmini mpya (In-App)
  ✅ Muhtasari wa siku kila usiku (In-App)
  ❌ Matangazo ya soko (SMS)

PRIVACY
  ✅ Onyesha nambari yangu ya simu kwa wateja
  ❌ Onyesha idadi ya mauzo kwenye wasifu

DISPLAY
  Lugha / Language: [Kiswahili ▼]
  Sarafu / Currency: KES (fixed)

ACCOUNT
  [Badilisha Nenosiri / Change Password]
  [Omba Kufuta Akaunti / Request Account Deletion]
```

---

### 2K. Trader — Stall Application Page `/trader/apply-stall`

*Shown only if trader has no stall assigned.*

```
HEADER: "Apply for a Stall"

INTRO CARD:
  You don't have a stall assigned yet.
  Apply for one at Kolenyo Market below.
  Admin will review your application within 24 hours.

STEP 1 — CHOOSE YOUR PREFERRED ZONE:
  [Zone A — Left wall]  [Zone B — Centre]  [Zone C — Right wall]
  Monthly fee: Zone A: KES 1,500 · Zone B: KES 1,200 · Zone C: KES 1,000

STEP 2 — PICK A STALL (optional — interactive map):
  The building map renders below showing vacant stalls in blue.
  Trader can tap any blue (vacant) stall to select it.

  ┌──────────────────────────────────────┐
  │ [Entrance N]        [Entrance N2]    │
  │  [A1●] [A2●]  [B1●][B2●][B3○][B4○] [C1●][C2●] │
  │  [A3○] [A4●]  [B5●][B6○][B7○][B8●] [C3○][C4●] │
  │  ...                                 │
  │ ● = Occupied  ○ = Vacant (selectable)│
  │ [Entrance S]        [Entrance S2]    │
  └──────────────────────────────────────┘

  Selected: Stall B7 · Zone B · KES 1,200/month  ✅
  [Clear selection — let admin decide]

STEP 3 — MOTIVATION:
  Why do you need this stall? *
  [                                      ]
  [                                      ]
  (minimum 50 characters)

  [Submit Application]

─── IF APPLICATION ALREADY PENDING ───
  ┌───────────────────────────────────────┐
  │ ⏳ Your application is under review   │
  │ Submitted: Jan 12, 2025              │
  │ Preferred stall: B7 · Zone B         │
  │ Status: Pending · Queue position: 2  │
  │ You'll be notified by SMS & in-app.  │
  └───────────────────────────────────────┘

  [Withdraw Application]  ← with confirmation modal
```

**Map interaction rules for the application picker:**
- Only blue (vacant) stalls are tappable — occupied and maintenance stalls are dimmed and non-interactive
- Tapping a vacant stall highlights it with an amber selection ring
- Selecting a stall is optional — trader can submit without a preference
- Entrance markers are never selectable
- The same Leaflet component is reused from the main map — just with a `selectionMode={true}` prop that disables the detail panel and enables the selection callback instead

---

## 3. RESIDENT DASHBOARD

### 3A. Navigation — Resident (Bottom Nav + Sidebar on Desktop)

```
BOTTOM NAV (mobile):
  🏠 Nyumbani  🔍 Tafuta  📋 Mahitaji  👤 Mimi

SIDEBAR (desktop ≥1024px):
┌─────────────────────────────────────┐
│  [SM Logo]  Soko Mtaa               │
│  ─────────────────────────────────  │
│  [Avatar]  John Odhiambo            │
│  Kolenyo Market                     │
│  ─────────────────────────────────  │
│                                     │
│  GUNDUA / DISCOVER                  │
│  ▸ 🏠  Nyumbani / Home          /   │
│  ▸ 🔍  Tafuta / Search      /search │
│  ▸ 🗺️   Ramani ya Soko         /map │
│                                     │
│  MANUNUZI / SHOPPING                │
│  ▸ 📋  Mahitaji Yangu  /reservations│
│  ▸ 🔔  Orodha ya Kutaka /watchlist  │
│  ▸ 💰  Historia ya Malipo /payments │
│                                     │
│  JAMII / COMMUNITY                  │
│  ▸ 📢  Matangazo         /notices   │
│  ▸ ⭐  Tathmini Zangu     /reviews  │
│  ▸ 🚨  Malalamiko      /complaints  │
│                                     │
│  AKAUNTI / ACCOUNT                  │
│  ▸ 👤  Wasifu Wangu      /profile   │
│  ▸ 🔔  Arifa         /notifications │
│  ▸ ⚙️   Mipangilio       /settings  │
│  ─────────────────────────────────  │
│  [🚪 Toka / Logout]                 │
└─────────────────────────────────────┘
```

---

### 3B. Resident — Home / Discovery Page `/`

```
PAGE LAYOUT:
┌──────────────────────────────────────────────────────┐
│ TOP BAR: [SM Logo] Kolenyo Market    [🔔] [Avatar]   │
├──────────────────────────────────────────────────────┤
│ WELCOME HERO:                                        │
│  "Habari, John! 👋"                                  │
│  "Unatafuta nini leo?"                               │
│  "What are you looking for today?"                   │
│                                                      │
│  [🔍 Tafuta bidhaa au mchuuzi...     ]  ← full width │
│  (tapping opens Search page)                         │
├──────────────────────────────────────────────────────┤
│ CATEGORIES — horizontal scroll row (icon chips):    │
│  🥬Mboga  🍎Matunda  🐟Samaki  🌾Nafaka             │
│  🥚Mayai  ☕Vinywaji  🍽️Chakula  👗Nguo  🏠Vifaa   │
├──────────────────────────────────────────────────────┤
│ ACTIVE RESERVATION BANNER (if any):                 │
│ 📦 Nyanya yako iko tayari kukusanywa!               │
│ Stendi A1 · Mama Wanjiru · Chukua kabla 6:00 PM     │
│ [Ona Maelezo →]                                     │
├──────────────────────────────────────────────────────┤
│ SECTION: "Wazi Sasa / Open Now" + [Ona Zote →]      │
│ Horizontal scroll or 1-col cards:                   │
│  ┌────────────────────────────────────┐             │
│  │ [Banner]                           │             │
│  │ 🟢 Wazi  ·  ⭐4.8  ·  Stendi A1   │             │
│  │ Mama Wanjiru's Mboga               │             │
│  │ Mboga · Matunda · Nafaka           │             │
│  │ [Hifadhi Bidhaa / Reserve →]       │             │
│  └────────────────────────────────────┘             │
├──────────────────────────────────────────────────────┤
│ SECTION: "Maarufu Leo / Popular Today" 🔥            │
│ Horizontal scroll — product cards:                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ [Image]  │ │ [Image]  │ │ [Image]  │            │
│  │ Nyanya   │ │ Samaki   │ │ Sukuma   │            │
│  │ KES 50/kg│ │ KES 200  │ │ KES 20   │            │
│  │ 🔥23 leo │ │ 🔥19 leo │ │ 🔥17 leo │            │
│  └──────────┘ └──────────┘ └──────────┘            │
├──────────────────────────────────────────────────────┤
│ SECTION: "Wachuuzi Wote / All Traders"              │
│ Filter: [Wote] [Mboga] [Samaki] [Nafaka] [Nyama]    │
│ Paginated trader cards (Load More button)           │
├──────────────────────────────────────────────────────┤
│ SECTION: "Matangazo / Market Notices"               │
│ Latest 2 notice cards                               │
│ [Ona Yote →]                                        │
└──────────────────────────────────────────────────────┘
```

---

### 3C. Resident — Search Page `/search`

```
HEADER: sticky search input (auto-focused on open)
  [← Back]  [🔍 Tafuta bidhaa au mchuuzi...    ] [✕]

WHEN EMPTY (no query yet):
  "Bidhaa za Hivi Karibuni / Recent Searches"
  (last 5 searches from localStorage)
  "Tafuta kwa Kategoria / Browse by Category"
  (category chips grid)

WHILE TYPING (live suggestions):
  [🔍 nyanya] → matches in green
  [Mchuuzi: Mama Wanjiru] → trader match
  [Bidhaa: Nyanya × KES 50] → product match

RESULTS PAGE (after submit):
  RESULTS COUNT: "Matokeo 23 kwa 'nyanya'"

  FILTER BAR (collapsible):
    Kategoria: [Zote ▼]
    Bei: KES [0] — KES [500]
    Hali: [Inapatikana ✓] [Inakaribia kuisha]
    Tathmini: [⭐ 4+ ▼]
    Wazi Sasa: [toggle]

  SORT: [Maarufu ▼] / Bei Chini / Bei Juu / Rating

  RESULTS TABS: [Bidhaa (18)] [Wachuuzi (5)]

  PRODUCT RESULTS — grid:
    Product card with trader name, price, stock badge, reserve button

  TRADER RESULTS — list:
    Trader card with name, categories, rating, open status

  NO RESULTS:
    "Hakuna bidhaa zinazolingana na 'xyz'"
    Suggestions: Did you mean...? / Try these categories
```

---

### 3D. Resident — Market Map Page `/map`

> The resident map shows the same physical building layout as the admin map
> but with reduced information — no admin actions, no fee status, no personal
> trader details beyond what is publicly visible.

#### Page Layout

```
HEADER: "Market Map"
BUILDING TABS (if multiple blocks): [Block A] [Block B] [Block C]

MAP CANVAS (full width, fills screen below header):

  [Entrance N]             [Entrance N2]
  ┌──────────────────────────────────────┐
  │  [A1]    │  [B1] [B2] [B3] [B4]  │ [C1]  │
  │  [A2]    │  [B5] [B6] [B7] [B8]  │ [C2]  │
  │  [A3]    │  ...centre stalls...   │ [C3]  │
  │  ...     │                        │ ...   │
  └──────────────────────────────────────┘
  [Entrance S]             [Entrance S2]

LEGEND (bottom of map, compact pill row):
  🟢 Open Now   🟡 Closed   🔵 Vacant   🚪 Entrance
```

#### Stall Status — Resident-Visible Colors

| Status | Color | What Resident Sees |
|---|---|---|
| Occupied & Open | Green `#D4EDDA` + solid border | Trader name + category icon |
| Occupied & Closed | Amber `#FEF3C7` + solid border | Trader name + "Closed" |
| Vacant | Blue `#D6E4F7` + dashed border | "Available" — no trader |
| Maintenance | Gray `#E5E7EB` + dashed border | "Unavailable" — no detail |
| Entrance | Red `#E8736A` + solid border | "Entrance / Exit" label |

> Residents do NOT see: fee status, verification status, allocation dates,
> permit details, or any admin-only fields.

#### Stall Tap — Resident Bottom Sheet

Tapping any occupied stall slides up a bottom sheet:

```
IF OPEN TRADER:
┌──────────────────────────────────────────┐
│ ████ [handle]                            │
│ [Avatar]  Mama Wanjiru's Mboga  🟢 Open  │
│ ⭐ 4.8 · 127 reviews · Stall A1          │
│ Vegetables · Fruits · Cereals            │
│                                          │
│ Closes at 6:00 PM today                 │
│                                          │
│ [View Profile & Products →]             │
│ [📞 Call Trader]                         │
└──────────────────────────────────────────┘

IF CLOSED TRADER:
┌──────────────────────────────────────────┐
│ [Avatar]  Ochieng Fish Stall  🟡 Closed  │
│ ⭐ 4.6 · 89 reviews · Stall C2           │
│ Fish · Seafood                           │
│ Opens tomorrow at 6:00 AM               │
│                                          │
│ [View Profile →]                         │
└──────────────────────────────────────────┘

IF VACANT STALL:
┌──────────────────────────────────────────┐
│ 🔵  Stall B7 · Zone B                   │
│ This stall is currently available.       │
│ No trader has been assigned here yet.   │
└──────────────────────────────────────────┘

IF ENTRANCE MARKER:
  No bottom sheet — entrances are informational only.
  A small tooltip appears: "Market Entrance — North"
```

#### Multi-Building Switcher (Resident)

If the market has multiple blocks, a horizontal tab row appears
at the top of the map:

```
[Block A — 73% full] [Block B — 67% full] [Block C — 83% full]
```

Occupancy percentage shows as a subtle progress bar under each tab.
Helps residents know which block has more open traders today.

---

### 3E. Resident — Trader Profile Page `/trader/{id}`

```
HERO BANNER (full-width image, 16:7 ratio)
  [← Rudi] overlay on banner               [Share 📤]

AVATAR (overlaps banner, -32px margin):
  Verified tick if verified

BUSINESS NAME (h1)
CATEGORY TAGS: Mboga · Matunda · Nafaka
RATING + COUNT: ⭐ 4.8 · 127 tathmini
OPEN STATUS: 🟢 Wazi · Inafunga 6:00 PM
STALL: 📍 Stendi A1 · Kolenyo Market

TRUST BADGES (horizontal scroll):
  ✅ Mthibitishwa · 🏅 Mwaminifu · ⚡ Haraka · 🔥 Maarufu Leo

TABS: [Bidhaa] [Kuhusu] [Tathmini]

─── BIDHAA TAB ───
  FILTER by category (chips)
  PRODUCT GRID (2 cols mobile, 3 desktop):
    ┌──────────────────┐
    │  [Image]         │
    │  💰 Bei Nzuri! 🟢│  ← price badge + stock badge
    │  Nyanya          │
    │  KES 50 / kg     │
    │  [+ Hifadhi]     │
    └──────────────────┘

─── KUHUSU TAB ───
  Business description
  Trading hours
  M-Pesa number (tap to copy)
  Market & stall
  Member since date
  Total completed orders

─── TATHMINI TAB ───
  Overall rating + breakdown bars
  Review list (paginated)
  [Andika Tathmini / Leave Review] (if eligible — completed reservation)

STICKY BOTTOM BAR:
  📞 [Wasiliana / Contact]   🛒 [Hifadhi Bidhaa / Reserve Item]
```

---

### 3F. Resident — Product Reserve Flow (Bottom Sheet)

```
SHEET 1 — PRODUCT DETAIL:
  [Product Image large]
  Name + Swahili name
  KES XX / unit
  Stock badge
  Trader: Mama Wanjiru · Stendi A1 · 🟢 Wazi
  Description
  Price insight badge: ✅ Bei Nzuri!

  QUANTITY PICKER: [−] [2] [+]
  TOTAL: KES 100

  [Hifadhi na Lipa / Reserve & Pay →]

SHEET 2 — PAYMENT CONFIRMATION:
  Muhtasari / Summary:
    Nyanya × 2 kg        KES 100
    ─────────────────────────────
    Jumla / Total:       KES 100

  Nambari ya M-Pesa:
  [+254] [07XX XXX XXX        ]

  [████████ LIPA SASA / PAY NOW KES 100 ████████]
  🔒 Salama kupitia M-Pesa Daraja

SHEET 3 — WAITING STATE:
  📱 Angalia simu yako...
  Tumekutumia ombi la M-Pesa kwa 07XX XXX XXX
  [spinner / phone float animation]
  [2:00] countdown
  Haukupata? [Jaribu Tena / Retry]

SHEET 4 — SUCCESS:
  [Confetti burst animation]
  ✅ Malipo Yamefanikiwa!
  KES 100 imelipwa
  Code: SM-K7B2QX91
  Chukua bidhaa yako kwa Stendi A1
  Kabla ya: Leo 6:00 PM
  [Ona Maelezo ya Agizo →]
```

---

### 3G. Resident — Reservations Page `/reservations`

```
HEADER: "Mahitaji Yangu / My Reservations"

SUMMARY STRIP:
  Zinazoendelea: 3 · Zilizokamilika: 47 · Zilizofutwa: 2

STATUS TABS:
  [Zinaendelea] [Zilizolipwa] [Tayari] [Zote]

RESERVATION CARD:
┌──────────────────────────────────────────┐
│ SM-K7B2QX91              [Status Badge] │
│ 📦 Nyanya × 2 kg                        │
│ 🏪 Mama Wanjiru · Stendi A1             │
│ 💰 KES 100 · ✅ Ililipwa                │
│ ⏰ Chukua kabla: Leo 6:00 PM            │
│                                          │
│ [Onyesha Msimbo / Show Code 📱]          │
│ [Ona Maelezo]   [Futa / Cancel]          │
└──────────────────────────────────────────┘

PICKUP CODE PAGE (tap "Show Code"):
┌──────────────────────────────────────────┐
│ 📦 Chukua Bidhaa Yako                   │
│                                          │
│       ╔══════════════════╗               │
│       ║   [QR CODE]      ║               │
│       ╚══════════════════╝               │
│                                          │
│          SM-K7B2QX91                    │  ← JetBrains Mono, large
│                                          │
│  Onyesha hii kwa mchuuzi wako           │
│  Show this to your trader               │
│                                          │
│  📍 Stendi A1 · Mama Wanjiru            │
│  ⏰ Chukua kabla ya 6:00 PM             │
└──────────────────────────────────────────┘
```

---

### 3H. Resident — Watchlist Page `/watchlist`

```
HEADER: "Orodha ya Kutaka / Wishlist"

PRODUCT CARDS — same as product grid:
  Each shows current stock status
  If out of stock: "Imeisha · 🔔 Utaarifiwa" toggle

EMPTY STATE:
  "Orodha yako ya kutaka iko tupu."
  "Bonyeza 🔔 kwenye bidhaa yoyote kuongeza hapa."
  [Tafuta Bidhaa →]
```

---

### 3I. Resident — Payments History Page `/payments`

```
HEADER: "Historia ya Malipo / Payment History"

SUMMARY CARD:
  Jumla Uliolitumia (mwaka): KES 4,200
  Miamala (mwaka): 47

PAYMENT LIST:
  Date · Description · Amount · Status · M-Pesa Ref · Receipt
  Jan 14  Nyanya × 2kg (SM-K7B2Q)  KES 100  ✅  [Risiti]
  Jan 12  Sukuma Wiki × 3 (SM-PQ3)  KES 60   ✅  [Risiti]

FILTERS: [Zote] [Zilizofanikiwa] [Zilizoshindwa]
```

---

### 3J. Resident — Notices Page `/notices`

```
HEADER: "Matangazo / Market Notices"

PINNED NOTICES (if any):
  📌 [Notice card — amber border, "Pinned" badge]

NOTICE LIST:
  ┌───────────────────────────────────────┐
  │ [Type badge: URGENT / GENERAL / EVENT]│
  │ Mfumo wa Maji Utafungwa Jumatano      │
  │ Kolenyo Market · Jan 13, 2025         │
  │ Mfumo wa maji utafungwa kwa masaa 4  │
  │ kuanzia saa 8 asubuhi...              │
  │ [Soma Zaidi / Read More →]            │
  └───────────────────────────────────────┘

FILTERS: Zote / Matukio / Ukarabati / Matangazo / Muhimu
```

---

### 3K. Resident — Reviews Page `/reviews`

```
HEADER: "Tathmini Zangu / My Reviews"

REVIEW CARDS (reviews I left):
  ⭐⭐⭐⭐⭐ · Mama Wanjiru's Mboga
  "Mboga safi sana na bei nzuri!"
  Agizo: Nyanya × 2kg · Jan 14, 2025
  [Edit Review] (within 24 hours of leaving it)

PENDING REVIEWS (completed orders, no review yet):
  "Una tathmini 2 zinazokusubiri!"
  [Order card] → [Acha Tathmini / Leave Review]
```

---

### 3L. Resident — Complaints Page `/complaints`

```
HEADER: "Malalamiko Yangu / My Complaints"

COMPLAINT CARDS:
  #C-00045 · Ubora wa Bidhaa
  Dhidi ya: Mama Wanjiru · Stendi A1
  Hali: 🟡 Inapitiwa · Jan 13, 2025
  [Ona Maelezo]

[+ Wasilisha Malalamiko Mapya / New Complaint]

NEW COMPLAINT FORM:
  Aina / Type: [Dropdown — 8 categories]
  Dhidi ya Mchuuzi? Yes/No toggle
    If yes → [Select Trader dropdown]
  Agizo Linalohusika? (optional reservation picker)
  Kichwa / Subject *
  Maelezo / Description * (textarea, min 50 chars)
  [Wasilisha / Submit]
```

---

### 3M. Resident — Profile Page `/profile`

```
HEADER: "Wasifu Wangu / My Profile"

PROFILE CARD:
  [Avatar]  [Change Photo]
  Full Name (editable)
  Phone Number (read-only)
  Email (optional, editable)

PREFERENCES:
  Language: [Kiswahili ▼]
  Preferred Market: [Kolenyo Market ▼]

ACCOUNT STATS (fun, encouraging):
  🛒 Manunuzi yote: 47
  ⭐ Tathmini ulizoweka: 23
  💰 Umetumia: KES 4,200

[Change Password]
[Request Account Deletion]
```

---

### 3N. Resident — Settings Page `/settings`

```
NOTIFICATIONS
  ✅ Bidhaa iko tayari kukusanywa (SMS + In-App)
  ✅ Ukumbusho wa kukusanya (SMS + In-App)
  ✅ Matangazo ya soko (In-App)
  ❌ Matangazo ya soko (SMS)
  ✅ Jibu la malalamiko (In-App)

DISPLAY
  Lugha / Language: [Kiswahili ▼]
  Njia ya kuonyesha wachuuzi: [Kadi / Grid ▼]

PRIVACY
  ✅ Onyesha jina langu kwa wachuuzi katika maagizo
  ❌ Onyesha historia yangu ya ununuzi

[Change Password]
[Request Account Deletion]
```

---

## 4. SHARED PAGES (All Roles)

### 4A. Notifications Page `/notifications`

```
HEADER: "Arifa / Notifications"  [Mark All Read]

TABS: Zote / Hazijasomwa

NOTIFICATION ITEM:
  [Icon by type] [Title]              [Time]
  [Body text preview — 2 lines max]
  [Unread dot — green, left border]

TYPE ICONS:
  🛒 Order/Reservation
  💳 Payment
  ✅ Verification
  📢 Notice
  ⭐ Review
  🚨 Complaint
  💡 Price insight
  🔔 Stock alert

GROUPING: Today / Yesterday / This Week / Older
EMPTY STATE: "Hakuna arifa mpya. Uko updated! ✅"
```

---

### 4B. Error Pages

```
404 — PAGE NOT FOUND:
  [Stall illustration with "Imefungwa" sign]
  "Ukurasa Haupatikani"
  "Page not found"
  Subtext: "Ukurasa unaotafuta haupo au umehamishwa."
  [← Rudi Nyumbani / Go Home]

500 — SERVER ERROR:
  [Broken market stall illustration]
  "Hitilafu Imetokea"
  "Something went wrong on our end."
  [Jaribu Tena / Try Again]  [Rudi Nyumbani]

OFFLINE PAGE (PWA):
  [Market stall with no wifi signal]
  "Huna Muunganiko"
  "You appear to be offline."
  "Data iliyohifadhiwa inaonyeshwa."
  Last synced: [timestamp]
```

---

### 4C. Auth Pages

```
LOGIN PAGE /login:
  [SM Logo — centered]
  "Ingia / Sign In"
  Phone number input (+254 prefix)
  Password input (show/hide toggle)
  [Nimesahau Nenosiri / Forgot Password?]
  [████ Ingia / Sign In ████]
  ─────────────────────────
  "Huna akaunti?" [Jisajili / Register →]

REGISTER PAGE /register:
  [SM Logo]
  "Jisajili / Create Account"
  STEP 1: Language + Phone
  STEP 2: OTP Verification
  STEP 3: Name + Role (Trader / Resident)
  STEP 4: Market selection
  [████ Maliza / Complete ████]

FORGOT PASSWORD /forgot-password:
  Phone number → OTP → New password → Done

FIRST LOGIN (Admin) /admin/change-password:
  Force password change flow (see Section 25C of AGENTS.md)
```

---

## 5. DESKTOP LAYOUT SPECIFICS

### Desktop Sidebar Collapsed Mode

When user toggles sidebar to collapsed (72px):
- Show icon only, no text labels
- Tooltip on hover showing full label
- Active state: icon highlighted with green background pill
- Logo collapses to icon-only (SM mark)
- Section headers hidden
- Badge counts still show on icons

### Desktop Content Width Rules

```
ADMIN DASHBOARD:    max-width: 1200px, 4-column stat grid
TRADER DASHBOARD:   max-width: 960px, 2-3 column layouts
RESIDENT HOME:      max-width: 1100px, 3-column trader grid
FORMS/DETAIL PAGES: max-width: 720px, single column centered
FULL MAP PAGE:      100% width, no max
```

### Desktop-Only Features

- Sidebar always visible (no hamburger)
- Hover states on all cards
- Keyboard navigation (Tab, Enter, Escape for modals)
- Wider data tables with more visible columns
- Split-view on detail pages (list left + detail right)
- Drag-to-reorder products (Trader only)
- Bulk select with checkboxes in admin tables

---

## 6. PAGE TITLES & META (SEO + PWA)

```typescript
// Every page must define these in Next.js metadata:
const pageTitles: Record<string, string> = {
  '/':                    'Soko Mtaa — Soko Yako Mtaani',
  '/search':              'Tafuta Bidhaa — Soko Mtaa',
  '/map':                 'Ramani ya Soko — Soko Mtaa',
  '/reservations':        'Mahitaji Yangu — Soko Mtaa',
  '/trader':              'Dashibodi — Soko Mtaa',
  '/trader/products':     'Bidhaa Zangu — Soko Mtaa',
  '/trader/reservations': 'Maagizo — Soko Mtaa',
  '/trader/analytics':    'Takwimu — Soko Mtaa',
  '/trader/fees':         'Ada ya Soko — Soko Mtaa',
  '/admin':               'Admin Dashibodi — Soko Mtaa',
  '/admin/traders':       'Wachuuzi — Soko Mtaa Admin',
  '/admin/stalls':        'Stendi — Soko Mtaa Admin',
  '/admin/fees':          'Ada za Soko — Soko Mtaa Admin',
  '/admin/complaints':    'Malalamiko — Soko Mtaa Admin',
  '/login':               'Ingia — Soko Mtaa',
  '/register':            'Jisajili — Soko Mtaa',
};
```

---

## 7. COMPLETE PAGE INVENTORY

### Admin Pages (18 pages)
| Page | Route | Description |
|---|---|---|
| Dashboard | `/admin` | Market overview + stats |
| Analytics | `/admin/analytics` | Charts + trends + export |
| Markets | `/admin/markets` | Market CRUD |
| Stall Map | `/admin/map` | Live interactive floor map |
| Stalls | `/admin/stalls` | Stall management table |
| Allocations | `/admin/allocations` | Stall allocation records |
| Applications | `/admin/applications` | Stall application queue |
| All Traders | `/admin/traders` | Trader management table |
| Trader Detail | `/admin/traders/[id]` | Full trader profile + actions |
| Market Fees | `/admin/fees` | Fee tracking + generation |
| Payments | `/admin/payments` | All M-Pesa transactions |
| Revenue Reports | `/admin/reports` | Exportable reports |
| Notices | `/admin/notices` | Notice board management |
| Complaints | `/admin/complaints` | Complaint queue |
| Complaint Detail | `/admin/complaints/[id]` | Single complaint + response |
| Reviews | `/admin/reviews` | Review moderation |
| Reservations | `/admin/reservations` | All reservations table |
| Settings | `/admin/settings` | System configuration |
| Audit Log | `/admin/audit-log` | Action history |
| User Management | `/admin/users` | All users CRUD |

### Trader Pages (12 pages)
| Page | Route | Description |
|---|---|---|
| Dashboard | `/trader` | Business overview + pending orders |
| Products | `/trader/products` | Product list + management |
| Add Product | `/trader/products/new` | Add new product form |
| Edit Product | `/trader/products/[id]/edit` | Edit existing product |
| Orders | `/trader/reservations` | Incoming order management |
| Order Detail | `/trader/reservations/[id]` | Single order view + actions |
| Market Fees | `/trader/fees` | Fee balance + payment |
| Analytics | `/trader/analytics` | Business insights |
| Reviews | `/trader/reviews` | Reviews received |
| Profile | `/trader/profile` | Business profile editor |
| Apply for Stall | `/trader/apply-stall` | Stall application form |
| Complaints | `/trader/complaints` | Complaints filed + received |
| Settings | `/trader/settings` | Notification preferences |

### Resident Pages (12 pages)
| Page | Route | Description |
|---|---|---|
| Home | `/` | Discovery + trader listing |
| Search | `/search` | Full-text search + filters |
| Market Map | `/map` | Interactive market floor map |
| Trader Profile | `/trader/[id]` | Public trader profile |
| Reservations | `/reservations` | My active + past reservations |
| Pickup Code | `/reservations/[id]/pickup` | QR + alphanumeric pickup code |
| Watchlist | `/watchlist` | Saved products |
| Payment History | `/payments` | Transaction history |
| Notices | `/notices` | Market announcements |
| Reviews | `/reviews` | Reviews I have left |
| Complaints | `/complaints` | My complaints + new complaint |
| Profile | `/profile` | My account details |
| Settings | `/settings` | Notification preferences |

### Shared Pages (6 pages)
| Page | Route | Description |
|---|---|---|
| Login | `/login` | Phone + password sign in |
| Register | `/register` | Multi-step onboarding |
| Forgot Password | `/forgot-password` | OTP-based reset |
| Notifications | `/notifications` | All in-app notifications |
| 404 | `/404` | Not found page |
| 500 | `/500` | Server error page |

**Total: 50 pages across all roles.**

---

## 8. MISSING THINGS — ADDITIONAL CONSIDERATIONS

### Things that must not be forgotten:

**Loading & Transition States:**
- Every page must have a defined skeleton loader (see STYLING.md Section 4G)
- Route transitions: slide right when drilling down, slide left when going back
- Tab transitions: fade between tab content, not full page reload

**Breadcrumbs (Desktop Only):**
- Admin deep pages: Home > Traders > Mama Wanjiru
- Trader deep pages: Dashboard > Orders > #SM-K7B2QX91
- Never show breadcrumbs on mobile — wastes vertical space

**Keyboard Shortcuts (Desktop Admin):**
- `N` — New notice
- `T` — Go to traders
- `F` — Go to fees
- `?` — Show keyboard shortcut help modal

**Print/Export Styles:**
- Receipt pages must have a clean print stylesheet
- PDF export button on: reservations, fee receipts, monthly reports

**PWA Install Prompt:**
- After 3rd visit, show a subtle "Install App" banner
- Banner shows: SM icon + "Ongeza kwenye skrini yako ya nyumbani"
- [Install] [Maybe Later ✕]

**Session Expiry Handling:**
- 30 minutes before token expires: show subtle "Session expiring" toast
- On expiry: show modal "Muda wa kikao umekwisha" with [Login Again] button
- Preserve current page URL for redirect after re-login

**First-Time Feature Tooltips:**
- Trader's first product page: tooltip on the stock update button
- Resident's first reservation: tooltip showing how pickup code works
- Admin's first trader verification: tooltip on the approve/reject buttons
- All tooltips: dismissible, remembered in localStorage

**Confirm Dialogs — Required for These Actions:**
- Deleting a product (trader)
- Cancelling a reservation (resident)
- Rejecting a trader (admin)
- Revoking a stall allocation (admin)
- All confirmations use a bottom sheet on mobile, centered modal on desktop
- Never use browser `confirm()` or `alert()`

**Empty Market State (Before Any Traders):**
- Resident home: "Soko hili bado linaandaliwa. Wachuuzi wanakuja hivi karibuni!"
- Friendly illustration of a market stall being set up
- Admin contact info for questions

**Search History:**
- Store last 5 searches in localStorage per user
- Show as quick suggestions before typing on Search page
- [Clear History ✕] link

**Haptic Feedback (Mobile Web):**
- Use `navigator.vibrate(50)` on:
  - Successful payment
  - Order marked complete
  - Successful form submission
- Use `navigator.vibrate([50, 30, 50])` on errors

---

## 9. TRADER REVENUE PRIVACY — COMPLETE ENFORCEMENT RULES

> This section is the definitive authority on the privacy boundary between
> admin visibility and trader financial data. Every developer and AI agent
> must implement these rules exactly. No exceptions.

### 9A. What Admin CAN See

| Data Point | Visible to Admin | Notes |
|---|---|---|
| Trader name, phone, email | ✅ Yes | Operational necessity |
| National ID, permit number | ✅ Yes | Verification purposes |
| Stall assignment | ✅ Yes | Market management |
| Verification status | ✅ Yes | Admin action required |
| Products listed + prices | ✅ Yes | Public listing data — residents also see this |
| Product stock status | ✅ Yes | Market health indicator |
| Reservation count (total) | ✅ Yes | Order volume — not income |
| Reservation status | ✅ Yes | Operational — completed, cancelled, etc. |
| Public rating + reviews | ✅ Yes | Public data |
| Market fee amounts | ✅ Yes | County income records |
| Fee payment history | ✅ Yes | County compliance tracking |
| Complaint history | ✅ Yes | Resolution authority |
| Account activity log | ✅ Yes | Admin actions only |

### 9B. What Admin CANNOT See

| Data Point | Hidden from Admin | Why |
|---|---|---|
| Individual reservation KES amounts | ❌ Never | Trader sales revenue |
| Total sales / total revenue | ❌ Never | Private business income |
| Revenue charts or income trends | ❌ Never | Private business data |
| Aggregated earnings per trader | ❌ Never | Private business data |
| "Top traders by revenue" ranking | ❌ Never | Replace with order count ranking |
| Revenue comparison between traders | ❌ Never | Commercially sensitive |
| Trader's total income this month | ❌ Never | Private business income |
| Revenue per product | ❌ Never | Private business data |

### 9C. Backend API Enforcement

**Create a dedicated API resource transformer for admin views:**

```php
// app/Http/Resources/Admin/TraderAdminResource.php
class TraderAdminResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'user'                => [
                'name'   => $this->user->name,
                'phone'  => $this->user->phone,
                'email'  => $this->user->email,
            ],
            'business_name'       => $this->business_name,
            'stall'               => $this->stall ? [
                'stall_number' => $this->stall->stall_number,
                'zone'         => $this->stall->zone,
            ] : null,
            'verification_status' => $this->verification_status,
            'is_open'             => $this->is_open,
            'average_rating'      => $this->average_rating,
            'total_reviews'       => $this->total_reviews,
            'total_reservations'  => $this->reservations()->count(),
            // ✅ ALLOWED: reservation count — operational metric
            // ❌ NEVER ADD: total_revenue, total_earnings, income_this_month
        ];
    }
}

// app/Http/Resources/Admin/ReservationAdminResource.php
class ReservationAdminResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'reservation_code' => $this->reservation_code,
            'resident'         => ['name' => $this->resident->name],
            'trader'           => ['business_name' => $this->trader->business_name],
            'product'          => ['name' => $this->product->name],
            'quantity'         => $this->quantity,
            'status'           => $this->status,
            'pickup_deadline'  => $this->pickup_deadline,
            'created_at'       => $this->created_at,
            // ❌ OMITTED for admin: unit_price, total_amount
            // These fields are present in ReservationTraderResource (trader's own view)
            // but must NOT appear in admin-facing API responses
        ];
    }
}
```

**In AdminDashboardController, never aggregate trader revenue:**

```php
// ✅ CORRECT — aggregate by count
$topTraders = Trader::withCount('reservations')
    ->where('verification_status', 'verified')
    ->orderByDesc('reservations_count')
    ->limit(5)
    ->get()
    ->map(fn($t) => [
        'name'               => $t->business_name,
        'reservations_count' => $t->reservations_count,
        'average_rating'     => $t->average_rating,
    ]);

// ❌ WRONG — never do this for admin
$topTraders = Trader::withSum('reservations', 'total_amount') // FORBIDDEN
    ->orderByDesc('reservations_sum_total_amount')
    ->get();
```

**Analytics endpoint — county levy only, never trader revenue:**

```php
// AdminAnalyticsController.php
public function index(): JsonResponse
{
    return $this->success([
        // ✅ County levy income — admin owns this data
        'fee_collection' => MarketFee::where('status', 'paid')
            ->selectRaw('DATE(paid_at) as date, SUM(amount) as total')
            ->groupBy('date')
            ->get(),

        // ✅ Reservation volume by count — operational metric
        'reservation_volume' => Reservation::selectRaw(
            'DATE(created_at) as date, COUNT(*) as count'
        )->groupBy('date')->get(),

        // ❌ NEVER: SUM(total_amount) from reservations — that is trader revenue
    ]);
}
```

### 9D. Frontend Enforcement

**Never pass revenue props to admin-facing components:**

```typescript
// ✅ CORRECT — TraderCard shown to admin
<TraderCard
  name={trader.business_name}
  stall={trader.stall?.stall_number}
  rating={trader.average_rating}
  orderCount={trader.total_reservations}
  status={trader.verification_status}
  // ❌ revenue={trader.total_revenue}  — NEVER pass this to admin components
/>

// ✅ CORRECT — Top Traders widget (admin)
// Ranks by order count, not revenue
const topTraders = traders.sort((a, b) =>
  b.total_reservations - a.total_reservations
);

// ❌ WRONG — never sort admin view by revenue
const topTraders = traders.sort((a, b) =>
  b.total_revenue - a.total_revenue  // FORBIDDEN in admin context
);
```

**Chart axis labels must never imply revenue for admin:**

```typescript
// ✅ CORRECT — admin analytics chart
const chartConfig = {
  yAxisLabel: 'Number of Reservations',  // count
  tooltipFormat: (value) => `${value} orders`,
};

// ❌ WRONG
const chartConfig = {
  yAxisLabel: 'Revenue (KES)',           // FORBIDDEN for admin charts
  tooltipFormat: (value) => `KES ${value}`,
};
```

### 9E. Export Restriction

Admin CSV/PDF exports must NEVER include:
- A column named: Revenue, Earnings, Income, Sales Total, KES Earned
- Any computed field that sums reservation `total_amount` per trader
- A "Top Earners" or "Revenue Report" export type

Admin exports MAY include:
- Fee Collection Report (county levy only)
- Trader Activity Report (order counts, ratings, verification status)
- Reservation Status Report (codes, statuses, products, quantities)
- Market Occupancy Report (stall numbers, traders assigned, dates)

---

## 10. DEFAULT LANGUAGE ENFORCEMENT

> English is the default language for all three dashboards.
> This replaces any Swahili-first defaults previously noted in this file.

### Implementation Rules

```typescript
// next-intl configuration — app/i18n.ts
export const defaultLocale = 'en';       // ← English default
export const locales = ['en', 'sw'];     // English first, Swahili second

// User preference stored after they choose
// localStorage key: 'soko_language'
// Default value if not set: 'en'
```

### Language Toggle Location

Available in TWO places:
1. **Top bar avatar dropdown** — "Switch to Swahili / Switch to English"
2. **Settings page** — Language preference with save button

Language preference is:
- Saved to `users.preferred_language` in the database on change
- Loaded on login and applied immediately
- Falls back to `localStorage` value when offline
- Falls back to `'en'` if neither is set

### What This Means for UI Text

All static labels in components use English as the default translation key value:

```json
// messages/en.json (default — loaded first)
{
  "nav.home": "Home",
  "nav.search": "Search",
  "nav.reservations": "My Reservations",
  "actions.reserve": "Reserve Item",
  "actions.pay": "Pay Now",
  "status.available": "Available",
  "status.out_of_stock": "Out of Stock",
  "status.low_stock": "Running Low",
  "dashboard.greeting": "Good morning, {name}!",
  "dashboard.market": "{market} · {date}"
}

// messages/sw.json (Swahili toggle)
{
  "nav.home": "Nyumbani",
  "nav.search": "Tafuta",
  "nav.reservations": "Mahitaji Yangu",
  "actions.reserve": "Hifadhi Bidhaa",
  "actions.pay": "Lipa Sasa",
  "status.available": "Inapatikana",
  "status.out_of_stock": "Imeisha",
  "status.low_stock": "Inakaribia Kuisha",
  "dashboard.greeting": "Habari, {name}!",
  "dashboard.market": "{market} · {date}"
}
```

### Bilingual Data Fields

Some data in the database has both English and Swahili versions
(product names, category names, notice titles). Display rules:

- If user language = `en` → show `name` field (English)
- If user language = `sw` → show `name_sw` field if set, else fall back to `name`
- Never show both versions simultaneously in the same label
- Product prices, stall numbers, dates: always in English/universal format

---

> **Last updated:** 2025 | **Project:** Soko Mtaa | **File:** DASHBOARDS.md
> Pairs with AGENTS.md and STYLING.md. All three must be read together.
> Total pages: 50 | Roles: Admin (20), Trader (13), Resident (12), Shared (6)
>
> KEY RULES SUMMARY:
> 1. Default language: English (Swahili available as toggle)
> 2. Admin NEVER sees trader revenue, earnings, or income
> 3. Admin sees: order counts, fee collections, ratings, statuses — nothing more
> 4. Privacy enforced at API resource level, controller level, and component level

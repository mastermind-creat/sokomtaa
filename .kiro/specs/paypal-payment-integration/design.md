# Design Document: PayPal Payment Integration

## Overview

This document describes the technical design for adding PayPal as a second payment method on Soko Mtaa, running alongside the existing M-Pesa (Daraja STK Push) integration.

The integration uses the PayPal Orders v2 REST API directly via Guzzle HTTP — no PayPal PHP SDK is installed to keep the backend lean and avoid version-lock. On the frontend, no PayPal JS SDK is used; all interactions go through the Soko Mtaa backend REST API using axios, keeping the mobile bundle small.

The design mirrors the existing M-Pesa architecture wherever possible: the same `payments` table is extended (not duplicated), the same `WalletService` and `NotificationService` are reused, and the frontend PayPal payment sheet follows the same UX pattern as `MpesaPaymentSheet`.

PayPal does not support KES natively, so all amounts are converted to USD at checkout using a configurable `PAYPAL_KES_TO_USD_RATE` environment variable. The KES amount is always shown to the resident alongside the USD equivalent before confirmation.

### Key Design Decisions

- **No PayPal SDK (backend or frontend)** — raw REST API calls via Guzzle (backend) and axios (frontend). Avoids large dependency, gives full control over request/response handling.
- **OAuth2 token caching via Laravel Cache** — tokens cached 50 minutes (same pattern as `MpesaService`), keyed as `paypal_access_token`.
- **Single `payments` table** — three nullable columns added (`paypal_order_id`, `paypal_transaction_id`, `payment_method`). All existing records default `payment_method = mpesa`.
- **Capture + webhook dual confirmation** — the frontend calls capture after PayPal approval, and the webhook provides server-side fallback confirmation if the browser closes before capture returns.
- **Idempotency throughout** — both the capture endpoint and webhook handler check for `completed` status before re-processing.
- **Dedicated `paypal` log channel** — daily driver, 30-day retention, mirrors the existing `mpesa` channel.

---

## Architecture

### System Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 14)                        │
│                                                                     │
│  PaymentMethodSelector ──► MpesaPaymentSheet (existing, unchanged)  │
│         │                                                           │
│         └──────────────► PayPalPaymentSheet                         │
│                              │                                      │
│                          usePayPal hook                             │
│                              │  axios calls                         │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ HTTPS
┌──────────────────────────────┼──────────────────────────────────────┐
│                    BACKEND (Laravel 11)                             │
│                                                                     │
│              PayPalController                                       │
│         ┌────────┬───────────┬──────────┐                          │
│    create-order  capture  webhook  status                           │
│         │        │           │          │                           │
│         └────────┴───────────┴──────────┘                          │
│                        │                                            │
│                  PayPalService                                      │
│         ┌──────────────┴──────────────┐                            │
│    generateToken()              createOrder()                       │
│    captureOrder()               verifyWebhookSignature()            │
│    convertKesToUsd()                                                │
│         │                            │                             │
│    Laravel Cache               Guzzle HTTP Client                  │
│    (token, 50 min)                   │                             │
│                                      │ HTTPS                       │
└──────────────────────────────────────┼─────────────────────────────┘
                                       │
┌──────────────────────────────────────┼─────────────────────────────┐
│                        PayPal REST API                             │
│                                                                     │
│  POST /v2/checkout/orders          (create order)                  │
│  POST /v2/checkout/orders/{id}/capture  (capture)                  │
│  POST /oauth2/token                (OAuth2 token)                  │
│  POST /v1/notifications/verify-webhook-signature                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Payment Flow Sequence

```
Resident                Frontend              Backend               PayPal API
   │                       │                     │                      │
   │  Selects PayPal        │                     │                      │
   │──────────────────────►│                     │                      │
   │                       │  POST /paypal/create-order                 │
   │                       │────────────────────►│                      │
   │                       │                     │  POST /v2/checkout/orders
   │                       │                     │─────────────────────►│
   │                       │                     │◄─────────────────────│
   │                       │                     │  {order_id, approve_url}
   │                       │◄────────────────────│                      │
   │  Opens PayPal tab      │                     │                      │
   │◄──────────────────────│                     │                      │
   │  Approves payment      │                     │                      │
   │  (in PayPal popup)     │                     │                      │
   │  Returns to app        │                     │                      │
   │──────────────────────►│                     │                      │
   │                       │  POST /paypal/capture-order                │
   │                       │────────────────────►│                      │
   │                       │                     │  POST /v2/checkout/orders/{id}/capture
   │                       │                     │─────────────────────►│
   │                       │                     │◄─────────────────────│
   │                       │                     │  {status: COMPLETED, txn_id}
   │                       │                     │  ── update Payment → completed
   │                       │                     │  ── update Reservations → paid
   │                       │                     │  ── credit trader Wallet
   │                       │                     │  ── send Notifications
   │                       │◄────────────────────│                      │
   │                       │  poll /status/{id}   │                      │
   │                       │────────────────────►│                      │
   │  Success screen        │◄────────────────────│                      │
   │◄──────────────────────│                     │                      │
   │                       │                     │◄─ webhook (async)────│
   │                       │                     │  PAYMENT.CAPTURE.COMPLETED
   │                       │                     │  (idempotent — already completed)
```

### Webhook Fallback Flow

```
PayPal                   Backend
   │                        │
   │  POST /paypal/webhook  │
   │───────────────────────►│
   │                        │  verify signature headers
   │                        │  locate Payment by paypal_order_id
   │                        │  if status == 'pending' → process (same as capture)
   │                        │  if status == 'completed' → no-op (idempotent)
   │◄───────────────────────│
   │  HTTP 200 (always)     │
```

---

## Components and Interfaces

### Backend Components

#### `PayPalService` (`app/Services/PayPalService.php`)

Responsible for all communication with the PayPal REST API.

```php
class PayPalService
{
    public function __construct(
        private string $clientId,
        private string $clientSecret,
        private string $baseUrl,         // sandbox or production URL
        private string $kesToUsdRate,    // from PAYPAL_KES_TO_USD_RATE env
    ) {}

    // OAuth2 — cached 50 minutes under key 'paypal_access_token'
    public function generateToken(): string;

    // Creates a PayPal Orders v2 resource; returns ['order_id', 'approve_url']
    public function createOrder(float $usdAmount, string $reservationRef): array;

    // Calls the capture endpoint; returns the full PayPal capture response
    public function captureOrder(string $paypalOrderId): array;

    // Verifies the PAYPAL-* signature headers on incoming webhooks
    public function verifyWebhookSignature(array $headers, string $body): bool;

    // Converts KES to USD, rounded to 2dp; throws PaymentFailedException if rate not set
    public function convertKesToUsd(float $kesAmount): float;
}
```

**Environment / config keys read:**

| Config key | Env var | Purpose |
|---|---|---|
| `paypal.client_id` | `PAYPAL_CLIENT_ID` | OAuth2 credential |
| `paypal.client_secret` | `PAYPAL_CLIENT_SECRET` | OAuth2 credential |
| `paypal.env` | `PAYPAL_ENV` | `sandbox` or `production` |
| `paypal.base_url` | Derived from `PAYPAL_ENV` | API base URL |
| `paypal.kes_to_usd_rate` | `PAYPAL_KES_TO_USD_RATE` | Exchange rate |

#### `PayPalController` (`app/Http/Controllers/Payment/PayPalController.php`)

Handles all HTTP concerns. Uses `ApiResponse` trait. All authenticated endpoints require `auth:sanctum` + `throttle` middleware.

| Method | Route | Auth | Description |
|---|---|---|---|
| `createOrder` | `POST /api/payments/paypal/create-order` | Sanctum (resident/admin) | Creates PayPal order, persists Payment record |
| `captureOrder` | `POST /api/payments/paypal/capture-order` | Sanctum (resident/admin) | Captures funds, finalises payment |
| `checkStatus` | `GET /api/payments/paypal/status/{order_id}` | Sanctum | Returns payment status for polling |
| `webhook` | `POST /api/payments/paypal/webhook` | Public | Receives PayPal event notifications |

#### `config/paypal.php`

```php
return [
    'client_id'      => env('PAYPAL_CLIENT_ID'),
    'client_secret'  => env('PAYPAL_CLIENT_SECRET'),
    'env'            => env('PAYPAL_ENV', 'sandbox'),
    'base_url'       => env('PAYPAL_ENV') === 'production'
                        ? 'https://api-m.paypal.com'
                        : 'https://api-m.sandbox.paypal.com',
    'kes_to_usd_rate' => env('PAYPAL_KES_TO_USD_RATE'),
    'webhook_id'     => env('PAYPAL_WEBHOOK_ID'),
];
```

#### `PaymentFailedException` (existing)

`PayPalService` throws this exception on: token fetch failure, missing exchange rate, or failed API calls. The global exception handler in `Handler.php` renders it as a `402` JSON error.

### Frontend Components

#### `PaymentMethodSelector` (`components/shared/PaymentMethodSelector.tsx`)

A new shared component rendered before the payment sheet. Presents two tappable cards:

```
┌──────────────────────────┐  ┌──────────────────────────┐
│  📱  M-Pesa              │  │  🌐  PayPal              │
│  Lipa kwa simu yako      │  │  Lipa kwa kadi/PayPal    │
│  Pay with your phone     │  │  Pay with card/PayPal    │
└──────────────────────────┘  └──────────────────────────┘
```

- Minimum 48×48px tap targets per AGENTS.md rules
- Selected method highlighted with `--color-primary` border
- Last-used method persisted to `localStorage` under key `soko_payment_method`
- Falls back to `mpesa` if `localStorage` unavailable

**Props:**
```typescript
interface PaymentMethodSelectorProps {
  onSelect: (method: 'mpesa' | 'paypal') => void;
  defaultMethod?: 'mpesa' | 'paypal';
  reservationTotal: number; // KES amount, for displaying USD equivalent
}
```

#### `PayPalPaymentSheet` (`components/shared/PayPalPaymentSheet.tsx`)

Bottom sheet component (mirrors `MpesaPaymentSheet` UX). States:

1. **Summary** — shows KES amount, USD equivalent, item breakdown, "Pay with PayPal" button
2. **Loading** — skeleton loader while `create-order` is in-flight
3. **Awaiting approval** — shows "PayPal tab opened. Return here after approving." with skeleton
4. **Capturing** — skeleton while `capture-order` is in-flight
5. **Polling** — "Checking payment status..." with 3-second interval skeleton
6. **Success** — navigates to reservation detail page
7. **Failed** — inline error with "Try Again" + "Switch to M-Pesa" buttons
8. **Timeout** — shown after 5-minute polling limit: bilingual message to check PayPal email

**Props:**
```typescript
interface PayPalPaymentSheetProps {
  reservationIds: number[];
  totalKes: number;
  onSuccess: (reservationId: number) => void;
  onCancel: () => void;
}
```

#### `usePayPal` hook (`hooks/usePayPal.ts`)

Encapsulates all PayPal API calls and polling logic.

```typescript
interface UsePayPalReturn {
  createOrder: (reservationIds: number[]) => Promise<{ orderId: string; approveUrl: string }>;
  captureOrder: (orderId: string) => Promise<void>;
  pollStatus: (orderId: string) => void;
  status: 'idle' | 'creating' | 'awaiting_approval' | 'capturing' | 'polling' | 'completed' | 'failed' | 'timeout';
  error: string | null;
  stopPolling: () => void;
}
```

Polling logic:
- Calls `GET /api/payments/paypal/status/{order_id}` every 3 seconds
- Stops on `completed` or `failed` status
- Stops after 5 minutes (100 × 3s intervals), sets status to `timeout`
- Uses `useRef` for the interval handle to avoid stale closures

---

## Data Models

### Database Migration: `add_paypal_columns_to_payments_table`

```php
Schema::table('payments', function (Blueprint $table) {
    $table->string('paypal_order_id')->nullable()->unique()->after('mpesa_checkout_request_id');
    $table->string('paypal_transaction_id')->nullable()->unique()->after('paypal_order_id');
    $table->string('payment_method', 20)->default('mpesa')->after('paypal_transaction_id');
});
```

This migration is non-destructive. All existing rows get `payment_method = 'mpesa'` and both PayPal columns null.

### Updated `Payment` Model (`app/Models/Payment.php`)

`$fillable` additions:
```php
'paypal_order_id',
'paypal_transaction_id',
'payment_method',
```

`$casts` additions:
```php
'paypal_order_id'       => 'string',
'paypal_transaction_id' => 'string',
```

### `Reservation` model — no schema changes

The `Reservation` model already stores `mpesa_checkout_request_id`. For PayPal, `paypal_order_id` on the `Payment` record is sufficient to resolve linked reservations via the `Payment → reservation_id` relation plus the existing `Reservation::where('id', $payment->reservation_id)` pattern. However, to support bulk reservation lookups (same pattern as M-Pesa), we rely on the fact that one `Payment` record points to one `reservation_id`, and the frontend sends all target `reservation_ids` in the create-order request — the controller iterates and sets `paypal_order_id` on each Reservation record that needs it.

To support that, a `paypal_order_id` nullable string column is added to `reservations` in the **same migration** as the payments table change:

```php
Schema::table('reservations', function (Blueprint $table) {
    $table->string('paypal_order_id')->nullable()->after('mpesa_checkout_request_id');
});
```

### API Contracts

#### `POST /api/payments/paypal/create-order`

Request:
```json
{
  "reservation_ids": [42, 43],
  "currency": "KES"
}
```

Response (200):
```json
{
  "success": true,
  "message": "PayPal order created. Redirect resident to approve.",
  "data": {
    "order_id": "4XD76138X7329860L",
    "approve_url": "https://www.sandbox.paypal.com/checkoutnow?token=4XD76138X7329860L",
    "amount_kes": 250.00,
    "amount_usd": 1.92
  },
  "meta": null
}
```

Error (422):
```json
{
  "success": false,
  "message": "Reservation 43 does not belong to you or is not pending.",
  "errors": null,
  "code": "VALIDATION_ERROR"
}
```

#### `POST /api/payments/paypal/capture-order`

Request:
```json
{
  "order_id": "4XD76138X7329860L"
}
```

Response (200 — success):
```json
{
  "success": true,
  "message": "Payment captured successfully.",
  "data": {
    "status": "completed",
    "paypal_transaction_id": "5O190127TN364715T",
    "amount": 250.00,
    "paid_at": "2025-01-15T10:30:00Z"
  },
  "meta": null
}
```

Response (200 — already completed, idempotent):
```json
{
  "success": true,
  "message": "Payment already completed.",
  "data": { "status": "completed" },
  "meta": null
}
```

Error (402):
```json
{
  "success": false,
  "message": "PayPal capture failed. Order status: VOIDED.",
  "errors": null,
  "code": "PAYMENT_FAILED"
}
```

#### `GET /api/payments/paypal/status/{order_id}`

Response (200):
```json
{
  "success": true,
  "message": "Payment status retrieved.",
  "data": {
    "status": "completed",
    "paypal_transaction_id": "5O190127TN364715T",
    "amount": 250.00,
    "paid_at": "2025-01-15T10:30:00Z"
  },
  "meta": null
}
```

#### `POST /api/payments/paypal/webhook`

Always returns `200`. Payload is a PayPal event JSON body with event type `PAYMENT.CAPTURE.COMPLETED`.

Signature verification uses four required headers:
- `PAYPAL-TRANSMISSION-ID`
- `PAYPAL-TRANSMISSION-TIME`
- `PAYPAL-CERT-URL`
- `PAYPAL-AUTH-ALGO`

Plus the configured `PAYPAL_WEBHOOK_ID`. Verification calls `POST /v1/notifications/verify-webhook-signature` on the PayPal API.

### TypeScript Types (`types/index.ts` additions)

```typescript
export interface PayPalCreateOrderResponse {
  order_id: string;
  approve_url: string;
  amount_kes: number;
  amount_usd: number;
}

export interface PayPalPaymentStatus {
  status: 'pending' | 'completed' | 'failed';
  paypal_transaction_id: string | null;
  amount: number;
  paid_at: string | null;
}
```

---

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: OAuth Token Caching

*For any* two calls to `PayPalService::generateToken()` made within 50 minutes of each other, the underlying HTTP request to the PayPal token endpoint should be made exactly once — the second call should return the cached value without issuing a new HTTP request.

**Validates: Requirements 1.4**

### Property 2: Amount Calculation and KES→USD Conversion

*For any* set of reservations with known `total_amount` values and a configured `PAYPAL_KES_TO_USD_RATE`, the USD amount presented to PayPal must equal `(sum of reservation total_amounts) * rate`, rounded to exactly 2 decimal places. Rounding must be consistent: `round($kesTotal * $rate, 2)`.

**Validates: Requirements 2.3, 2.4, 9.1, 9.2**

### Property 3: Reservation Ownership and Status Validation

*For any* `create-order` request, if any of the provided `reservation_ids` either does not belong to the authenticated user or does not have status `pending`, the request must be rejected with a `422 VALIDATION_ERROR` and no Payment record or PayPal order shall be created.

**Validates: Requirements 2.2**

### Property 4: Payment Record Creation Invariant

*For any* successful `create-order` response, a `Payment` record must exist in the database with: `status = 'pending'`, `payment_method = 'paypal'`, `paypal_order_id` matching the returned `order_id`, and every `Reservation` in the request must have its `paypal_order_id` set to the same value.

**Validates: Requirements 2.5, 2.6, 8.4**

### Property 5: Capture Success Post-Condition Invariant

*For any* successful PayPal capture (where PayPal returns `COMPLETED`), the following must all be true after the operation: the `Payment` record has `status = 'completed'` and a non-null `paid_at`; `paypal_transaction_id` is populated with the value from `purchase_units[0].payments.captures[0].id`; all linked `Reservation` records have `status = 'paid'`; the relevant trader's `Wallet` balance has increased by the reservation amount; and in-app notifications have been created for both the resident and trader.

**Validates: Requirements 3.2, 3.3**

### Property 6: Payment Processing Idempotence

*For any* `Payment` record that is already in `completed` status, calling either the `capture-order` endpoint or receiving a `PAYMENT.CAPTURE.COMPLETED` webhook event for that payment's `order_id` must produce no changes to the `Payment` record, no `Reservation` status changes, no additional `WalletTransaction` credits, and no duplicate `Notification` records. The response must be `200` in both cases.

**Validates: Requirements 3.5, 4.5**

### Property 7: Webhook Processing for Pending Payments

*For any* `PAYMENT.CAPTURE.COMPLETED` webhook event received for a `Payment` record in `pending` status, after processing: the `Payment` status must be `completed`, all linked `Reservation` records must be `paid`, and the trader wallet must be credited — identical post-conditions to Property 5.

**Validates: Requirements 4.2**

### Property 8: Payment Method Preference Persistence

*For any* payment method selection (`mpesa` or `paypal`) made via `PaymentMethodSelector`, the selected value must be written to `localStorage` under the key `soko_payment_method`, and on subsequent mounts of the component, the stored value must be pre-selected. If `localStorage` throws (e.g., private browsing), the component must fall back silently to `mpesa` without throwing.

**Validates: Requirements 5.5, 5.6**

### Property 9: Polling Timeout Termination

*For any* polling session started by `usePayPal`, if neither `completed` nor `failed` status is returned within 300 seconds (5 minutes, equivalent to 100 × 3-second intervals), polling must stop and the hook status must transition to `timeout`. No further API calls must be made after the timeout state is reached.

**Validates: Requirements 6.6**

### Property 10: Status Endpoint Response Shape

*For any* authenticated request to `GET /api/payments/paypal/status/{order_id}` where the Payment record exists and belongs to the authenticated user, the response `data` object must always contain all four fields: `status`, `paypal_transaction_id`, `amount`, and `paid_at` (null values are acceptable for fields not yet set, but the keys must be present).

**Validates: Requirements 7.2**

### Property 11: Logs Never Expose Secrets

*For any* operation performed by `PayPalService` (token generation, order creation, capture, webhook verification), the log output written to the `paypal` channel must not contain the literal value of `PAYPAL_CLIENT_SECRET` or any OAuth2 access token string. This must hold even when logging error responses that include the full response body.

**Validates: Requirements 10.5**

### Property 12: PayPal Payment Completion Notifications

*For any* PayPal payment that transitions to `completed` status (via capture or webhook), both the owning resident and the trader of each linked reservation must receive an in-app `Notification` record. The resident notification title must contain the success indicator and reservation code; the trader notification must reference the payment source as PayPal.

**Validates: Requirements 11.1, 11.3**

### Property 13: No SMS for PayPal Events

*For any* PayPal payment event (success or failure), no `sms_log` record must be created and no call to `TalkSasaService` must be made. PayPal notifications are in-app only.

**Validates: Requirements 11.4**

### Property 14: Authentication and Ownership Enforcement

*For any* request to `POST /api/payments/paypal/create-order` or `POST /api/payments/paypal/capture-order` made without a valid Sanctum token, the response must be `401 UNAUTHENTICATED`. For any request made by a `trader` role user (who is not admin), the response must be `403 UNAUTHORIZED`. For any capture request where the `order_id` belongs to a `Payment` record owned by a different user, the response must be `404 NOT_FOUND` (to avoid leaking the existence of other users' payments).

**Validates: Requirements 12.3, 12.4**

---

## Error Handling

### Backend Error Handling

All `PayPalService` methods wrap API calls in try/catch blocks. Failures produce log entries at `ERROR` level to the `paypal` channel and then throw or return structured errors — they do not swallow exceptions silently.

| Scenario | Service behavior | Controller response |
|---|---|---|
| OAuth token request fails | throws `PaymentFailedException` | `500 PAYMENT_FAILED` |
| `PAYPAL_KES_TO_USD_RATE` missing | throws `PaymentFailedException("PayPal exchange rate is not configured")` | `500 PAYMENT_FAILED` |
| `create-order` PayPal API error | returns `null` or throws | `500 PAYMENT_FAILED` |
| `capture-order` status != COMPLETED | controller handles, no throw | `402 PAYMENT_FAILED` |
| Webhook signature invalid | `verifyWebhookSignature()` returns false | `400` (no processing) |
| Webhook — Payment not found | no throw | `200` (to prevent retry loop) |
| Reservation not pending or not owned | controller validates before API call | `422 VALIDATION_ERROR` |
| Capture on already-completed payment | controller short-circuits | `200` (idempotent) |

All HTTP errors follow the standard `ApiResponse` error format: `{ success, message, errors, code }`.

### Frontend Error Handling

`usePayPal` translates API error codes to user-facing messages using the locale system:

| `code` | Swahili | English |
|---|---|---|
| `PAYMENT_FAILED` | "Malipo ya PayPal hayakufanikiwa. Jaribu tena." | "PayPal payment failed. Please try again." |
| `VALIDATION_ERROR` | "Hifadhi moja au zaidi hazipatikani." | "One or more reservations are unavailable." |
| `UNAUTHENTICATED` | Redirect to login | Redirect to login |
| Network timeout | "Ukaguzi wa muunganiko wako wa intaneti." | "Check your internet connection." |

The `PayPalPaymentSheet` renders errors inline (below the Pay button) — no modal or toast. A "Try Again" button resets the hook state to `idle`. A "Switch to M-Pesa" button calls `onCancel()` to return to `PaymentMethodSelector`.

### Logging Strategy

```
PayPal log channel (config/logging.php):
  driver: daily
  path:   storage/logs/paypal.log
  days:   30
```

Log format (all entries include `order_id` or `event_type` as context):

- `INFO` — outbound requests: method, endpoint, `order_id`
- `INFO` — webhook received: event type, resource ID
- `INFO` — successful capture: `order_id`, `transaction_id`
- `ERROR` — any API failure: full response body (client secret and token redacted)
- `WARNING` — webhook signature verification failure: `transmission_id`
- `WARNING` — webhook for non-existent payment: `order_id`

---

## Testing Strategy

### Dual Testing Approach

Both unit/example tests and property-based tests are required and complementary:
- **Unit/Example tests** catch specific behaviors, error conditions, and API contracts
- **Property-based tests** verify universal rules hold across arbitrary inputs

### Unit / Example Tests (Laravel `tests/Feature/PayPal/`)

| Test | Covers |
|---|---|
| `test_paypal_config_uses_sandbox_url` | Req 1.1, 1.2 |
| `test_paypal_config_uses_production_url` | Req 1.3 |
| `test_token_request_failure_throws_exception` | Req 1.5 |
| `test_paypal_config_file_has_required_keys` | Req 1.6 |
| `test_create_order_endpoint_exists_and_requires_auth` | Req 2.1, 12.3 |
| `test_webhook_endpoint_is_public` | Req 4.1 |
| `test_webhook_rejects_invalid_signature` | Req 4.3, 4.4 |
| `test_webhook_returns_200_for_unknown_payment` | Req 4.6 |
| `test_payment_method_selector_renders_two_options` | Req 5.1 |
| `test_mpesa_sheet_shown_when_mpesa_selected` | Req 5.2 |
| `test_paypal_sheet_shown_when_paypal_selected` | Req 5.3 |
| `test_status_endpoint_returns_all_required_fields` | Req 7.2 |
| `test_status_returns_404_for_unowned_order` | Req 7.3 |
| `test_migration_adds_paypal_columns` | Req 8.1, 8.2, 8.3 |
| `test_migration_is_non_destructive` | Req 8.5 |
| `test_paypal_sheet_displays_both_kes_and_usd_amounts` | Req 9.3 |
| `test_paypal_sheet_displays_exchange_rate_disclaimer` | Req 9.5 |
| `test_paypal_log_channel_configured_with_30_day_retention` | Req 10.1 |
| `test_create_order_fails_with_500_on_paypal_api_error` | Req 2.7 |
| `test_capture_fails_with_402_on_non_completed_status` | Req 3.4 |

### Property-Based Tests (PBT) — `tests/Unit/PayPal/`

Use **PestPHP** with **`spatie/pest-plugin-laravel-ignition`** or the **`eris/eris`** package for PHP property-based testing. Alternatively, write parameterized Pest tests using `it()->with()` with large random datasets. Configure a minimum of **100 iterations** per property test.

Each test is tagged with the property it validates:

```php
// Feature: paypal-payment-integration, Property 1: OAuth token caching
it('only requests a new token once across multiple generateToken() calls within 50 minutes')
    ->repeat(100)
    ->with(fn() => [/* randomly seeded token values */]);

// Feature: paypal-payment-integration, Property 2: Amount calculation and KES→USD conversion
it('converts KES total to USD correctly for any set of reservation amounts and any rate')
    ->repeat(100)
    ->with(fn() => generateRandomReservationSets());

// Feature: paypal-payment-integration, Property 3: Reservation ownership validation
it('rejects create-order for any reservation not owned by the authenticated user')
    ->repeat(100)
    ->with(fn() => generateMixedOwnershipReservationSets());

// Feature: paypal-payment-integration, Property 4: Payment record creation invariant
it('always creates a pending paypal Payment record with correct fields on successful create-order')
    ->repeat(100)
    ->with(fn() => generateValidCreateOrderRequests());

// Feature: paypal-payment-integration, Property 5: Capture success post-condition
it('sets payment completed, marks reservations paid, credits wallet for any completed capture')
    ->repeat(100)
    ->with(fn() => generatePendingPaypalPayments());

// Feature: paypal-payment-integration, Property 6: Payment processing idempotence
it('does not re-process any already-completed payment regardless of trigger (capture or webhook)')
    ->repeat(100)
    ->with(fn() => generateCompletedPaypalPayments());

// Feature: paypal-payment-integration, Property 7: Webhook processing for pending payments
it('processes pending payment correctly when triggered by webhook')
    ->repeat(100)
    ->with(fn() => generatePendingPaypalPayments());

// Feature: paypal-payment-integration, Property 8: Payment method preference persistence
it('persists any selected payment method to localStorage and restores it on next mount')
    ->repeat(100)
    ->with(['mpesa', 'paypal']);

// Feature: paypal-payment-integration, Property 9: Polling timeout termination
it('stops polling and transitions to timeout status after 300 seconds for any order_id')
    ->repeat(100)
    ->with(fn() => generateRandomOrderIds());

// Feature: paypal-payment-integration, Property 10: Status endpoint response shape
it('always returns all four required fields in status response for any owned payment')
    ->repeat(100)
    ->with(fn() => generatePaymentsInVariousStates());

// Feature: paypal-payment-integration, Property 11: Logs never expose secrets
it('never writes client_secret or access token to any log channel for any API operation')
    ->repeat(100)
    ->with(fn() => generateRandomApiOperations());

// Feature: paypal-payment-integration, Property 12: Completion notifications
it('creates in-app notifications for both resident and trader for any completed PayPal payment')
    ->repeat(100)
    ->with(fn() => generatePendingPaypalPayments());

// Feature: paypal-payment-integration, Property 13: No SMS for PayPal events
it('never creates an sms_log record for any PayPal payment event')
    ->repeat(100)
    ->with(fn() => generatePaypalPaymentEvents());

// Feature: paypal-payment-integration, Property 14: Auth and ownership enforcement
it('returns 401 for unauthenticated, 403 for wrong role, 404 for unowned order on any capture request')
    ->repeat(100)
    ->with(fn() => generateUnauthorizedCaptureScenarios());
```

### Test Coverage Goals

- All 14 correctness properties covered by property-based tests
- All 21 example/edge-case scenarios covered by unit tests
- `PayPalService` tested with mocked Guzzle client (`Http::fake()`)
- `PayPalController` tested with `RefreshDatabase` and mocked `PayPalService`
- Frontend components tested with React Testing Library (`@testing-library/react`)
- `usePayPal` hook tested with `renderHook` + mocked axios

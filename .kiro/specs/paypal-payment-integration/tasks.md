# Implementation Plan: PayPal Payment Integration

## Overview

Implement PayPal Orders v2 as a second payment method alongside M-Pesa. The backend uses
raw Guzzle HTTP (no PayPal SDK). The frontend uses axios (no PayPal JS SDK). All work
mirrors the existing M-Pesa architecture: same `payments` table (extended), same
`WalletService` / `NotificationService`, same bottom-sheet UX pattern.

---

## Tasks

- [x] 1. Database migration — extend `payments` and `reservations` tables
  - Create migration `add_paypal_columns_to_payments_and_reservations_table`
  - Add `paypal_order_id` (string, nullable, unique) after `mpesa_checkout_request_id` on `payments`
  - Add `paypal_transaction_id` (string, nullable, unique) after `paypal_order_id` on `payments`
  - Add `payment_method` (string(20), default `'mpesa'`) after `paypal_transaction_id` on `payments`
  - Add `paypal_order_id` (string, nullable) after `mpesa_checkout_request_id` on `reservations`
  - Migration must be non-destructive; all existing rows keep their data
  - _Requirements: 8.1, 8.2, 8.3, 8.5_

- [x] 2. Update `Payment` model
  - Add `paypal_order_id`, `paypal_transaction_id`, `payment_method` to `$fillable`
  - Add `paypal_order_id => 'string'`, `paypal_transaction_id => 'string'` to `$casts`
  - _Requirements: 8.4_

- [x] 3. Add `paypal` log channel to `config/logging.php`
  - Mirror the existing `mpesa` channel: `driver => daily`, `path => storage_path('logs/paypal.log')`, `days => 30`
  - _Requirements: 10.1_

- [x] 4. Create `config/paypal.php`
  - Keys: `client_id`, `client_secret`, `env` (default `sandbox`), `base_url` (derived from `env`), `kes_to_usd_rate`, `webhook_id`
  - All values sourced from environment variables via `env()`
  - _Requirements: 1.1, 1.2, 1.3, 1.6_

- [x] 5. Add PayPal environment variables to `.env` and `.env.example`
  - Add `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV=sandbox`, `PAYPAL_KES_TO_USD_RATE`, `PAYPAL_WEBHOOK_ID`
  - Add placeholder (empty) values to `.env.example`; never commit real credentials
  - _Requirements: 1.1, 12.1_

- [x] 6. Implement `PayPalService` (`app/Services/PayPalService.php`)
  - [x] 6.1 Scaffold class with constructor reading from `config('paypal.*')`
    - Properties: `clientId`, `clientSecret`, `baseUrl`, `kesToUsdRate`, `webhookId`
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 6.2 Implement `generateToken(): string`
    - POST `{baseUrl}/v1/oauth2/token` with Basic auth and `grant_type=client_credentials`
    - Cache result for 3000 seconds under key `paypal_access_token` (mirrors M-Pesa pattern)
    - On failure log ERROR to `paypal` channel (without logging the secret) and throw `PaymentFailedException`
    - _Requirements: 1.4, 1.5, 10.2, 10.5_

  - [x] 6.3 Implement `convertKesToUsd(float $kesAmount): float`
    - Multiply by `$this->kesToUsdRate`, round to 2dp
    - Throw `PaymentFailedException('PayPal exchange rate is not configured')` if rate is null/empty
    - _Requirements: 9.1, 9.2, 9.4_

  - [x] 6.4 Implement `createOrder(float $usdAmount, string $reservationRef): array`
    - POST `{baseUrl}/v2/checkout/orders` with bearer token
    - Payload: `intent=CAPTURE`, single purchase unit with `currency_code=USD`, `value={usdAmount}`, `reference_id={reservationRef}`
    - Return `['order_id' => ..., 'approve_url' => ...]` extracted from response links
    - Log INFO (method + endpoint + order_id); log ERROR on failure (response body, no secrets)
    - _Requirements: 2.1, 10.2, 10.3_

  - [x] 6.5 Implement `captureOrder(string $paypalOrderId): array`
    - POST `{baseUrl}/v2/checkout/orders/{paypalOrderId}/capture` with bearer token
    - Return full PayPal response array
    - Log INFO on success; log ERROR on failure
    - _Requirements: 3.1, 10.2, 10.3_

  - [x] 6.6 Implement `verifyWebhookSignature(array $headers, string $body): bool`
    - POST `{baseUrl}/v1/notifications/verify-webhook-signature` with required PayPal headers and `webhook_id`
    - Return `true` only when response `verification_status === 'SUCCESS'`
    - Log WARNING on failure (include `transmission_id`, never include secret or token)
    - _Requirements: 4.3, 10.5_

  - [x] 6.7 Write property test for `generateToken()` — Property 1: OAuth token caching
    - **Property 1: OAuth Token Caching**
    - **Validates: Requirements 1.4**
    - Use `Http::fake()` to mock token endpoint; assert HTTP was called exactly once across two calls within cache TTL

  - [x] 6.8 Write property test for `convertKesToUsd()` — Property 2: Amount calculation
    - **Property 2: Amount Calculation and KES→USD Conversion**
    - **Validates: Requirements 2.3, 2.4, 9.1, 9.2**
    - Generate random KES amounts and rates; assert `round(amount * rate, 2) === result` for all inputs

- [x] 7. Implement `PayPalController` (`app/Http/Controllers/Payment/PayPalController.php`)
  - [x] 7.1 Scaffold controller with `ApiResponse` trait and `PayPalService` + `WalletService` + `NotificationService` injected via constructor
    - Use `auth:sanctum` + `throttle` on authenticated methods (applied in routes, not constructor)
    - _Requirements: 12.3, 12.5_

  - [x] 7.2 Implement `createOrder(Request $request): JsonResponse`
    - Validate: `reservation_ids` (array of integers, required), `currency` (in: USD, KES)
    - For each reservation_id: assert `resident_id === Auth::id()` and `status === 'pending'`; return 422 `VALIDATION_ERROR` if any fail
    - Sum `total_amount` across reservations; convert to USD via `convertKesToUsd()`
    - Call `PayPalService::createOrder()`; on failure return 500 `PAYMENT_FAILED`
    - Create `Payment` record: `status=pending`, `payment_method=paypal`, `type=reservation`, `paypal_order_id=order_id`, `user_id=Auth::id()`, `amount=total KES`, `phone_number=''`
    - Update each `Reservation` with `paypal_order_id`
    - Return `order_id`, `approve_url`, `amount_kes`, `amount_usd`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 7.3 Write property test for `createOrder` — Property 3: Reservation ownership validation
    - **Property 3: Reservation Ownership and Status Validation**
    - **Validates: Requirements 2.2**
    - Generate reservation sets with mixed ownership/status; assert every non-owned or non-pending request returns 422 and creates no Payment record

  - [x] 7.4 Write property test for `createOrder` — Property 4: Payment record creation invariant
    - **Property 4: Payment Record Creation Invariant**
    - **Validates: Requirements 2.5, 2.6, 8.4**
    - Assert that every successful `create-order` response leaves a `pending` Payment row with correct `paypal_order_id` and every reservation's `paypal_order_id` updated

  - [x] 7.5 Implement `captureOrder(Request $request): JsonResponse`
    - Validate: `order_id` (string, required)
    - Find `Payment` by `paypal_order_id` and `user_id === Auth::id()`; return 404 if not found
    - Idempotency check: if `status === 'completed'` return 200 immediately
    - Call `PayPalService::captureOrder()`; check `purchase_units[0].payments.captures[0].status`
    - On `COMPLETED`: update Payment (`status=completed`, `paypal_transaction_id=...`, `paid_at=now()`); mark linked Reservations `paid`; credit trader wallets via `WalletService`; send in-app notifications via `NotificationService`
    - On non-COMPLETED: update Payment to `failed`, Reservations to `cancelled`, return 402 `PAYMENT_FAILED`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 12.4_

  - [x] 7.6 Write property test for `captureOrder` — Property 5: Capture success post-conditions
    - **Property 5: Capture Success Post-Condition Invariant**
    - **Validates: Requirements 3.2, 3.3**
    - For any completed capture: assert Payment is `completed`, `paid_at` non-null, transaction ID set, all linked Reservations are `paid`, trader wallet credited, notifications created

  - [x] 7.7 Write property test for `captureOrder` — Property 6: Idempotence
    - **Property 6: Payment Processing Idempotence**
    - **Validates: Requirements 3.5, 4.5**
    - Call capture twice on an already-completed Payment; assert no state change, no duplicate wallet credits, no duplicate notifications, response is 200

  - [x] 7.8 Implement `webhook(Request $request): JsonResponse`
    - Public endpoint — no Sanctum required
    - Extract and pass PAYPAL-* signature headers + raw request body to `verifyWebhookSignature()`
    - On signature failure: log WARNING to `paypal` channel, return 400
    - Log INFO: event type and resource ID
    - Handle `PAYMENT.CAPTURE.COMPLETED` only: find Payment by `paypal_order_id` from event body
    - If Payment not found: log WARNING, return 200 (prevent retry loop)
    - If Payment `pending`: run same post-payment logic as `captureOrder` (wallet credit, reservation update, notifications)
    - If Payment already `completed`: no-op, return 200
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 10.4_

  - [x] 7.9 Write property test for `webhook` — Property 7: Webhook processing for pending payments
    - **Property 7: Webhook Processing for Pending Payments**
    - **Validates: Requirements 4.2**
    - Assert that any pending Payment processed via webhook reaches the same post-conditions as Property 5

  - [x] 7.10 Implement `checkStatus(string $orderId): JsonResponse`
    - Find `Payment` by `paypal_order_id` and `user_id === Auth::id()`; return 404 if not found
    - Return `status`, `paypal_transaction_id`, `amount`, `paid_at` in standard `ApiResponse` format
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 7.11 Write property test for `checkStatus` — Property 10: Status response shape
    - **Property 10: Status Endpoint Response Shape**
    - **Validates: Requirements 7.2**
    - For any Payment in any status, assert all four fields are present in the response (nulls acceptable)

- [x] 8. Register PayPal routes in `routes/api.php`
  - Public: `Route::post('/payments/paypal/webhook', [PayPalController::class, 'webhook'])`
  - Under `auth:sanctum` + `throttle`: POST `create-order`, POST `capture-order`, GET `status/{order_id}`
  - Group under prefix `payments/paypal`
  - _Requirements: 2.1, 3.1, 4.1, 7.1, 12.3, 12.5_

- [x] 9. Checkpoint — backend smoke test
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Add TypeScript types to `frontend/types/index.ts`
  - Add `PayPalCreateOrderResponse` interface: `order_id`, `approve_url`, `amount_kes`, `amount_usd`
  - Add `PayPalPaymentStatus` interface: `status` (`'pending' | 'completed' | 'failed'`), `paypal_transaction_id: string | null`, `amount: number`, `paid_at: string | null`
  - _Requirements: 6.1, 6.3, 7.2_

- [-] 11. Implement `usePayPal` hook (`frontend/hooks/usePayPal.ts`)
  - [x] 11.1 Define `UsePayPalReturn` interface and internal state: `status`, `error`, interval ref
    - Status union: `'idle' | 'creating' | 'awaiting_approval' | 'capturing' | 'polling' | 'completed' | 'failed' | 'timeout'`
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.7_

  - [x] 11.2 Implement `createOrder(reservationIds: number[])` — POST `/payments/paypal/create-order`
    - Set status to `creating` before call; set `awaiting_approval` on success
    - On API error: set `failed`, set `error` from response code using bilingual error map
    - _Requirements: 6.2, 6.7_

  - [x] 11.3 Implement `captureOrder(orderId: string)` — POST `/payments/paypal/capture-order`
    - Set status to `capturing` before call
    - On success set `polling` and call `pollStatus`
    - On error set `failed`
    - _Requirements: 6.3_

  - [x] 11.4 Implement `pollStatus(orderId: string)` and `stopPolling()`
    - GET `/payments/paypal/status/{orderId}` every 3 seconds using `setInterval` stored in a `useRef`
    - Stop on `completed` (set status `completed`) or `failed` (set status `failed`)
    - Stop after 100 intervals (300 seconds), set status `timeout`
    - `stopPolling` clears the interval ref
    - _Requirements: 6.3, 6.6_

  - [x] 11.5 Write property test for `usePayPal` — Property 9: Polling timeout termination
    - **Property 9: Polling Timeout Termination**
    - **Validates: Requirements 6.6**
    - Use `renderHook` with mocked axios that always returns `pending`; fast-forward timers 300 s; assert status is `timeout` and no further calls are made

- [x] 12. Implement `PaymentMethodSelector` component (`frontend/components/shared/PaymentMethodSelector.tsx`)
  - Render two tappable cards: M-Pesa and PayPal, each min 48×48px
  - Highlight selected method with `--color-primary` border
  - On mount: read `localStorage.getItem('soko_payment_method')`; default to `'mpesa'` on any error
  - On selection: write to `localStorage` (wrap in try/catch for private-browsing safety); call `onSelect`
  - Display `reservationTotal` in KES and computed USD equivalent using the `NEXT_PUBLIC_PAYPAL_RATE` env var
  - Props: `onSelect`, `defaultMethod?`, `reservationTotal`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 12.1 Write property test for `PaymentMethodSelector` — Property 8: Preference persistence
    - **Property 8: Payment Method Preference Persistence**
    - **Validates: Requirements 5.5, 5.6**
    - For both `'mpesa'` and `'paypal'`: assert selection writes to localStorage; assert component pre-selects stored value on re-mount; assert graceful fallback to `'mpesa'` when localStorage throws

- [x] 13. Implement `PayPalPaymentSheet` component (`frontend/components/shared/PayPalPaymentSheet.tsx`)
  - [x] 13.1 Scaffold bottom-sheet layout mirroring `MpesaPaymentSheet` (fixed bottom, full-width)
    - Accept props: `reservationIds`, `totalKes`, `onSuccess`, `onCancel`
    - _Requirements: 6.1_

  - [x] 13.2 Implement Summary state
    - Show item breakdown, KES total, computed USD equivalent, exchange-rate disclaimer (bilingual per Req 9.5)
    - "Pay with PayPal" primary button (min 48px height)
    - _Requirements: 6.1, 9.3, 9.5_

  - [x] 13.3 Implement Loading / Awaiting-approval / Capturing / Polling states
    - Use skeleton loaders (no spinners per AGENTS.md) for `creating`, `capturing`, `polling`
    - `awaiting_approval`: show "PayPal tab opened. Return here after approving." bilingual message
    - On `creating`: call `usePayPal.createOrder()`, then `window.open(approveUrl, '_blank')`
    - On return focus (visibilitychange event): call `usePayPal.captureOrder(orderId)`
    - _Requirements: 6.2, 6.3_

  - [x] 13.4 Implement terminal states: Success, Failed, Timeout
    - `completed`: call `onSuccess(reservationIds[0])` to navigate to reservation detail
    - `failed`: inline error message (bilingual), "Try Again" button (reset hook to `idle`), "Switch to M-Pesa" button (calls `onCancel`)
    - `timeout`: bilingual message "Angalia barua pepe yako ya PayPal / Check your PayPal email for confirmation"
    - _Requirements: 6.4, 6.5, 6.6_

  - [x] 13.5 Write unit tests for `PayPalPaymentSheet`
    - Test: Summary renders KES and USD amounts
    - Test: Exchange-rate disclaimer present
    - Test: "Switch to M-Pesa" button calls `onCancel`
    - Test: `failed` state renders inline error (not toast/modal)
    - Test: `timeout` message renders in both Swahili and English
    - _Requirements: 9.3, 9.5, 6.5, 6.6_

- [x] 14. Checkpoint — frontend smoke test
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Backend feature tests (`tests/Feature/PayPal/`)
  - [x] 15.1 Write example tests covering configuration and service
    - `test_paypal_config_uses_sandbox_url` (Req 1.2)
    - `test_paypal_config_uses_production_url` (Req 1.3)
    - `test_token_request_failure_throws_exception` (Req 1.5)
    - `test_paypal_config_file_has_required_keys` (Req 1.6)
    - `test_paypal_log_channel_configured_with_30_day_retention` (Req 10.1)
    - _Requirements: 1.2, 1.3, 1.5, 1.6, 10.1_

  - [x] 15.2 Write example tests covering `create-order` endpoint
    - `test_create_order_endpoint_exists_and_requires_auth` (Req 2.1, 12.3)
    - `test_create_order_fails_for_reservations_not_owned_by_user` (Req 2.2)
    - `test_create_order_fails_for_non_pending_reservations` (Req 2.2)
    - `test_create_order_fails_with_500_on_paypal_api_error` (Req 2.7)
    - `test_migration_adds_paypal_columns` (Req 8.1, 8.2, 8.3)
    - `test_migration_is_non_destructive` (Req 8.5)
    - _Requirements: 2.1, 2.2, 2.7, 8.1, 8.2, 8.3, 8.5_

  - [x] 15.3 Write example tests covering `capture-order` and `status` endpoints
    - `test_capture_fails_with_402_on_non_completed_status` (Req 3.4)
    - `test_capture_returns_200_when_already_completed` (Req 3.5)
    - `test_status_endpoint_returns_all_required_fields` (Req 7.2)
    - `test_status_returns_404_for_unowned_order` (Req 7.3)
    - _Requirements: 3.4, 3.5, 7.2, 7.3_

  - [x] 15.4 Write example tests covering webhook
    - `test_webhook_endpoint_is_public` (Req 4.1)
    - `test_webhook_rejects_invalid_signature` (Req 4.3, 4.4)
    - `test_webhook_returns_200_for_unknown_payment` (Req 4.6)
    - _Requirements: 4.1, 4.3, 4.4, 4.6_

  - [x] 15.5 Write remaining PBT stubs in `tests/Unit/PayPal/`
    - **Property 11: Logs Never Expose Secrets** — assert no log entry for any PayPal operation contains `PAYPAL_CLIENT_SECRET` or a bearer token string
    - **Property 12: PayPal Payment Completion Notifications** — assert resident and trader both receive an in-app Notification record after any capture
    - **Property 13: No SMS for PayPal Events** — assert `sms_log` is empty after any PayPal capture or failure event
    - **Property 14: Auth and Ownership Enforcement** — assert 401 for unauthenticated, 403 for trader role, 404 for unowned order
    - **Validates: Requirements 10.5, 11.1, 11.3, 11.4, 12.3, 12.4**

- [x] 16. Final checkpoint — full test suite
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP delivery.
- All backend tests use `Http::fake()` to mock PayPal API — no real credentials required.
- `phone_number` on the `Payment` record is set to an empty string for PayPal payments (field is not applicable but required by current schema).
- The `PayPalPaymentSheet` must be integrated into the existing reservation checkout flow by the consuming page — that wiring is handled at the page level, not within this task list.
- Property tests use Pest's `->repeat()` with randomised `->with()` datasets (minimum 100 iterations per property).
- Keep `PAYPAL_CLIENT_SECRET` and any access token out of all log output — validated by Property 11.

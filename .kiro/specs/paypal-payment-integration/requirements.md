# Requirements Document

## Introduction

This feature adds PayPal as a second payment method on the Soko Mtaa platform, running
alongside the existing M-Pesa (Daraja STK Push) integration. The primary use case is
reservation payments by residents. Market fee payments by traders are a secondary scope
item that may follow in a later iteration.

PayPal is chosen for residents who have international payment access or prefer card-based
checkout over mobile-money. Given that Soko Mtaa's primary users are on cheap Android
phones in Kenya with M-Pesa as their dominant payment method, PayPal is positioned as an
alternative — not a replacement. The integration must reuse all existing payment
infrastructure (the `payments` table, `ApiResponse` trait, notification pipeline, and
wallet crediting logic) without disrupting the M-Pesa flow.

---

## Glossary

- **PayPal_Service**: The backend Laravel service class responsible for communicating with
  the PayPal REST API (Orders v2).
- **PayPal_Controller**: The Laravel controller handling PayPal-related HTTP endpoints
  (create order, capture order, webhook).
- **PayPal_Order**: A server-side PayPal Orders v2 resource with a lifecycle of
  `CREATED → APPROVED → COMPLETED`.
- **Capture**: The PayPal API action that finalises a payment after the buyer approves it
  in the PayPal popup or redirect. Funds move to the platform account at this point.
- **Webhook**: An HTTP POST sent by PayPal to the platform's callback URL when a
  payment event occurs (e.g. `PAYMENT.CAPTURE.COMPLETED`).
- **Payment_Gateway**: The abstraction layer (either M-Pesa or PayPal) through which a
  monetary transaction is processed.
- **Checkout_Session**: A transient frontend state holding the selected payment method,
  amount, and reservation IDs while the user completes payment.
- **PayPal_Payment_Sheet**: The frontend bottom-sheet component (mobile-first) presented
  to the user when PayPal is selected as payment method.
- **PAYMENT.CAPTURE.COMPLETED**: The PayPal webhook event name indicating a successful
  capture. The platform uses this as the authoritative payment confirmation signal.
- **PayPal_Transaction_ID**: The unique identifier returned by PayPal after a successful
  capture (`purchase_units[0].payments.captures[0].id`). Stored in the `payments` table.
- **Resident**: A Soko Mtaa user with role `resident` who creates reservations and pays
  for them.
- **Trader**: A Soko Mtaa user with role `trader` who receives reservation payments and
  pays market fees.
- **Reservation**: A pending or paid item reservation created by a resident for a
  trader's product.
- **Wallet**: The in-platform balance associated with a trader or resident, managed by
  `WalletService`.

---

## Requirements

---

### Requirement 1: PayPal SDK & Configuration

**User Story:** As a developer, I want the PayPal REST SDK configured in the backend,
so that the platform can securely communicate with the PayPal Orders v2 API.

#### Acceptance Criteria

1. THE PayPal_Service SHALL read `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and
   `PAYPAL_ENV` from environment variables, defaulting `PAYPAL_ENV` to `sandbox`.
2. WHEN `PAYPAL_ENV` is `sandbox`, THE PayPal_Service SHALL use the PayPal sandbox
   base URL `https://api-m.sandbox.paypal.com`.
3. WHEN `PAYPAL_ENV` is `production`, THE PayPal_Service SHALL use the PayPal
   production base URL `https://api-m.paypal.com`.
4. THE PayPal_Service SHALL cache the OAuth 2.0 access token for 30,000 seconds
   (50 minutes) to avoid redundant token generation requests.
5. IF the OAuth token request fails, THEN THE PayPal_Service SHALL throw a
   `PaymentFailedException` with a descriptive message and log the error to the
   `paypal` log channel.
6. THE System SHALL provide a `config/paypal.php` configuration file exposing
   `client_id`, `client_secret`, `env`, and `base_url` keys sourced from environment
   variables.

---

### Requirement 2: Create PayPal Order (Backend)

**User Story:** As a resident, I want the backend to create a PayPal order when I choose
PayPal at checkout, so that I can be redirected to PayPal's approval UI.

#### Acceptance Criteria

1. WHEN a `POST /api/payments/paypal/create-order` request is received with valid
   `reservation_ids` (array of integers) and `currency` (`USD` or `KES`), THE
   PayPal_Controller SHALL create a PayPal Orders v2 resource via THE PayPal_Service
   and return the PayPal `order_id` and `approve_url` in the standard `ApiResponse`
   format.
2. THE PayPal_Controller SHALL validate that each reservation in `reservation_ids`
   belongs to the authenticated resident and has status `pending`; IF any reservation
   fails this check, THEN THE PayPal_Controller SHALL return a `422` error response
   with code `VALIDATION_ERROR`.
3. THE PayPal_Service SHALL calculate the total amount as the sum of
   `total_amount` across all provided reservations, converted to the requested
   `currency`.
4. WHEN the currency is `KES`, THE PayPal_Service SHALL use a configurable
   `PAYPAL_KES_TO_USD_RATE` environment variable to convert the KES amount to USD,
   because PayPal does not natively support KES.
5. THE PayPal_Controller SHALL create a `pending` `Payment` record in the `payments`
   table with `type = reservation`, `status = pending`, and the PayPal order ID stored
   in a new `paypal_order_id` column before returning the response.
6. THE PayPal_Controller SHALL update all target `Reservation` records with the PayPal
   order ID so the webhook handler can resolve them later.
7. IF the PayPal API returns an error when creating the order, THEN THE
   PayPal_Controller SHALL return a `500` error response with code `PAYMENT_FAILED`.

---

### Requirement 3: Capture PayPal Payment (Backend)

**User Story:** As a resident, I want the backend to capture funds after I approve
the payment on PayPal, so that my reservation is confirmed.

#### Acceptance Criteria

1. WHEN a `POST /api/payments/paypal/capture-order` request is received with a valid
   `order_id`, THE PayPal_Controller SHALL call the PayPal Orders v2 capture endpoint
   via THE PayPal_Service.
2. WHEN the PayPal capture response has status `COMPLETED`, THE PayPal_Controller SHALL
   mark the matching `Payment` record as `completed`, set `paid_at` to the current
   timestamp, and store the `PayPal_Transaction_ID` in `paypal_transaction_id`.
3. WHEN a payment is captured successfully, THE PayPal_Controller SHALL update all
   linked `Reservation` records to status `paid`, credit the relevant trader wallets
   via `WalletService`, and dispatch in-app and SMS notifications via
   `NotificationService` — mirroring the exact post-payment logic used by
   `MpesaController`.
4. IF the capture call returns a status other than `COMPLETED`, THEN THE
   PayPal_Controller SHALL update the `Payment` record to `failed`, update linked
   reservations to `cancelled`, and return a `402` error response with code
   `PAYMENT_FAILED`.
5. THE PayPal_Controller SHALL be idempotent: IF the `Payment` record is already
   `completed` when a capture request arrives, THEN THE PayPal_Controller SHALL return
   a `200` success response without re-processing.

---

### Requirement 4: PayPal Webhook Handler

**User Story:** As a developer, I want a webhook endpoint that listens for PayPal
server-side events, so that payments are confirmed even if the user closes the browser
before the capture call returns.

#### Acceptance Criteria

1. THE PayPal_Controller SHALL expose a public (unauthenticated) endpoint at
   `POST /api/payments/paypal/webhook` to receive PayPal event notifications.
2. WHEN a `PAYMENT.CAPTURE.COMPLETED` event is received, THE PayPal_Controller SHALL
   locate the `Payment` record by `paypal_order_id` and, IF the record is `pending`,
   SHALL process it as a successful payment using the same logic as the capture
   endpoint.
3. THE PayPal_Controller SHALL verify the webhook signature using the
   `PAYPAL-TRANSMISSION-ID`, `PAYPAL-TRANSMISSION-TIME`, `PAYPAL-CERT-URL`, and
   `PAYPAL-AUTH-ALGO` headers provided by PayPal before processing any event.
4. IF webhook signature verification fails, THEN THE PayPal_Controller SHALL return
   a `400` response and log the failure to the `paypal` log channel without processing
   the event.
5. THE webhook handler SHALL be idempotent: processing the same
   `PAYMENT.CAPTURE.COMPLETED` event twice SHALL NOT credit the wallet or update
   reservation status a second time.
6. THE PayPal_Controller SHALL always return a `200` HTTP response to PayPal after
   logging, even when the associated `Payment` record is not found, to prevent PayPal
   from retrying indefinitely.

---

### Requirement 5: Payment Method Selection (Frontend)

**User Story:** As a resident, I want to choose between M-Pesa and PayPal at the
payment step, so that I can use whichever method works best for me.

#### Acceptance Criteria

1. THE Checkout_Session SHALL present a payment method selector with exactly two
   options: `M-Pesa` and `PayPal`, before displaying the payment-specific input form.
2. WHEN `M-Pesa` is selected, THE System SHALL display the existing
   `MpesaPaymentSheet` component without modification.
3. WHEN `PayPal` is selected, THE System SHALL display THE `PayPal_Payment_Sheet`
   component.
4. THE payment method selector SHALL follow Soko Mtaa mobile-first rules: minimum
   48×48px tap targets, visible labels, no hover-only states, and must work correctly
   on a 360px-wide viewport.
5. THE System SHALL persist the resident's last-used payment method choice in
   `localStorage` so it is pre-selected on the next visit.
6. WHERE the user's browser does not support `localStorage`, THE System SHALL default
   to M-Pesa as the pre-selected payment method.

---

### Requirement 6: PayPal Payment Sheet (Frontend)

**User Story:** As a resident, I want a clear, mobile-friendly PayPal payment flow,
so that I can complete payment without confusion on a small screen.

#### Acceptance Criteria

1. THE `PayPal_Payment_Sheet` SHALL display the total amount, a breakdown of items
   being paid for, and a prominent "Pay with PayPal" button before initiating the
   PayPal flow.
2. WHEN the resident taps "Pay with PayPal", THE `PayPal_Payment_Sheet` SHALL call
   `POST /api/payments/paypal/create-order`, open the PayPal approval URL in a new
   browser tab or popup, and display a skeleton loader while awaiting the return.
3. WHEN the PayPal approval tab is closed or the resident returns to the app, THE
   `PayPal_Payment_Sheet` SHALL call `POST /api/payments/paypal/capture-order` with
   the returned `order_id` and poll `GET /api/payments/paypal/status/{order_id}` every
   3 seconds until status is `completed` or `failed`.
4. WHEN the payment status is `completed`, THE `PayPal_Payment_Sheet` SHALL navigate
   the resident to the reservation detail page and display a success screen matching
   the existing M-Pesa success UX.
5. WHEN the payment status is `failed`, THE `PayPal_Payment_Sheet` SHALL display an
   inline error message in the resident's preferred language (Swahili or English) with
   a "Try Again" button.
6. THE polling process SHALL stop after 5 minutes and display the message
   "Angalia barua pepe yako ya PayPal / Check your PayPal email for confirmation" if
   no terminal status is reached.
7. IF the `create-order` API call fails, THEN THE `PayPal_Payment_Sheet` SHALL display
   an error message without navigating away, allowing the resident to retry or switch
   to M-Pesa.

---

### Requirement 7: Payment Status Polling (Backend)

**User Story:** As a developer, I want a status-check endpoint for PayPal payments,
so that the frontend can poll for the final payment state without relying solely on
the webhook.

#### Acceptance Criteria

1. THE PayPal_Controller SHALL expose `GET /api/payments/paypal/status/{order_id}` as
   an authenticated endpoint.
2. WHEN the endpoint is called, THE PayPal_Controller SHALL return the `status`,
   `paypal_transaction_id`, `amount`, and `paid_at` fields from the matching `Payment`
   record in the standard `ApiResponse` format.
3. IF no `Payment` record exists for the given `order_id` owned by the authenticated
   user, THEN THE PayPal_Controller SHALL return a `404` response with code
   `NOT_FOUND`.

---

### Requirement 8: Database Schema Extension

**User Story:** As a developer, I want the `payments` table extended to support PayPal
transactions, so that both payment methods share the same data model.

#### Acceptance Criteria

1. THE System SHALL add a nullable `paypal_order_id` string column (unique, nullable)
   to the `payments` table via a new migration.
2. THE System SHALL add a nullable `paypal_transaction_id` string column (unique,
   nullable) to the `payments` table via the same migration.
3. THE System SHALL add `paypal` as a new value in the `payment_method` enum column on
   the `payments` table (or add a new `payment_method` string column if no enum
   currently exists), defaulting to `mpesa` for backward compatibility.
4. WHEN a PayPal payment is created, THE System SHALL store `payment_method = paypal`
   on the `Payment` record.
5. THE migration SHALL be non-destructive: all existing `Payment` records SHALL retain
   their data and default `payment_method` value of `mpesa`.

---

### Requirement 9: Currency Conversion

**User Story:** As a developer, I want reliable KES-to-USD conversion for PayPal
orders, so that residents pay the correct amount.

#### Acceptance Criteria

1. THE PayPal_Service SHALL expose a `convertKesToUsd(float $kesAmount): float`
   method that applies the configured `PAYPAL_KES_TO_USD_RATE` exchange rate.
2. THE converted USD amount SHALL be rounded to 2 decimal places.
3. THE PayPal_Payment_Sheet SHALL display to the resident both the KES amount and the
   equivalent USD amount before the resident confirms payment, to avoid surprise.
4. IF `PAYPAL_KES_TO_USD_RATE` is not configured, THEN THE PayPal_Service SHALL throw
   a `PaymentFailedException` with message `"PayPal exchange rate is not configured"`.
5. THE System SHALL display a disclaimer on the PayPal payment sheet:
   "Kiwango cha ubadilishaji kinatumika / Exchange rate applies. Final amount charged
   by PayPal may vary slightly."

---

### Requirement 10: Logging & Observability

**User Story:** As a developer, I want all PayPal API interactions logged to a
dedicated channel, so that I can debug payment failures without sifting through
general application logs.

#### Acceptance Criteria

1. THE System SHALL define a `paypal` log channel in `config/logging.php` using the
   `daily` driver with a 30-day retention period, writing to
   `storage/logs/paypal.log`.
2. THE PayPal_Service SHALL log every outbound API request and the corresponding
   response status code at `INFO` level to the `paypal` channel.
3. THE PayPal_Service SHALL log every error response from the PayPal API at `ERROR`
   level to the `paypal` channel, including the full response body.
4. THE PayPal_Controller webhook handler SHALL log every received webhook event,
   including the event type and resource ID, at `INFO` level to the `paypal` channel.
5. THE System SHALL NEVER log `PAYPAL_CLIENT_SECRET` or access tokens to any log
   channel.

---

### Requirement 11: PayPal Notification Templates

**User Story:** As a resident, I want to receive in-app notifications confirming or
reporting failure of my PayPal payment, so that I have a clear record of what happened.

#### Acceptance Criteria

1. WHEN a PayPal payment is completed, THE NotificationService SHALL send the resident
   an in-app notification with title "✅ Malipo ya PayPal Yamefanikiwa /
   PayPal Payment Confirmed" and body referencing the reservation code and KES amount.
2. WHEN a PayPal payment fails, THE NotificationService SHALL send the resident an
   in-app notification with title "❌ Malipo ya PayPal Hayakufanikiwa /
   PayPal Payment Failed" and a prompt to try again.
3. WHEN a PayPal payment is completed, THE NotificationService SHALL send the relevant
   trader an in-app notification equivalent to the existing M-Pesa new-order
   notification (template T07), identifying the payment source as PayPal.
4. THE System SHALL NOT send SMS notifications for PayPal payment events, because
   PayPal is targeted at users with internet access who can view in-app notifications.

---

### Requirement 12: Security & Compliance

**User Story:** As a platform operator, I want the PayPal integration to follow
security best practices, so that payment data is protected and the integration cannot
be exploited.

#### Acceptance Criteria

1. THE System SHALL store `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` exclusively as
   environment variables and SHALL NOT hardcode these values anywhere in source code.
2. THE PayPal webhook endpoint SHALL reject any request that does not pass PayPal's
   signature verification algorithm (per Requirement 4.3), returning `400` without
   processing.
3. THE `POST /api/payments/paypal/create-order` and
   `POST /api/payments/paypal/capture-order` endpoints SHALL require a valid Sanctum
   auth token and SHALL enforce the `resident` or `admin` role only.
4. THE PayPal_Controller SHALL validate that the `order_id` in a capture request
   matches a `Payment` record owned by the authenticated user before processing the
   capture.
5. THE System SHALL apply the existing `throttle` middleware to all PayPal payment
   endpoints to prevent brute-force and abuse.
6. THE System SHALL never expose `paypal_order_id` or `paypal_transaction_id` in error
   responses or in API responses to roles other than the owning resident and admin.

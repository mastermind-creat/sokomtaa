<?php

namespace Tests\Feature\Payment;

use App\Models\Category;
use App\Models\Market;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\Stall;
use App\Models\Trader;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Regression cover for the M-Pesa callback.
 *
 * The callback endpoint is public and Safaricom does not sign payloads, so the
 * caller controls which CheckoutRequestID gets settled. These tests pin down the
 * three properties that keep that safe: single settlement, no forged reversals,
 * and source verification.
 */
class MpesaCallbackTest extends TestCase
{
    use RefreshDatabase;

    private const CHECKOUT_ID = 'ws_CO_01102026120000000001';
    private const RECEIPT     = 'QGR7X7X7X7';
    private const UNIT_PRICE  = 100.00;

    private User $resident;
    private User $traderUser;
    private Trader $trader;
    private Reservation $reservation;
    private Payment $payment;

    protected function setUp(): void
    {
        parent::setUp();

        // No outbound calls: the settlement path fans out to SMS and web push.
        Http::fake();

        $this->resident = User::create([
            'name'           => 'John Resident',
            'phone'          => '+254711111111',
            'email'          => 'john@sokomtaa.co.ke',
            'password'       => Hash::make('Secret123!'),
            'role'           => 'resident',
            'phone_verified' => true,
        ]);

        $market = Market::create([
            'name'     => 'Toi Market',
            'location' => 'Kibera, Nairobi',
            'county'   => 'Nairobi',
            'estate'   => 'Kibera',
        ]);

        $this->traderUser = User::create([
            'name'           => 'Mary Trader',
            'phone'          => '+254722222222',
            'email'          => 'mary@sokomtaa.co.ke',
            'password'       => Hash::make('Secret123!'),
            'role'           => 'trader',
            'phone_verified' => true,
        ]);

        $stall = Stall::create([
            'market_id'    => $market->id,
            'stall_number' => 'A1',
            'block'        => 'A',
            'zone'         => 'A',
            'status'       => 'occupied',
        ]);

        $this->trader = Trader::create([
            'user_id'             => $this->traderUser->id,
            'market_id'           => $market->id,
            'stall_id'            => $stall->id,
            'business_name'       => 'Mary Organic Greens',
            'verification_status' => 'verified',
            'is_open'             => true,
        ]);

        $category = Category::create(['name' => 'Vegetables', 'name_sw' => 'Mboga']);

        $product = Product::create([
            'trader_id'   => $this->trader->id,
            'category_id' => $category->id,
            'name'        => 'Fresh Sukuma Wiki',
            'price'       => self::UNIT_PRICE,
        ]);

        $this->reservation = Reservation::create([
            'reservation_code' => 'SM-TEST0001',
            'resident_id'      => $this->resident->id,
            'trader_id'        => $this->trader->id,
            'product_id'       => $product->id,
            'quantity'         => 1,
            'unit_price'       => self::UNIT_PRICE,
            'total_amount'     => self::UNIT_PRICE,
            'status'           => 'pending',
        ]);

        // Not mass-assignable, so set it the same way the controller does.
        Reservation::whereKey($this->reservation->id)
            ->update(['mpesa_checkout_request_id' => self::CHECKOUT_ID]);

        $this->payment = Payment::create([
            'reservation_id'            => $this->reservation->id,
            'user_id'                   => $this->resident->id,
            'mpesa_checkout_request_id' => self::CHECKOUT_ID,
            'amount'                    => self::UNIT_PRICE,
            'wallet_deduction'          => 0,
            'platform_commission'       => 0,
            'routing'                   => 'platform',
            'phone_number'              => '+254711111111',
            'type'                      => 'reservation',
            'status'                    => 'pending',
        ]);
    }

    /** A well-formed "payment successful" callback body. */
    private function successfulPayload(string $receipt = self::RECEIPT): array
    {
        return [
            'Body' => [
                'stkCallback' => [
                    'MerchantRequestID' => '29115-34620561-1',
                    'CheckoutRequestID' => self::CHECKOUT_ID,
                    'ResultCode'        => 0,
                    'ResultDesc'        => 'The service request is processed successfully.',
                    'CallbackMetadata'  => [
                        'Item' => [
                            ['Name' => 'Amount',             'Value' => self::UNIT_PRICE],
                            ['Name' => 'MpesaReceiptNumber', 'Value' => $receipt],
                            ['Name' => 'TransactionDate',    'Value' => 20261030120000],
                            ['Name' => 'PhoneNumber',        'Value' => 254711111111],
                        ],
                    ],
                ],
            ],
        ];
    }

    private function traderWalletBalance(): float
    {
        $wallet = Wallet::where('user_id', $this->traderUser->id)->first();

        return $wallet ? (float) $wallet->balance : 0.0;
    }

    public function test_successful_callback_settles_the_reservation_and_credits_the_trader(): void
    {
        $this->postJson('/api/payments/mpesa/callback', $this->successfulPayload())
            ->assertStatus(200);

        $this->assertSame('completed', $this->payment->fresh()->status);
        $this->assertSame(self::RECEIPT, $this->payment->fresh()->mpesa_transaction_id);
        $this->assertSame('paid', $this->reservation->fresh()->status);
        $this->assertSame(self::UNIT_PRICE, $this->traderWalletBalance());
    }

    /**
     * The original defect: a replayed callback credited the trader a second time.
     */
    public function test_replayed_callback_does_not_double_credit_the_trader(): void
    {
        $this->postJson('/api/payments/mpesa/callback', $this->successfulPayload())
            ->assertStatus(200);

        $this->assertSame(self::UNIT_PRICE, $this->traderWalletBalance());

        // Safaricom retries whenever it does not see a 200 — replay the exact body.
        $this->postJson('/api/payments/mpesa/callback', $this->successfulPayload())
            ->assertStatus(200);

        $this->assertSame(
            self::UNIT_PRICE,
            $this->traderWalletBalance(),
            'A replayed callback must not credit the trader twice.'
        );
    }

    /**
     * A second callback carrying a different receipt must also be ignored.
     */
    public function test_callback_with_a_different_receipt_is_ignored_once_settled(): void
    {
        $this->postJson('/api/payments/mpesa/callback', $this->successfulPayload())
            ->assertStatus(200);

        $this->postJson(
            '/api/payments/mpesa/callback',
            $this->successfulPayload('QGRFORGED001')
        )->assertStatus(200);

        $this->assertSame(self::RECEIPT, $this->payment->fresh()->mpesa_transaction_id);
        $this->assertSame(self::UNIT_PRICE, $this->traderWalletBalance());
    }

    /**
     * A forged "failed" callback must not cancel a reservation that was paid.
     */
    public function test_forged_failure_callback_cannot_cancel_a_completed_reservation(): void
    {
        $this->postJson('/api/payments/mpesa/callback', $this->successfulPayload())
            ->assertStatus(200);

        $payload = $this->successfulPayload();
        $payload['Body']['stkCallback']['ResultCode'] = 1032;
        $payload['Body']['stkCallback']['ResultDesc'] = 'Request cancelled by user';
        unset($payload['Body']['stkCallback']['CallbackMetadata']);

        $this->postJson('/api/payments/mpesa/callback', $payload)->assertStatus(200);

        $this->assertSame('completed', $this->payment->fresh()->status);
        $this->assertSame('paid', $this->reservation->fresh()->status);
    }

    public function test_trader_is_not_credited_when_payment_never_succeeded(): void
    {
        $payload = $this->successfulPayload();
        $payload['Body']['stkCallback']['ResultCode'] = 1032;
        unset($payload['Body']['stkCallback']['CallbackMetadata']);

        $this->postJson('/api/payments/mpesa/callback', $payload)->assertStatus(200);

        $this->assertSame('failed', $this->payment->fresh()->status);
        $this->assertSame('cancelled', $this->reservation->fresh()->status);
        $this->assertSame(0.0, $this->traderWalletBalance());
    }

    public function test_malformed_payload_is_acknowledged_without_side_effects(): void
    {
        $this->postJson('/api/payments/mpesa/callback', ['Body' => ['stkCallback' => []]])
            ->assertStatus(200);

        $this->assertSame('pending', $this->payment->fresh()->status);
        $this->assertSame(0.0, $this->traderWalletBalance());
    }

    public function test_unknown_checkout_id_is_acknowledged(): void
    {
        $payload = $this->successfulPayload();
        $payload['Body']['stkCallback']['CheckoutRequestID'] = 'ws_CO_UNKNOWN';

        $this->postJson('/api/payments/mpesa/callback', $payload)->assertStatus(200);

        $this->assertSame('pending', $this->payment->fresh()->status);
    }

    public function test_callback_is_rejected_without_token_when_secret_is_configured(): void
    {
        config(['mpesa.callback_secret' => 'super-secret-token']);

        $this->postJson('/api/payments/mpesa/callback', $this->successfulPayload())
            ->assertStatus(403);

        $this->assertSame('pending', $this->payment->fresh()->status);
        $this->assertSame(0.0, $this->traderWalletBalance());
    }

    public function test_callback_with_wrong_token_is_rejected(): void
    {
        config(['mpesa.callback_secret' => 'super-secret-token']);

        $this->postJson(
            '/api/payments/mpesa/callback?token=wrong',
            $this->successfulPayload()
        )->assertStatus(403);

        $this->assertSame('pending', $this->payment->fresh()->status);
    }

    public function test_callback_is_accepted_with_the_correct_token(): void
    {
        config(['mpesa.callback_secret' => 'super-secret-token']);

        $this->postJson(
            '/api/payments/mpesa/callback?token=super-secret-token',
            $this->successfulPayload()
        )->assertStatus(200);

        $this->assertSame('completed', $this->payment->fresh()->status);
        $this->assertSame(self::UNIT_PRICE, $this->traderWalletBalance());
    }

    public function test_callback_is_rejected_from_an_ip_outside_the_allowlist(): void
    {
        config(['mpesa.callback_allowed_ips' => ['196.201.214.200']]);

        // The test client reports 127.0.0.1, which is not on the allowlist.
        $this->postJson('/api/payments/mpesa/callback', $this->successfulPayload())
            ->assertStatus(403);

        $this->assertSame('pending', $this->payment->fresh()->status);
    }
}

<?php

namespace Tests\Feature\Payment;

use App\Models\Category;
use App\Models\Market;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\Trader;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Regression cover for STK initiation.
 *
 * The AI assistant calls this endpoint after the user supplies their M-Pesa
 * number, and it used to dereference the first matched reservation without
 * checking that any matched at all. A stale or invented id therefore produced a
 * 500 carrying a raw PHP error, which surfaced to the user as a generic
 * "technical difficulties" message instead of an actionable one.
 */
class StkPushTest extends TestCase
{
    use RefreshDatabase;

    private User $resident;
    private User $otherResident;
    private Reservation $reservation;
    private Reservation $otherReservation;

    protected function setUp(): void
    {
        parent::setUp();

        $this->resident = User::create([
            'name'           => 'Wambia Otieno',
            'phone'          => '+254743394373',
            'email'          => 'wambia@sokomtaa.co.ke',
            'password'       => Hash::make('Secret123!'),
            'role'           => 'resident',
            'phone_verified' => true,
        ]);

        $this->otherResident = User::create([
            'name'           => 'Other Resident',
            'phone'          => '+254799999999',
            'email'          => 'other@sokomtaa.co.ke',
            'password'       => Hash::make('Secret123!'),
            'role'           => 'resident',
            'phone_verified' => true,
        ]);

        $market = Market::create([
            'name'     => 'Gikomba Market',
            'location' => 'Gikomba, Nairobi',
            'county'   => 'Nairobi',
            'estate'   => 'Gikomba',
        ]);

        $traderUser = User::create([
            'name'           => 'Peter Mwangi',
            'phone'          => '+254733333333',
            'email'          => 'peter@sokomtaa.co.ke',
            'password'       => Hash::make('Secret123!'),
            'role'           => 'trader',
            'phone_verified' => true,
        ]);

        $trader = Trader::create([
            'user_id'             => $traderUser->id,
            'market_id'           => $market->id,
            'business_name'       => 'Tech Safi Store',
            'verification_status' => 'verified',
            'is_open'             => true,
        ]);

        $category = Category::create(['name' => 'Vegetables', 'name_sw' => 'Mboga']);

        $product = Product::create([
            'trader_id'   => $trader->id,
            'category_id' => $category->id,
            'name'        => 'Sukuma Wiki',
            'price'       => 20.00,
        ]);

        $this->reservation = Reservation::create([
            'reservation_code' => 'SM-PENDING1',
            'resident_id'      => $this->resident->id,
            'trader_id'        => $trader->id,
            'product_id'       => $product->id,
            'quantity'         => 1,
            'unit_price'       => 20.00,
            'total_amount'     => 20.00,
            'status'           => 'pending',
        ]);

        $this->otherReservation = Reservation::create([
            'reservation_code' => 'SM-OTHERR1',
            'resident_id'      => $this->otherResident->id,
            'trader_id'        => $trader->id,
            'product_id'       => $product->id,
            'quantity'         => 1,
            'unit_price'       => 20.00,
            'total_amount'     => 20.00,
            'status'           => 'pending',
        ]);
    }

    private function push(array $targetIds)
    {
        return $this->actingAs($this->resident)->postJson('/api/payments/mpesa/stkpush', [
            'phone_number' => '0743394373',
            'type'         => 'reservation',
            'target_ids'   => $targetIds,
        ]);
    }

    public function test_unknown_reservation_is_rejected_instead_of_erroring(): void
    {
        $response = $this->push([99999]);

        $response->assertStatus(422);
        $response->assertJsonPath('code', 'RESERVATION_NOT_FOUND');
        $this->assertStringNotContainsString('reservation_code', $response->json('message'));
    }

    public function test_a_resident_cannot_pay_for_another_residents_reservation(): void
    {
        $response = $this->push([$this->otherReservation->id]);

        $response->assertStatus(422);
        $response->assertJsonPath('code', 'RESERVATION_NOT_FOUND');
    }

    public function test_an_already_paid_reservation_is_rejected(): void
    {
        Reservation::whereKey($this->reservation->id)->update(['status' => 'paid']);

        $response = $this->push([$this->reservation->id]);

        $response->assertStatus(422);
        $response->assertJsonPath('code', 'INVALID_STATUS');
    }

    public function test_a_mixed_batch_containing_an_unknown_id_is_rejected(): void
    {
        $response = $this->push([$this->reservation->id, 99999]);

        $response->assertStatus(422);
        $response->assertJsonPath('code', 'RESERVATION_NOT_FOUND');
        $this->assertSame(0, Payment::count());
    }

    public function test_a_valid_reservation_initiates_the_stk_push(): void
    {
        Http::fake([
            '*/oauth/v1/generate*'                => Http::response(['access_token' => 'fake-token']),
            '*/mpesa/stkpush/v1/processrequest'   => Http::response([
                'ResponseCode'      => '0',
                'CheckoutRequestID' => 'ws_CO_31102026000000000001',
                'CustomerMessage'   => 'Success. Request accepted for processing',
            ]),
        ]);

        $response = $this->push([$this->reservation->id]);

        $response->assertOk();
        $response->assertJsonPath('data.checkout_request_id', 'ws_CO_31102026000000000001');

        $this->assertDatabaseHas('payments', [
            'reservation_id'            => $this->reservation->id,
            'mpesa_checkout_request_id' => 'ws_CO_31102026000000000001',
            'status'                    => 'pending',
        ]);
    }
}

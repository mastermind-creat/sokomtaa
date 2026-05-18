<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Trader;
use App\Models\Market;
use App\Models\Product;
use App\Models\Category;
use App\Models\Reservation;
use App\Models\DeliveryProfile;
use App\Models\DeliveryTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DeliveryTest extends TestCase
{
    use RefreshDatabase;

    protected $resident;
    protected $traderUser;
    protected $trader;
    protected $riderUser;
    protected $market;
    protected $category;
    protected $product;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create Resident User
        $this->resident = User::create([
            'name' => 'John Resident',
            'phone' => '+254711111111',
            'email' => 'john@sokomtaa.co.ke',
            'password' => Hash::make('Secret123!'),
            'role' => 'resident',
            'phone_verified' => true,
        ]);

        // 2. Create Market & Trader
        $this->market = Market::create([
            'name' => 'Toi Market',
            'location' => 'Kibera, Nairobi',
            'county' => 'Nairobi',
            'estate' => 'Kibera',
            'latitude' => -1.3060, // Toi Market coordinates
            'longitude' => 36.7865,
        ]);

        $this->traderUser = User::create([
            'name' => 'Mary Trader',
            'phone' => '+254722222222',
            'email' => 'mary@sokomtaa.co.ke',
            'password' => Hash::make('Secret123!'),
            'role' => 'trader',
            'phone_verified' => true,
        ]);

        $this->trader = Trader::create([
            'user_id' => $this->traderUser->id,
            'market_id' => $this->market->id,
            'business_name' => 'Mary Organic Greens',
            'verification_status' => 'verified',
            'is_open' => true,
        ]);

        // 3. Create Product Category & Product
        $this->category = Category::create([
            'name' => 'Vegetables',
            'name_sw' => 'Mboga',
        ]);

        $this->product = Product::create([
            'trader_id' => $this->trader->id,
            'category_id' => $this->category->id,
            'name' => 'Fresh Sukuma Wiki',
            'price' => 50.00,
            'unit' => 'bunch',
            'stock_status' => 'available',
            'stock_quantity' => 100,
        ]);

        // 4. Create Rider User
        $this->riderUser = User::create([
            'name' => 'Kevo Rider',
            'phone' => '+254733333333',
            'email' => 'kevo@sokomtaa.co.ke',
            'password' => Hash::make('Secret123!'),
            'role' => 'delivery',
            'phone_verified' => true,
        ]);

        $this->riderUser->riderProfile()->create([
            'vehicle_type' => 'motorcycle',
            'vehicle_registration' => 'KMCD 123A',
            'verification_status' => 'verified',
            'is_available' => true,
            'earnings_balance' => 0.00,
            'latitude' => -1.3000, // Near Toi Market
            'longitude' => 36.7900,
        ]);
    }

    /**
     * Test Rider Registration provisions profile.
     */
    public function test_rider_registration_provisions_profile()
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Juma Delivery',
            'phone' => '0744444444',
            'email' => 'juma@sokomtaa.co.ke',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
            'role' => 'delivery',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', [
            'email' => 'juma@sokomtaa.co.ke',
            'role' => 'delivery'
        ]);
        $this->assertDatabaseHas('delivery_profiles', [
            'vehicle_type' => 'motorcycle'
        ]);
    }

    /**
     * Test Resident Checkout calculates dynamic shipping fee.
     */
    public function test_resident_checkout_calculates_delivery_fee()
    {
        // Yaya Centre is approx 2.0 km from Toi Market
        $yayaLat = -1.2982;
        $yayaLng = 36.7907;

        $response = $this->actingAs($this->resident)
            ->postJson('/api/reservations', [
                'product_id' => $this->product->id,
                'quantity' => 2,
                'delivery_option' => true,
                'delivery_address' => 'Yaya Centre Mall, Apartment 3B',
                'delivery_latitude' => $yayaLat,
                'delivery_longitude' => $yayaLng,
            ]);

        $response->assertStatus(201);
        
        $reservation = Reservation::first();
        $this->assertTrue($reservation->delivery_option);
        $this->assertEquals('pending_assignment', $reservation->delivery_status);
        // Base fare is 100 KES (covers up to 3 km)
        $this->assertEquals(100.00, $reservation->delivery_fee);
        // total_amount = subtotal (100) + shipping (100) = 200
        $this->assertEquals(200.00, $reservation->total_amount);
    }

    /**
     * Test Rider radius order pool and acceptance lifecycle.
     */
    public function test_rider_order_pool_and_acceptance_lifecycle()
    {
        // Create an active delivery reservation
        $reservation = Reservation::create([
            'reservation_code' => 'SM-DELIVR',
            'resident_id' => $this->resident->id,
            'trader_id' => $this->trader->id,
            'product_id' => $this->product->id,
            'quantity' => 2,
            'unit_price' => 50.00,
            'delivery_option' => true,
            'delivery_status' => 'pending_assignment',
            'delivery_fee' => 100.00,
            'delivery_address' => 'Yaya Centre',
            'delivery_latitude' => -1.2982,
            'delivery_longitude' => 36.7907,
            'total_amount' => 200.00,
            'status' => 'paid',
        ]);

        // 1. Query Order Pool
        $response = $this->actingAs($this->riderUser)
            ->getJson('/api/delivery/orders?lat=-1.3000&lng=36.7900');

        $response->assertStatus(200);
        $response->assertJsonFragment(['reservation_code' => 'SM-DELIVR']);

        // 2. Accept Order
        $acceptResponse = $this->actingAs($this->riderUser)
            ->postJson("/api/delivery/orders/{$reservation->id}/accept");

        $acceptResponse->assertStatus(200);
        $this->assertDatabaseHas('reservations', [
            'id' => $reservation->id,
            'delivery_rider_id' => $this->riderUser->id,
            'delivery_status' => 'assigned'
        ]);

        // 3. Mark Picked Up
        $pickupResponse = $this->actingAs($this->riderUser)
            ->postJson("/api/delivery/orders/{$reservation->id}/pickup");

        $pickupResponse->assertStatus(200);
        $this->assertDatabaseHas('reservations', [
            'id' => $reservation->id,
            'delivery_status' => 'picked_up'
        ]);

        // 4. Complete Delivery (entering customer reservation code)
        $completeResponse = $this->actingAs($this->riderUser)
            ->postJson("/api/delivery/orders/{$reservation->id}/complete", [
                'pickup_code' => 'SM-DELIVR'
            ]);

        $completeResponse->assertStatus(200);
        $this->assertDatabaseHas('reservations', [
            'id' => $reservation->id,
            'delivery_status' => 'delivered',
            'status' => 'completed'
        ]);

        // 5. Verify 50/50 payout split transactions generated
        $this->assertDatabaseHas('delivery_transactions', [
            'user_id' => $this->riderUser->id,
            'reservation_id' => $reservation->id,
            'amount' => 50.00, // 50% of 100 KES
            'type' => 'credit'
        ]);

        $this->assertDatabaseHas('delivery_profiles', [
            'user_id' => $this->riderUser->id,
            'earnings_balance' => 50.00
        ]);
    }
}

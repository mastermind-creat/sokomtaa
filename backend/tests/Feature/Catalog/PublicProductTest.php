<?php

namespace Tests\Feature\Catalog;

use App\Models\Category;
use App\Models\Market;
use App\Models\Product;
use App\Models\Trader;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Public product detail used by the Soko AI when it adds an item to a
 * resident's cart. The trader route of the same name is owner-scoped, so
 * without this endpoint a resident (and therefore the AI acting for them)
 * cannot resolve a product id to the payload the cart needs.
 */
class PublicProductTest extends TestCase
{
    use RefreshDatabase;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

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

        $this->product = Product::create([
            'trader_id'   => $trader->id,
            'category_id' => $category->id,
            'name'        => 'Sukuma Wiki',
            'price'       => 20.00,
        ]);
    }

    public function test_a_guest_can_read_an_active_product_with_its_trader(): void
    {
        $response = $this->getJson("/api/products/{$this->product->id}/public");

        $response->assertOk();
        $response->assertJsonPath('data.id', $this->product->id);
        $response->assertJsonPath('data.name', 'Sukuma Wiki');
        $response->assertJsonPath('data.trader.business_name', 'Tech Safi Store');
        // The cart totals from active_price, so it must survive the round trip.
        $response->assertJsonPath('data.active_price', '20.00');
    }

    public function test_a_delisted_product_is_not_readable(): void
    {
        $this->product->update(['is_active' => false]);

        $response = $this->getJson("/api/products/{$this->product->id}/public");

        $response->assertStatus(404);
        $response->assertJsonPath('code', 'PRODUCT_NOT_FOUND');
    }
}

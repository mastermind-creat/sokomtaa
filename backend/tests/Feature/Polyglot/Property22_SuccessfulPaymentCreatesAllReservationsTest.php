<?php

// Feature: polyglot-architecture-upgrade, Property 22: Successful Payment Creates All Reservations as Paid
// Validates: Requirements 9.5, 9.7
//
// For any multi-merchant checkout with N traders, when STK Push succeeds, exactly N reservations
// with status = 'paid' must exist after the transaction.

namespace Tests\Feature\Polyglot;

use App\Exceptions\PaymentFailedException;
use App\Models\Market;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\Stall;
use App\Models\Trader;
use App\Models\User;
use App\Services\DeliveryFeeCalculator;
use App\Services\MpesaService;
use App\Services\MultiCheckoutService;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature: polyglot-architecture-upgrade, Property 22: Successful Payment Creates All Reservations as Paid
 * Validates: Requirements 9.5, 9.7
 */
class Property22_SuccessfulPaymentCreatesAllReservationsTest extends TestCase
{
    use RefreshDatabase;

    private function buildService(bool $mpesaSucceeds): MultiCheckoutService
    {
        $mpesa = $this->createMock(MpesaService::class);
        $mpesa->method('stkPush')->willReturn(
            $mpesaSucceeds
                ? ['ResponseCode' => '0', 'ResponseDescription' => 'Success']
                : ['ResponseCode' => '1', 'ResponseDescription' => 'Failed']
        );

        $notification = $this->createMock(NotificationService::class);
        $notification->method('send')->willReturn(null);

        return new MultiCheckoutService($mpesa, $notification, new DeliveryFeeCalculator);
    }

    private function buildCheckoutScenario(int $traderCount): array
    {
        $market = Market::create([
            'name'      => 'Property22 Market',
            'location'  => 'Kisumu',
            'county'    => 'Kisumu',
            'estate'    => 'Kolenyo',
            'is_active' => true,
        ]);

        $resident = User::factory()->create(['role' => 'resident']);
        $items    = [];

        for ($i = 0; $i < $traderCount; $i++) {
            $traderUser = User::factory()->create(['role' => 'trader']);
            $stall      = Stall::create([
                'market_id'    => $market->id,
                'stall_number' => 'T'.$i,
                'zone'         => 'A',
                'status'       => 'occupied',
                'monthly_fee'  => 1000,
            ]);
            $trader = Trader::create([
                'user_id'             => $traderUser->id,
                'stall_id'            => $stall->id,
                'market_id'           => $market->id,
                'business_name'       => 'Trader '.$i,
                'verification_status' => 'verified',
                'is_open'             => true,
            ]);
            $product = Product::create([
                'trader_id'    => $trader->id,
                'category_id'  => 1,
                'name'         => 'Product '.$i,
                'price'        => 100 + $i * 10,
                'unit'         => 'kg',
                'stock_status' => 'available',
                'is_active'    => true,
            ]);

            $items[] = [
                'trader_id'    => $trader->id,
                'product_id'   => $product->id,
                'product_name' => $product->name,
                'quantity'     => 1,
                'unit_price'   => $product->price,
            ];
        }

        return [$resident, $items];
    }

    /**
     * @dataProvider traderCountProvider
     */
    public function test_successful_stk_push_creates_exactly_n_paid_reservations(int $traderCount): void
    {
        [$resident, $items] = $this->buildCheckoutScenario($traderCount);

        $service = $this->buildService(mpesaSucceeds: true);
        $payload = $service->assemblePayload($resident, $items, 'pickup', []);

        // Ensure no reservations exist before checkout
        $this->assertEquals(0, Reservation::count(), 'Precondition: no reservations before checkout');

        $result = $service->checkout($payload, $resident);

        $this->assertEquals($traderCount, $result['reservation_count'],
            "Expected {$traderCount} reservations, got {$result['reservation_count']}");

        $this->assertEquals($traderCount, Reservation::count(),
            "Expected exactly {$traderCount} reservation records in DB");

        // Every reservation must have status = 'paid'
        $paidCount = Reservation::where('status', 'paid')->count();
        $this->assertEquals($traderCount, $paidCount,
            "Expected all {$traderCount} reservations to be paid, got {$paidCount}");

        // Reservation codes must match
        $this->assertCount($traderCount, $result['reservation_codes'],
            "Result must contain exactly {$traderCount} reservation codes");
    }

    /**
     * @return array<int, array{int}>
     */
    public static function traderCountProvider(): array
    {
        $cases = [];
        // Run 40 randomized cases covering 1..10 traders
        for ($i = 0; $i < 40; $i++) {
            $cases["traders={$i}_run{$i}"] = [rand(1, 10)];
        }
        return $cases;
    }
}

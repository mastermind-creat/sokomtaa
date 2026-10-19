<?php

// Feature: polyglot-architecture-upgrade, Property 23: Failed Payment Creates No Reservations
// Validates: Requirements 9.6, 9.7
//
// For any multi-merchant checkout where STK Push fails, zero reservation records should be
// created; database state must be identical before and after (full rollback).

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
 * Feature: polyglot-architecture-upgrade, Property 23: Failed Payment Creates No Reservations
 * Validates: Requirements 9.6, 9.7
 */
class Property23_FailedPaymentCreatesNoReservationsTest extends TestCase
{
    use RefreshDatabase;

    private function buildService(string $responseCode = '1'): MultiCheckoutService
    {
        $mpesa = $this->createMock(MpesaService::class);
        $mpesa->method('stkPush')->willReturn([
            'ResponseCode'        => $responseCode,
            'ResponseDescription' => 'Insufficient funds',
        ]);

        $notification = $this->createMock(NotificationService::class);
        $notification->method('send')->willReturn(null);

        return new MultiCheckoutService($mpesa, $notification, new DeliveryFeeCalculator);
    }

    private function buildCheckoutScenario(int $traderCount): array
    {
        $market = Market::create([
            'name'      => 'Property23 Market',
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
                'stall_number' => 'F'.$i,
                'zone'         => 'B',
                'status'       => 'occupied',
                'monthly_fee'  => 1000,
            ]);
            $trader = Trader::create([
                'user_id'             => $traderUser->id,
                'stall_id'            => $stall->id,
                'market_id'           => $market->id,
                'business_name'       => 'Fail Trader '.$i,
                'verification_status' => 'verified',
                'is_open'             => true,
            ]);
            $product = Product::create([
                'trader_id'    => $trader->id,
                'category_id'  => 1,
                'name'         => 'Fail Product '.$i,
                'price'        => 50 + $i * 5,
                'unit'         => 'piece',
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
     * @dataProvider failedPaymentProvider
     */
    public function test_failed_stk_push_creates_zero_reservations(int $traderCount, string $responseCode): void
    {
        [$resident, $items] = $this->buildCheckoutScenario($traderCount);

        $service          = $this->buildService($responseCode);
        $payload          = $service->assemblePayload($resident, $items, 'pickup', []);
        $reservationsBefore = Reservation::count();

        // STK push will fail — expect PaymentFailedException (DB rolled back)
        $threw = false;
        try {
            $service->checkout($payload, $resident);
        } catch (PaymentFailedException $e) {
            $threw = true;
        }

        $this->assertTrue($threw, 'PaymentFailedException must be thrown when STK Push fails');

        $reservationsAfter = Reservation::count();
        $this->assertEquals(
            $reservationsBefore,
            $reservationsAfter,
            "DB must be identical after failed checkout: before={$reservationsBefore}, after={$reservationsAfter}"
        );

        $this->assertEquals(0, $reservationsAfter,
            "Zero reservation records must exist after failed payment across {$traderCount} traders");
    }

    /**
     * @return array<string, array{int, string}>
     */
    public static function failedPaymentProvider(): array
    {
        $cases = [];
        $errorCodes = ['1', '17', 'E001', 'C2B00016'];

        for ($i = 0; $i < 40; $i++) {
            $traderCount  = rand(1, 8);
            $responseCode = $errorCodes[array_rand($errorCodes)];
            $cases["traders={$traderCount}_code={$responseCode}_run{$i}"] = [$traderCount, $responseCode];
        }
        return $cases;
    }
}

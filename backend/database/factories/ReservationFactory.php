<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Reservation;
use App\Models\Trader;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Reservation>
 */
class ReservationFactory extends Factory
{
    protected $model = Reservation::class;

    public function definition(): array
    {
        $product = Product::factory()->create();

        return [
            'reservation_code' => 'SM-' . strtoupper(Str::random(8)),
            'resident_id'      => User::factory()->create(['role' => 'resident'])->id,
            'trader_id'        => $product->trader_id,
            'product_id'       => $product->id,
            'quantity'         => 1,
            'unit_price'       => $product->price,
            'total_amount'     => $product->price,
            'status'           => 'pending',
            'pickup_deadline'  => now()->addHours(24),
        ];
    }
}

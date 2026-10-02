<?php

namespace Database\Factories;

use App\Models\Market;
use App\Models\Stall;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Stall>
 */
class StallFactory extends Factory
{
    protected $model = Stall::class;

    public function definition(): array
    {
        $market = Market::first() ?? Market::create([
            'name' => 'Kolenyo Market',
            'location' => 'Kolenyo Estate, Kisumu',
            'county' => 'Kisumu',
            'estate' => 'Kolenyo',
            'is_active' => true,
        ]);

        return [
            'market_id' => $market->id,
            'stall_number' => strtoupper(fake()->unique()->bothify('??##')),
            'zone' => fake()->randomElement(['A', 'B', 'C']),
            'map_x' => fake()->randomFloat(4, 10, 270),
            'map_y' => fake()->randomFloat(4, 10, 360),
            'status' => 'available',
            'monthly_fee' => 1500,
        ];
    }
}

<?php

namespace Database\Factories;

use App\Models\Market;
use App\Models\Trader;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Trader>
 */
class TraderFactory extends Factory
{
    protected $model = Trader::class;

    public function definition(): array
    {
        $user = User::factory()->create(['role' => 'trader']);

        // Ensure a Market exists
        $market = Market::first() ?? Market::create([
            'name'      => 'Test Market',
            'location'  => 'Test Location',
            'county'    => 'Test County',
            'estate'    => 'Test Estate',
            'is_active' => true,
        ]);

        return [
            'user_id'             => $user->id,
            'market_id'           => $market->id,
            'business_name'       => fake()->company(),
            'verification_status' => 'verified',
            'is_open'             => true,
        ];
    }
}

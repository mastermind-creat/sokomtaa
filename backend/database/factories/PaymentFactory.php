<?php

namespace Database\Factories;

use App\Models\Payment;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        return [
            'reservation_id' => Reservation::factory(),
            'user_id'        => User::factory(),
            'amount'         => fake()->randomFloat(2, 50, 5000),
            'phone_number'   => '',
            'type'           => 'reservation',
            'status'         => 'pending',
            'payment_method' => 'paypal',
            'paypal_order_id' => 'ORDER_' . strtoupper(fake()->unique()->bothify('??########')),
        ];
    }
}

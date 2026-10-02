<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Trader;
use App\Models\Product;
use App\Models\User;
use App\Models\Reservation;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Support\Str;

class TraderAnalyticsSeeder extends Seeder
{
    public function run(): void
    {
        $traders = Trader::all();
        $residents = User::where('role', 'resident')->get();

        if ($traders->isEmpty() || $residents->isEmpty()) {
            $this->command->info('Please ensure you have traders and residents seeded first.');
            return;
        }

        foreach ($traders as $trader) {
            $products = Product::where('trader_id', $trader->id)->get();
            if ($products->isEmpty()) continue;

            // Create 50-100 historical reservations over the last 60 days
            for ($i = 0; $i < rand(50, 100); $i++) {
                $product = $products->random();
                $resident = $residents->random();
                $date = Carbon::now()->subDays(rand(0, 60));
                
                $quantity = rand(1, 5);
                $unitPrice = $product->price;
                $serviceFee = 10.00;
                $totalAmount = ($unitPrice * $quantity) + $serviceFee;

                $status = 'completed';
                if ($date->isToday()) {
                    $status = rand(0, 1) ? 'pending' : 'completed';
                }

                $reservation = Reservation::create([
                    'reservation_code' => 'SM-' . strtoupper(Str::random(6)),
                    'resident_id' => $resident->id,
                    'trader_id' => $trader->id,
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'service_fee' => $serviceFee,
                    'total_amount' => $totalAmount,
                    'status' => $status,
                    'created_at' => $date,
                    'updated_at' => $date,
                ]);

                if ($status === 'completed') {
                    Payment::create([
                        'reservation_id' => $reservation->id,
                        'user_id' => $resident->id,
                        'mpesa_transaction_id' => 'NL' . strtoupper(Str::random(8)),
                        'amount' => $totalAmount,
                        'phone_number' => $resident->phone,
                        'type' => 'reservation',
                        'status' => 'completed',
                        'paid_at' => $date,
                        'created_at' => $date,
                        'updated_at' => $date,
                    ]);
                }
            }
            
            $this->command->info("Seeded analytics for trader: {$trader->business_name}");
        }
    }
}

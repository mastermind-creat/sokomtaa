<?php

namespace Database\Seeders;

use App\Models\Market;
use Illuminate\Database\Seeder;

class MarketSeeder extends Seeder
{
    public function run(): void
    {
        $markets = [
            [
                'name' => 'Gikomba Market',
                'location' => 'Kamukunji',
                'county' => 'Nairobi',
                'estate' => 'Pumwani',
                'description' => 'Largest second-hand clothes market in East Africa.',
                'latitude' => -1.2864,
                'longitude' => 36.8378,
            ],
            [
                'name' => 'Muthurwa Market',
                'location' => 'Nairobi Central',
                'county' => 'Nairobi',
                'estate' => 'Muthurwa',
                'description' => 'Major market for fresh produce and household items.',
                'latitude' => -1.2845,
                'longitude' => 36.8315,
            ],
            [
                'name' => 'Kongowea Market',
                'location' => 'Nyali',
                'county' => 'Mombasa',
                'estate' => 'Kongowea',
                'description' => 'The largest wholesale market for fresh produce in the Coastal region.',
                'latitude' => -4.0415,
                'longitude' => 39.6841,
            ],
        ];

        foreach ($markets as $market) {
            Market::create($market);
        }
    }
}

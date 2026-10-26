<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            MarketSeeder::class,
            CategorySeeder::class,
            AdminUserSeeder::class,
            SearchAliasSeeder::class,
        ]);
    }
}

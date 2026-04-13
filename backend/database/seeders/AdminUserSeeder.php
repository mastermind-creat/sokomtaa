<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        // Create the County Admin account
        User::updateOrCreate(
            ['phone' => '0700000001'],
            [
                'name'              => 'County Admin',
                'email'             => 'admin@sokomtaa.co.ke',
                'phone'             => '0700000001',
                'password'          => Hash::make('Admin@1234'),
                'role'              => 'admin',
                'phone_verified'    => true,
                'phone_verified_at' => now(),
                'is_active'         => true,
            ]
        );

        $this->command->info('✅ Admin user created:');
        $this->command->info('   Phone : 0700000001');
        $this->command->info('   Email : admin@sokomtaa.co.ke');
        $this->command->info('   Pass  : Admin@1234');
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $setting = [
            'key' => 'rider_payout_percentage',
            'value' => '100.00',
            'group' => 'fees',
            'label' => 'Rider Payout Percentage (%)',
            'type' => 'decimal',
            'description' => 'The percentage of the shipping/delivery fee that is paid to the rider.',
            'created_at' => now(),
            'updated_at' => now()
        ];

        DB::table('system_settings')->updateOrInsert(
            ['key' => $setting['key']],
            $setting
        );
    }

    public function down(): void
    {
        DB::table('system_settings')->where('key', 'rider_payout_percentage')->delete();
    }
};

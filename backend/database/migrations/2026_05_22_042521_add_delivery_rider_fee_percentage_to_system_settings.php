<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!DB::table('system_settings')->where('key', 'delivery_rider_fee_percentage')->exists()) {
            DB::table('system_settings')->insert([
                'key' => 'delivery_rider_fee_percentage',
                'value' => '15.00',
                'group' => 'fees',
                'type' => 'decimal',
                'label' => 'Delivery Rider Fee Percentage',
                'description' => 'The percentage of the delivery fee that the platform takes as commission.',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('system_settings')->where('key', 'delivery_rider_fee_percentage')->delete();
    }
};

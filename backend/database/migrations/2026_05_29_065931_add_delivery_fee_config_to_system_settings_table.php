<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Seeds three delivery fee settings:
     *   delivery_fee_type    — 'base_plus_per_km' | 'per_km_only'
     *   delivery_base_fee    — flat KES applied before distance (used when type = base_plus_per_km)
     *   delivery_fee_per_km  — KES per km charge
     */
    public function up(): void
    {
        $settings = [
            [
                'key'         => 'delivery_fee_type',
                'value'       => 'base_plus_per_km',
                'group'       => 'delivery',
                'type'        => 'select',
                'label'       => 'Delivery Fee Type',
                'description' => 'Choose whether to charge a base fee plus per-km rate, or strictly per-km only.',
            ],
            [
                'key'         => 'delivery_base_fee',
                'value'       => '50.00',
                'group'       => 'delivery',
                'type'        => 'decimal',
                'label'       => 'Delivery Base Fee (KES)',
                'description' => 'Flat base fee charged for every delivery (applied only when fee type is base_plus_per_km).',
            ],
            [
                'key'         => 'delivery_fee_per_km',
                'value'       => '20.00',
                'group'       => 'delivery',
                'type'        => 'decimal',
                'label'       => 'Delivery Fee Per KM (KES)',
                'description' => 'Amount charged per kilometre of delivery distance.',
            ],
        ];

        foreach ($settings as $setting) {
            if (!DB::table('system_settings')->where('key', $setting['key'])->exists()) {
                DB::table('system_settings')->insert(array_merge($setting, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('system_settings')->whereIn('key', [
            'delivery_fee_type',
            'delivery_base_fee',
            'delivery_fee_per_km',
        ])->delete();
    }
};


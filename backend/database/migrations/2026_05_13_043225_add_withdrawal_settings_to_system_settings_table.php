<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $settings = [
            ['key' => 'min_withdrawal_amount', 'value' => '100', 'group' => 'withdrawals', 'label' => 'Minimum Withdrawal Amount (KES)', 'type' => 'number'],
            ['key' => 'withdrawal_fee',         'value' => '5',   'group' => 'withdrawals', 'label' => 'Withdrawal Fee (KES)',             'type' => 'number'],
        ];

        foreach ($settings as $setting) {
            DB::table('system_settings')->updateOrInsert(
                ['key' => $setting['key']],
                array_merge($setting, ['created_at' => now(), 'updated_at' => now()])
            );
        }
    }

    public function down(): void
    {
        DB::table('system_settings')->whereIn('key', [
            'min_withdrawal_amount',
            'withdrawal_fee',
        ])->delete();
    }
};

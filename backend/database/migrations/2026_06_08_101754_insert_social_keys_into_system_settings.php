<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $settings = [
            [
                'key' => 'google_client_id',
                'value' => '',
                'group' => 'social',
                'type' => 'string',
                'label' => 'Google Client ID',
                'description' => 'OAuth Client ID for Google Sign-In',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'google_client_secret',
                'value' => '',
                'group' => 'social',
                'type' => 'string',
                'label' => 'Google Client Secret',
                'description' => 'OAuth Client Secret for Google Sign-In',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'apple_client_id',
                'value' => '',
                'group' => 'social',
                'type' => 'string',
                'label' => 'Apple Client ID (Service ID)',
                'description' => 'OAuth Client ID for Apple Sign-In',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'apple_client_secret',
                'value' => '',
                'group' => 'social',
                'type' => 'string',
                'label' => 'Apple Client Secret',
                'description' => 'OAuth Client Secret for Apple Sign-In',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        \Illuminate\Support\Facades\DB::table('system_settings')->insert($settings);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        \Illuminate\Support\Facades\DB::table('system_settings')->whereIn('key', [
            'google_client_id',
            'google_client_secret',
            'apple_client_id',
            'apple_client_secret',
        ])->delete();
    }
};

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
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('group')->default('general');
            $table->string('type')->default('string'); // string, integer, decimal, boolean
            $table->string('label')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Insert initial settings
        DB::table('system_settings')->insert([
            [
                'key' => 'resident_service_fee',
                'value' => '10.00',
                'group' => 'fees',
                'type' => 'decimal',
                'label' => 'Resident Service Fee',
                'description' => 'The fee charged to residents per reservation.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'service_fee_threshold',
                'value' => '200.00',
                'group' => 'fees',
                'type' => 'decimal',
                'label' => 'Service Fee Threshold',
                'description' => 'The minimum order amount required to apply the service fee.',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};

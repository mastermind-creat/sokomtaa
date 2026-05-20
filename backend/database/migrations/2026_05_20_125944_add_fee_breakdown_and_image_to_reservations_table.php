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
        Schema::table('reservations', function (Blueprint $table) {
            $table->string('delivery_image_url')->nullable();
            $table->decimal('rider_fee', 10, 2)->default(0.00);
            $table->decimal('system_delivery_fee', 10, 2)->default(0.00);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropColumn([
                'delivery_image_url',
                'rider_fee',
                'system_delivery_fee'
            ]);
        });
    }
};

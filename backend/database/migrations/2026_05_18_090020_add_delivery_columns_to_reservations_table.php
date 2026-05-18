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
            $table->boolean('delivery_option')->default(false);
            $table->enum('delivery_status', ['pending_assignment', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed'])->nullable();
            $table->foreignId('delivery_rider_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('delivery_fee', 10, 2)->default(0.00);
            $table->string('delivery_address')->nullable();
            $table->decimal('delivery_latitude', 10, 7)->nullable();
            $table->decimal('delivery_longitude', 10, 7)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropForeign(['delivery_rider_id']);
            $table->dropColumn([
                'delivery_option',
                'delivery_status',
                'delivery_rider_id',
                'delivery_fee',
                'delivery_address',
                'delivery_latitude',
                'delivery_longitude'
            ]);
        });
    }
};

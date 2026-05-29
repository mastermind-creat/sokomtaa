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
        // Add default mtaa (neighbourhood) to users for delivery
        Schema::table('users', function (Blueprint $table) {
            $table->string('default_delivery_mtaa')->nullable()->after('default_delivery_address');
        });

        // Add mtaa to reservations so rider knows the area
        Schema::table('reservations', function (Blueprint $table) {
            $table->string('delivery_mtaa')->nullable()->after('delivery_address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('default_delivery_mtaa');
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->dropColumn('delivery_mtaa');
        });
    }
};

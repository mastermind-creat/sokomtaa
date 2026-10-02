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
        if (DB::getDriverName() !== 'sqlite') {
            Schema::table('payments', function (Blueprint $table) {
                DB::statement("ALTER TABLE payments MODIFY COLUMN type ENUM('reservation', 'market_fee', 'wallet_topup', 'product_boost') NOT NULL");
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            Schema::table('payments', function (Blueprint $table) {
                DB::statement("ALTER TABLE payments MODIFY COLUMN type ENUM('reservation', 'market_fee', 'wallet_topup') NOT NULL");
            });
        }
    }
};

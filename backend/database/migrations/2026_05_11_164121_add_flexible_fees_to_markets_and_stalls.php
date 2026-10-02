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
        Schema::table('markets', function (Blueprint $table) {
            $table->decimal('default_daily_fee', 10, 2)->default(0)->after('default_monthly_fee');
            $table->decimal('default_weekly_fee', 10, 2)->default(0)->after('default_daily_fee');
            $table->boolean('is_fee_enabled')->default(true)->after('default_weekly_fee');
        });

        Schema::table('stalls', function (Blueprint $table) {
            $table->decimal('daily_fee', 10, 2)->default(0)->after('monthly_fee');
            $table->decimal('weekly_fee', 10, 2)->default(0)->after('daily_fee');
        });
    }

    public function down(): void
    {
        Schema::table('markets', function (Blueprint $table) {
            $table->dropColumn(['default_daily_fee', 'default_weekly_fee', 'is_fee_enabled']);
        });

        Schema::table('stalls', function (Blueprint $table) {
            $table->dropColumn(['daily_fee', 'weekly_fee']);
        });
    }
};

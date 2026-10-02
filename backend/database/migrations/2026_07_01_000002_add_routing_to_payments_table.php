<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            // Tracks which M-Pesa credentials were used for this payment
            $table->enum('routing', ['platform', 'custom_trader'])
                  ->default('platform')
                  ->after('type');

            // When routing = custom_trader, record the service fee the platform is owed
            $table->decimal('platform_commission', 10, 2)->default(0)->after('routing');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['routing', 'platform_commission']);
        });
    }
};

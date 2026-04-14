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
        Schema::table('traders', function (Blueprint $table) {
            $table->enum('fee_payment_frequency', ['daily', 'weekly', 'monthly'])->default('daily')->after('is_open');
            $table->timestamp('last_fee_deduction_at')->nullable()->after('fee_payment_frequency');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('traders', function (Blueprint $table) {
            $table->dropColumn(['fee_payment_frequency', 'last_fee_deduction_at']);
        });
    }
};

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
        Schema::table('wallet_transactions', function (Blueprint $table) {
            // Status for withdrawal tracking: completed, pending, failed
            $table->enum('status', ['completed', 'pending', 'failed'])->default('completed')->after('type');
            // Running balance snapshot after this transaction
            $table->decimal('balance_after', 15, 2)->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wallet_transactions', function (Blueprint $table) {
            $table->dropColumn(['status', 'balance_after']);
        });
    }
};

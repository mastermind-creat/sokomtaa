<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds PayPal-specific columns to the `payments` and `reservations` tables.
     * Non-destructive: all existing rows keep their data and default to
     * payment_method = 'mpesa' with both PayPal columns null.
     */
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('paypal_order_id')->nullable()->unique()
                  ->after('mpesa_checkout_request_id');
            $table->string('paypal_transaction_id')->nullable()->unique()
                  ->after('paypal_order_id');
            $table->string('payment_method', 20)->default('mpesa')
                  ->after('paypal_transaction_id');
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->string('paypal_order_id')->nullable()
                  ->after('reservation_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropUnique(['paypal_order_id']);
            $table->dropUnique(['paypal_transaction_id']);
            $table->dropColumn(['paypal_order_id', 'paypal_transaction_id', 'payment_method']);
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->dropColumn('paypal_order_id');
        });
    }
};

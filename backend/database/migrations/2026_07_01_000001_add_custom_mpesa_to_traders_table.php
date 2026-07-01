<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('traders', function (Blueprint $table) {
            // Feature flag
            $table->boolean('custom_mpesa_enabled')->default(false)->after('mpesa_number');

            // Daraja API credentials (stored encrypted)
            $table->text('custom_mpesa_consumer_key')->nullable()->after('custom_mpesa_enabled');
            $table->text('custom_mpesa_consumer_secret')->nullable()->after('custom_mpesa_consumer_key');
            $table->text('custom_mpesa_passkey')->nullable()->after('custom_mpesa_consumer_secret');

            // Shortcode / Till number
            $table->string('custom_mpesa_shortcode', 20)->nullable()->after('custom_mpesa_passkey');

            // Transaction type: Paybill = CustomerPayBillOnline, Buy Goods = CustomerBuyGoodsOnline
            $table->enum('custom_mpesa_transaction_type', ['CustomerPayBillOnline', 'CustomerBuyGoodsOnline'])
                  ->default('CustomerPayBillOnline')
                  ->after('custom_mpesa_shortcode');

            // Environment: sandbox or production
            $table->enum('custom_mpesa_environment', ['sandbox', 'production'])
                  ->default('sandbox')
                  ->after('custom_mpesa_transaction_type');

            // Set when a test token call confirms credentials are valid
            $table->timestamp('custom_mpesa_verified_at')->nullable()->after('custom_mpesa_environment');
        });
    }

    public function down(): void
    {
        Schema::table('traders', function (Blueprint $table) {
            $table->dropColumn([
                'custom_mpesa_enabled',
                'custom_mpesa_consumer_key',
                'custom_mpesa_consumer_secret',
                'custom_mpesa_passkey',
                'custom_mpesa_shortcode',
                'custom_mpesa_transaction_type',
                'custom_mpesa_environment',
                'custom_mpesa_verified_at',
            ]);
        });
    }
};

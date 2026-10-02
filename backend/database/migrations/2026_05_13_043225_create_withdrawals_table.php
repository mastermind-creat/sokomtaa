<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('withdrawals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trader_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2);               // Amount trader requested
            $table->decimal('fee', 10, 2)->default(5.00);   // Platform fee (KES 5)
            $table->decimal('net_amount', 10, 2);           // Amount sent via B2C (amount - fee)
            $table->string('mpesa_number', 20);             // Destination phone
            $table->string('mpesa_conversation_id')->nullable()->unique(); // Daraja ConversationID
            $table->string('mpesa_transaction_id')->nullable()->unique();  // Daraja TransactionID on success
            $table->enum('status', ['processing', 'completed', 'failed'])->default('processing');
            $table->text('failure_reason')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('withdrawals');
    }
};

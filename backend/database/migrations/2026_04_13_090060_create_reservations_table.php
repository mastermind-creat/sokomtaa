<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->string('reservation_code')->unique();
            $table->foreignId('resident_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('trader_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_amount', 10, 2);
            $table->enum('status', [
                'pending',      // Created, awaiting payment
                'paid',         // Payment confirmed
                'ready',        // Trader confirms item ready for pickup
                'completed',    // Resident picked up
                'cancelled',    // Cancelled by either party
                'expired'       // Not picked up within window
            ])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamp('pickup_deadline')->nullable();
            $table->timestamp('picked_up_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};

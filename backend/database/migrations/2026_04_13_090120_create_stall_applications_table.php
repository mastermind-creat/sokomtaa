<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stall_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trader_id')->constrained()->cascadeOnDelete();
            $table->foreignId('market_id')->constrained();
            $table->foreignId('preferred_stall_id')->nullable()->constrained('stalls')->nullOnDelete();
            $table->string('preferred_zone')->nullable();
            $table->text('motivation');
            $table->enum('status', ['pending', 'approved', 'rejected', 'waitlisted'])
                  ->default('pending');
            $table->text('admin_notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stall_applications');
    }
};

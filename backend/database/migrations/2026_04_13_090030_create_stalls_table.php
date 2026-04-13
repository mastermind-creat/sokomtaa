<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stalls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('market_id')->constrained()->cascadeOnDelete();
            $table->string('stall_number')->unique();
            $table->string('zone')->nullable();   // e.g. "A", "B", "Vegetable Section"
            $table->decimal('size_sqm', 5, 2)->nullable();
            $table->decimal('map_x', 8, 4)->nullable(); // Position on market map
            $table->decimal('map_y', 8, 4)->nullable();
            $table->enum('status', ['available', 'occupied', 'reserved', 'maintenance'])
                  ->default('available');
            $table->decimal('monthly_fee', 10, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stalls');
    }
};

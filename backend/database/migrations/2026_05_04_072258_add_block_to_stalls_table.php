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
        Schema::table('stalls', function (Blueprint $table) {
            $table->string('block')->after('stall_number')->default('A');
            
            // Drop the old unique constraint on stall_number if it exists
            // (The previous migration had $table->string('stall_number')->unique())
            $table->dropUnique(['stall_number']);
            
            // Add new composite unique constraint
            $table->unique(['market_id', 'block', 'stall_number']);
        });
    }

    public function down(): void
    {
        Schema::table('stalls', function (Blueprint $table) {
            $table->dropUnique(['market_id', 'block', 'stall_number']);
            $table->dropColumn('block');
            $table->unique('stall_number');
        });
    }
};

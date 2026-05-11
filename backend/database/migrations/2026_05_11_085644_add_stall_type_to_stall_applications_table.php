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
        Schema::table('stall_applications', function (Blueprint $table) {
            $table->enum('stall_type', ['managed', 'independent'])->default('managed')->after('market_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stall_applications', function (Blueprint $table) {
            $table->dropColumn('stall_type');
        });
    }
};

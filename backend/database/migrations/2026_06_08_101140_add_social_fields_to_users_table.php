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
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone', 20)->nullable()->change();
            $table->string('password')->nullable()->change();
            $table->string('provider_name')->nullable()->after('password');
            $table->string('provider_id')->nullable()->after('provider_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone', 20)->nullable(false)->change();
            $table->string('password')->nullable(false)->change();
            $table->dropColumn(['provider_name', 'provider_id']);
        });
    }
};

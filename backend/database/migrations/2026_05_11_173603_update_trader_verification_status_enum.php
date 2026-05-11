<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Using raw SQL because Laravel's change() doesn't handle enums well without DBAL, 
        // and even then it can be problematic with existing data.
        DB::statement("ALTER TABLE traders MODIFY COLUMN verification_status ENUM('unverified', 'pending', 'verified', 'rejected') DEFAULT 'unverified'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE traders MODIFY COLUMN verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending'");
    }
};

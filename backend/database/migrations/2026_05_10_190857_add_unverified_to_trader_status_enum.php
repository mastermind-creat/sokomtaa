<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add 'unverified' to the enum and make it the default
        DB::statement("ALTER TABLE traders MODIFY COLUMN verification_status ENUM('unverified', 'pending', 'verified', 'rejected') DEFAULT 'unverified'");
        
        // Update any existing 'pending' traders who haven't uploaded IDs yet
        DB::table('traders')
            ->where('verification_status', 'pending')
            ->whereNull('id_front_url')
            ->update(['verification_status' => 'unverified']);
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE traders MODIFY COLUMN verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending'");
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds kyc_submitted_at timestamp to track when a rider actually submits KYC docs.
     * Expands verification_status enum to include 'not_submitted' as the true default.
     */
    public function up(): void
    {
        Schema::table('delivery_profiles', function (Blueprint $table) {
            $table->timestamp('kyc_submitted_at')->nullable()->after('license_number');
            $table->string('id_document_url')->nullable()->after('kyc_submitted_at');
            $table->string('license_image_url')->nullable()->after('id_document_url');
        });

        // Expand the enum to include 'not_submitted' and update existing rows
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE delivery_profiles MODIFY COLUMN verification_status ENUM('not_submitted','pending','verified','rejected') NOT NULL DEFAULT 'not_submitted'");
            // Reset all existing 'pending' riders who have no documents to 'not_submitted'
            DB::statement("UPDATE delivery_profiles SET verification_status = 'not_submitted' WHERE verification_status = 'pending' AND kyc_submitted_at IS NULL");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('delivery_profiles', function (Blueprint $table) {
            $table->dropColumn(['kyc_submitted_at', 'id_document_url', 'license_image_url']);
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("UPDATE delivery_profiles SET verification_status = 'pending' WHERE verification_status = 'not_submitted'");
            DB::statement("ALTER TABLE delivery_profiles MODIFY COLUMN verification_status ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending'");
        }
    }
};

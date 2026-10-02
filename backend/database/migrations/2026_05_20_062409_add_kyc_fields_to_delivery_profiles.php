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
        Schema::table('delivery_profiles', function (Blueprint $table) {
            $table->string('id_front_url')->nullable()->after('id_document_url');
            $table->string('id_back_url')->nullable()->after('id_front_url');
            $table->string('face_verification_url')->nullable()->after('id_back_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('delivery_profiles', function (Blueprint $table) {
            $table->dropColumn(['id_front_url', 'id_back_url', 'face_verification_url']);
        });
    }
};

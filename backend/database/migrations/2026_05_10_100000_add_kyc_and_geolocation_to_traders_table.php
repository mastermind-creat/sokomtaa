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
        Schema::table('traders', function (Blueprint $blueprint) {
            $blueprint->enum('stall_type', ['managed', 'independent'])->default('managed')->after('market_id');
            $blueprint->decimal('latitude', 10, 7)->nullable()->after('stall_type');
            $blueprint->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $blueprint->string('id_front_url')->nullable()->after('permit_image_url');
            $blueprint->string('id_back_url')->nullable()->after('id_front_url');
            $blueprint->string('selfie_url')->nullable()->after('id_back_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('traders', function (Blueprint $blueprint) {
            $blueprint->dropColumn([
                'stall_type',
                'latitude',
                'longitude',
                'id_front_url',
                'id_back_url',
                'selfie_url'
            ]);
        });
    }
};

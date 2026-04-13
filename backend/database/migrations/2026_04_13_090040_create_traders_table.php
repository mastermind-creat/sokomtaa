<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('traders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('stall_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('market_id')->constrained();
            $table->string('business_name');
            $table->string('business_name_sw')->nullable();
            $table->text('description')->nullable();
            $table->string('mpesa_number', 20)->nullable();
            $table->string('permit_number')->nullable();
            $table->string('permit_image_url')->nullable();
            $table->enum('verification_status', ['pending', 'verified', 'rejected'])
                  ->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->string('avatar_url')->nullable();
            $table->string('banner_url')->nullable();
            $table->boolean('is_open')->default(false);
            $table->string('opening_time', 5)->nullable();
            $table->string('closing_time', 5)->nullable();
            $table->decimal('average_rating', 3, 2)->default(0);
            $table->integer('total_reviews')->default(0);
            $table->integer('profile_views')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('traders');
    }
};

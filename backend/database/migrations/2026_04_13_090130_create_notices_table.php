<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('market_id')->constrained();
            $table->foreignId('created_by')->constrained('users');
            $table->string('title');
            $table->string('title_sw')->nullable();
            $table->text('content');
            $table->text('content_sw')->nullable();
            $table->enum('type', ['general', 'event', 'maintenance', 'promotion', 'urgent']);
            $table->enum('audience', ['all', 'traders', 'residents'])->default('all');
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_pinned')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notices');
    }
};

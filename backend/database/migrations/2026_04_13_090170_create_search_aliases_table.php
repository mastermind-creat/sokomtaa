<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('search_aliases', function (Blueprint $table) {
            $table->id();
            $table->string('alias');          // What user types
            $table->string('maps_to');        // What to search for
            $table->string('language', 5);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('search_aliases');
    }
};

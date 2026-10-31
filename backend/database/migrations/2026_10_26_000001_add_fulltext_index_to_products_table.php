<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * FULLTEXT indexes are MySQL/MariaDB only. Other drivers (notably the
     * in-memory SQLite database used by the test suite) reject the statement,
     * which would abort every migration-backed test.
     */
    private function supportsFulltext(): bool
    {
        return in_array(
            Schema::getConnection()->getDriverName(),
            ['mysql', 'mariadb'],
            true
        );
    }

    public function up(): void
    {
        if (! $this->supportsFulltext()) {
            return;
        }

        Schema::table('products', function (Blueprint $table) {
            $table->fullText(['name', 'name_sw', 'description'], 'products_fulltext');
        });
    }

    public function down(): void
    {
        if (! $this->supportsFulltext()) {
            return;
        }

        Schema::table('products', function (Blueprint $table) {
            $table->dropFullText('products_fulltext');
        });
    }
};

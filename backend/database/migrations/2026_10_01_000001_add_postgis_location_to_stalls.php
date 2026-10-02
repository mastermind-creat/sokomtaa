<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            $check = DB::select("SELECT 1 FROM pg_extension WHERE extname = 'postgis'");
            if (empty($check)) {
                throw new \RuntimeException(
                    'POSTGIS_UNAVAILABLE: PostGIS extension is not installed on this PostgreSQL instance. '
                    .'Run: CREATE EXTENSION postgis; as a superuser before this migration.'
                );
            }

            DB::statement('ALTER TABLE stalls ADD COLUMN IF NOT EXISTS location GEOGRAPHY(Point, 4326)');
            DB::statement(
                'CREATE INDEX IF NOT EXISTS stalls_location_gist_idx ON stalls USING GIST (location)'
            );

            return;
        }

        Schema::table('stalls', function (Blueprint $table) {
            if (! Schema::hasColumn('stalls', 'location')) {
                $table->text('location')->nullable();
            }
        });
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS stalls_location_gist_idx');
            DB::statement('ALTER TABLE stalls DROP COLUMN IF EXISTS location');

            return;
        }

        Schema::table('stalls', function (Blueprint $table) {
            if (Schema::hasColumn('stalls', 'location')) {
                $table->dropColumn('location');
            }
        });
    }
};

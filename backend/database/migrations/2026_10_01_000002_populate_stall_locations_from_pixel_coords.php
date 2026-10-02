<?php

use App\Services\StallLocationConverter;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('stalls', 'location')) {
            return;
        }

        $isPgsql = DB::getDriverName() === 'pgsql';
        $migrated = 0;
        $skipped = 0;

        DB::table('stalls')
            ->orderBy('id')
            ->chunk(200, function ($stalls) use ($isPgsql, &$migrated, &$skipped) {
                foreach ($stalls as $stall) {
                    if ($stall->location !== null && $stall->location !== '') {
                        continue;
                    }

                    $coords = StallLocationConverter::fromPixels($stall->map_x, $stall->map_y);
                    if ($coords === null) {
                        Log::info("Stall {$stall->id} skipped: null coordinates");
                        $skipped++;

                        continue;
                    }

                    if ($isPgsql) {
                        DB::update(
                            'UPDATE stalls SET location = ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography WHERE id = ? AND location IS NULL',
                            [$coords['lon'], $coords['lat'], $stall->id]
                        );
                    } else {
                        DB::table('stalls')->where('id', $stall->id)->whereNull('location')->update([
                            'location' => json_encode($coords),
                        ]);
                    }

                    $migrated++;
                }
            });

        Log::info("Stall location migration complete: {$migrated} migrated, {$skipped} skipped.");

        $this->seedActiveTradersGeo();
    }

    public function down(): void
    {
        // Coordinate population is data-only; leave location values in place.
    }

    private function seedActiveTradersGeo(): void
    {
        try {
            $openStalls = DB::table('stalls')
                ->join('traders', 'traders.stall_id', '=', 'stalls.id')
                ->where('traders.is_open', true)
                ->whereNotNull('stalls.location')
                ->select('stalls.id', 'stalls.location', 'stalls.map_x', 'stalls.map_y')
                ->get();

            foreach ($openStalls as $stall) {
                $coords = StallLocationConverter::fromPixels($stall->map_x, $stall->map_y);
                if ($coords === null) {
                    continue;
                }
                Redis::geoadd('active_traders', $coords['lon'], $coords['lat'], (string) $stall->id);
            }
        } catch (\Throwable $e) {
            Log::warning('Could not seed active_traders Redis GEO after stall location migration', [
                'error' => $e->getMessage(),
            ]);
        }
    }
};

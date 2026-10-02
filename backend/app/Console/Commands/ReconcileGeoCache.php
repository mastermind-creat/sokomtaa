<?php

namespace App\Console\Commands;

use App\Models\Stall;
use App\Services\GeoService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class ReconcileGeoCache extends Command
{
    protected $signature = 'geo:reconcile';

    protected $description = 'Reconcile Redis active_traders GEO set with open stalls in the database';

    public function handle(GeoService $geoService): int
    {
        $openStalls = Stall::query()
            ->whereHas('trader', fn ($q) => $q->where('is_open', true))
            ->whereNotNull('location')
            ->get();

        foreach ($openStalls as $stall) {
            if ($stall->lon === null || $stall->lat === null) {
                continue;
            }
            $geoService->addTraderToGeo((int) $stall->id, $stall->lon, $stall->lat);
        }

        $geoMembers = Redis::zrange(GeoService::ACTIVE_TRADERS, 0, -1) ?: [];
        $openIds = $openStalls->pluck('id')->map(fn ($id) => (string) $id)->all();
        $stale = array_values(array_diff($geoMembers, $openIds));

        if ($stale !== []) {
            Redis::zrem(GeoService::ACTIVE_TRADERS, ...$stale);
            Log::info('Reconcile: removed '.count($stale).' stale entries from active_traders');
        }

        $this->info('Reconciled active_traders (removed '.count($stale).' stale).');

        return self::SUCCESS;
    }
}

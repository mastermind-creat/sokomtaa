<?php

namespace App\Services;

use App\Models\Stall;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class GeoService
{
    public const ACTIVE_TRADERS = 'active_traders';

    public const ACTIVE_RIDERS = 'active_riders';

    public function stallsWithinViewport(float $minLon, float $minLat, float $maxLon, float $maxLat): Collection
    {
        $cacheKey = 'stall:geo:cache:'.md5(implode(':', [$minLon, $minLat, $maxLon, $maxLat]));
        $cached = Redis::get($cacheKey);
        if (is_string($cached) && $cached !== '') {
            return collect(json_decode($cached, true));
        }

        $stalls = $this->queryStalls($minLon, $minLat, $maxLon, $maxLat)
            ->filter(fn (Stall $stall) => $stall->status !== 'maintenance')
            ->values();

        $payload = $stalls->map(fn (Stall $stall) => $this->serializeStall($stall))->all();

        Redis::setex($cacheKey, 5, json_encode($payload));

        return collect($payload);
    }

    public function addTraderToGeo(int $stallId, float $lon, float $lat): void
    {
        Redis::geoadd(self::ACTIVE_TRADERS, $lon, $lat, (string) $stallId);
    }

    public function removeTraderFromGeo(int $stallId): void
    {
        Redis::zrem(self::ACTIVE_TRADERS, (string) $stallId);
    }

    public function removeRiderFromGeo(string $riderId): void
    {
        Redis::zrem(self::ACTIVE_RIDERS, $riderId);
    }

    public function syncTraderOpenState(Stall $stall, bool $isOpen): void
    {
        $lat = $stall->lat;
        $lon = $stall->lon;
        if ($lat === null || $lon === null) {
            return;
        }

        if ($isOpen) {
            $this->addTraderToGeo((int) $stall->id, $lon, $lat);
        } else {
            $this->removeTraderFromGeo((int) $stall->id);
        }
    }

    /**
     * @return \Illuminate\Database\Eloquent\Collection<int, Stall>
     */
    protected function queryStalls(float $minLon, float $minLat, float $maxLon, float $maxLat)
    {
        $query = Stall::query()
            ->with(['trader' => fn ($q) => $q->select('id', 'stall_id', 'business_name', 'is_open', 'average_rating')])
            ->whereIn('status', ['occupied', 'available']);

        if (DB::getDriverName() === 'pgsql') {
            return $query
                ->whereRaw(
                    'ST_Within(location::geometry, ST_MakeEnvelope(?, ?, ?, ?, 4326))',
                    [$minLon, $minLat, $maxLon, $maxLat]
                )
                ->get();
        }

        return $query->get()->filter(function (Stall $stall) use ($minLon, $minLat, $maxLon, $maxLat) {
            $lat = $stall->lat;
            $lon = $stall->lon;
            if ($lat === null || $lon === null) {
                return false;
            }

            return $lon >= $minLon && $lon <= $maxLon && $lat >= $minLat && $lat <= $maxLat;
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function serializeStall(Stall $stall): array
    {
        $trader = $stall->trader;

        return [
            'id' => $stall->id,
            'lon' => $stall->lon,
            'lat' => $stall->lat,
            'status' => $stall->status,
            'stall_number' => $stall->stall_number,
            'trader' => $trader ? [
                'id' => $trader->id,
                'business_name' => $trader->business_name,
                'is_open' => (bool) $trader->is_open,
                'average_rating' => $trader->average_rating,
            ] : null,
        ];
    }
}

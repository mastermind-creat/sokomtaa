<?php

namespace App\Console\Commands;

use App\Services\GeoService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class SubscribeRiderEvents extends Command
{
    protected $signature = 'riders:subscribe';

    protected $description = 'Subscribe to Redis rider_events and remove disconnected riders from GEO';

    public function handle(GeoService $geoService): int
    {
        Redis::subscribe(['rider_events'], function (string $message) use ($geoService) {
            $payload = json_decode($message, true);
            if (! is_array($payload) || ($payload['event'] ?? '') !== 'rider.disconnected') {
                return;
            }

            $riderId = (string) ($payload['rider_id'] ?? '');
            if ($riderId === '') {
                return;
            }

            $geoService->removeRiderFromGeo($riderId);
            Log::info('Removed disconnected rider from active_riders', ['rider_id' => $riderId]);
        });

        return self::SUCCESS;
    }
}

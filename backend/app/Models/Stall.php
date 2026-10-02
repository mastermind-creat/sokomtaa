<?php

namespace App\Models;

use App\Services\StallLocationConverter;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\DB;

class Stall extends Model
{
    use HasFactory;

    protected $fillable = [
        'market_id',
        'stall_number',
        'block',
        'zone',
        'size_sqm',
        'map_x',
        'map_y',
        'status',
        'monthly_fee',
        'notes',
        'location',
        'lat',
        'lon',
    ];

    protected $casts = [
        'size_sqm' => 'decimal:2',
        'map_x' => 'decimal:4',
        'map_y' => 'decimal:4',
        'monthly_fee' => 'decimal:2',
        'location' => 'string',
    ];

    protected $appends = ['lat', 'lon'];

    protected ?float $pendingLat = null;

    protected ?float $pendingLon = null;

    protected static function booted(): void
    {
        static::saving(function (Stall $stall) {
            // Remove virtual lat/lon attributes that were set via setters
            unset($stall->attributes['lat'], $stall->attributes['lon']);

            if ($stall->pendingLat === null || $stall->pendingLon === null) {
                return;
            }

            $lon = $stall->pendingLon;
            $lat = $stall->pendingLat;

            if (DB::getDriverName() === 'pgsql') {
                // Write PostGIS geography directly in the saving hook so the
                // value is included in the INSERT or UPDATE statement.
                $stall->attributes['location'] = DB::raw(
                    "ST_SetSRID(ST_MakePoint({$lon}, {$lat}), 4326)::geography"
                );
            } else {
                // Non-PostgreSQL fallback (e.g. SQLite in tests): store as JSON
                $stall->attributes['location'] = json_encode([
                    'lat' => $lat,
                    'lon' => $lon,
                ]);
            }

            $stall->pendingLat = null;
            $stall->pendingLon = null;
        });
    }

    public function setLatAttribute(mixed $value): void
    {
        $this->pendingLat = $value === null ? null : (float) $value;
    }

    public function setLonAttribute(mixed $value): void
    {
        $this->pendingLon = $value === null ? null : (float) $value;
    }

    public function getLatAttribute(): ?float
    {
        return $this->coordinatePair()['lat'] ?? null;
    }

    public function getLonAttribute(): ?float
    {
        return $this->coordinatePair()['lon'] ?? null;
    }

    /**
     * Write a WGS-84 geography value directly via a raw UPDATE.
     * Used by migrations and data-repair jobs that bypass the Eloquent lifecycle.
     */
    public function writeGeography(float $lon, float $lat): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::update(
                'UPDATE stalls SET location = ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography WHERE id = ?',
                [$lon, $lat, $this->id]
            );
            // Invalidate the in-memory cache so the next read goes to the DB
            unset($this->attributes['location']);

            return;
        }

        $this->attributes['location'] = json_encode(['lat' => $lat, 'lon' => $lon]);
    }

    /**
     * @return array{lat: float, lon: float}|null
     */
    public function coordinatePair(): ?array
    {
        if ($this->exists && DB::getDriverName() === 'pgsql' && ! empty($this->attributes['location'] ?? null)) {
            $result = DB::select(
                'SELECT ST_Y(location::geometry) as lat, ST_X(location::geometry) as lon FROM stalls WHERE id = ?',
                [$this->id]
            );
            if (! empty($result) && $result[0]->lat !== null) {
                return ['lat' => (float) $result[0]->lat, 'lon' => (float) $result[0]->lon];
            }
        }

        $raw = $this->attributes['location'] ?? null;
        if (is_string($raw) && str_starts_with($raw, '{')) {
            $decoded = json_decode($raw, true);
            if (isset($decoded['lat'], $decoded['lon'])) {
                return ['lat' => (float) $decoded['lat'], 'lon' => (float) $decoded['lon']];
            }
        }

        return StallLocationConverter::fromPixels(
            $this->attributes['map_x'] ?? null,
            $this->attributes['map_y'] ?? null
        );
    }

    public function market(): BelongsTo
    {
        return $this->belongsTo(Market::class);
    }

    public function currentTrader(): HasOne
    {
        return $this->hasOne(Trader::class);
    }

    public function trader(): HasOne
    {
        return $this->hasOne(Trader::class);
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(Allocation::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(StallApplication::class, 'preferred_stall_id');
    }
}

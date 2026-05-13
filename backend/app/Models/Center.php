<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

class Center extends Model
{
    use HasFactory;

    protected $fillable = [
        'county_id',
        'region_id', // Keeping for backward compatibility if needed, though mostly using county_id now
        'name',
        'description',
        'is_active',
    ];

    /**
     * Get the county that owns the center.
     */
    public function county(): BelongsTo
    {
        return $this->belongsTo(County::class);
    }

    /**
     * Get the region that owns the center through county.
     */
    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
    }

    /**
     * Get the markets for the center.
     */
    public function markets(): HasMany
    {
        return $this->hasMany(Market::class);
    }
}

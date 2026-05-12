<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Center extends Model
{
    use HasFactory;

    protected $fillable = [
        'region_id',
        'name',
        'description',
        'is_active',
    ];

    /**
     * Get the region that owns the center.
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

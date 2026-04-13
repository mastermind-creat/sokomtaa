<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Stall extends Model
{
    use HasFactory;

    protected $fillable = [
        'market_id',
        'stall_number',
        'zone',
        'size_sqm',
        'map_x',
        'map_y',
        'status',
        'monthly_fee',
        'notes',
    ];

    protected $casts = [
        'size_sqm' => 'decimal:2',
        'map_x' => 'decimal:4',
        'map_y' => 'decimal:4',
        'monthly_fee' => 'decimal:2',
    ];

    public function market(): BelongsTo
    {
        return $this->belongsTo(Market::class);
    }

    public function currentTrader(): HasOne
    {
        return $this->hasOne(Trader::class)->where('verification_status', 'verified');
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

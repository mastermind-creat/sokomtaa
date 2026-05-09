<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'trader_id',
        'category_id',
        'name',
        'name_sw',
        'description',
        'price',
        'unit',
        'stock_status',
        'stock_quantity',
        'image_url',
        'is_active',
        'is_boosted',
        'boosted_until',
        'total_reservations',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean',
        'is_boosted' => 'boolean',
        'boosted_until' => 'datetime',
    ];

    /**
     * Scope for products that are currently boosted.
     */
    public function scopeBoosted($query)
    {
        return $query->where('is_boosted', true)
                     ->where('boosted_until', '>=', now());
    }

    public function trader(): BelongsTo
    {
        return $this->belongsTo(Trader::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function watchlistUsers(): HasMany
    {
        return $this->hasMany(ProductWatchlist::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Trader extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'stall_id',
        'market_id',
        'business_name',
        'business_name_sw',
        'description',
        'mpesa_number',
        'permit_number',
        'permit_image_url',
        'verification_status',
        'rejection_reason',
        'avatar_url',
        'banner_url',
        'is_open',
        'opening_time',
        'closing_time',
        'average_rating',
        'total_reviews',
        'profile_views',
    ];

    protected $casts = [
        'is_open' => 'boolean',
        'average_rating' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function stall(): BelongsTo
    {
        return $this->belongsTo(Stall::class);
    }

    public function market(): BelongsTo
    {
        return $this->belongsTo(Market::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function marketFees(): HasMany
    {
        return $this->hasMany(MarketFee::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }
}

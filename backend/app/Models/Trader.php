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
        'market_id',
        'stall_id',
        'stall_type',
        'latitude',
        'longitude',
        'business_name',
        'business_name_sw',
        'description',
        'mpesa_number',
        'permit_number',
        'permit_image_url',
        'id_front_url',
        'id_back_url',
        'selfie_url',
        'verification_status',
        'rejection_reason',
        'avatar_url',
        'banner_url',
        'is_open',
        'opening_time',
        'closing_time',
        'fee_payment_frequency',
        'last_fee_deduction_at',
        'average_rating',
        'total_reviews',
        'profile_views',
    ];

    protected $casts = [
        'is_open' => 'boolean',
        'average_rating' => 'decimal:2',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'last_fee_deduction_at' => 'datetime',
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

    public function wallet(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Wallet::class);
    }
}

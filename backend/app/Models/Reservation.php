<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Reservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'reservation_code',
        'resident_id',
        'trader_id',
        'product_id',
        'quantity',
        'unit_price',
        'service_fee',
        'total_amount',
        'status',
        'notes',
        'pickup_deadline',
        'picked_up_at',
        'delivery_option',
        'delivery_rider_id',
        'delivery_status',
        'delivery_fee',
        'delivery_address',
        'delivery_mtaa',
        'delivery_latitude',
        'delivery_longitude',
        'delivery_image_url',
        'rider_fee',
        'system_delivery_fee',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'service_fee' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'pickup_deadline' => 'datetime',
        'picked_up_at' => 'datetime',
        'delivery_option' => 'boolean',
        'delivery_fee' => 'decimal:2',
        'delivery_latitude' => 'double',
        'delivery_longitude' => 'double',
    ];

    public function resident(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resident_id');
    }

    public function rider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'delivery_rider_id');
    }

    public function trader(): BelongsTo
    {
        return $this->belongsTo(Trader::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'reservation_id',
        'product_id',
        'user_id',
        'mpesa_transaction_id',
        'mpesa_checkout_request_id',
        'amount',
        'phone_number',
        'type',
        'status',
        'mpesa_response',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'mpesa_response' => 'json',
        'paid_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}

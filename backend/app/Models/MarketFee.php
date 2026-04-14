<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MarketFee extends Model
{
    use HasFactory;

    protected $fillable = [
        'trader_id',
        'market_id',
        'amount',
        'period',
        'status',
        'payment_id',
        'due_date',
        'paid_at',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'due_date' => 'datetime',
        'paid_at' => 'datetime',
    ];

    public function trader(): BelongsTo
    {
        return $this->belongsTo(Trader::class);
    }

    public function market(): BelongsTo
    {
        return $this->belongsTo(Market::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    /**
     * Determine if the market fee is overdue.
     */
    public function getIsOverdueAttribute(): bool
    {
        return $this->status === 'unpaid' && $this->due_date < now();
    }

    /**
     * Scope a query to only include overdue fees.
     */
    public function scopeOverdue($query)
    {
        return $query->where('status', 'unpaid')->where('due_date', '<', now());
    }
}

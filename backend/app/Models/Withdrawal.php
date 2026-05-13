<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Withdrawal extends Model
{
    protected $fillable = [
        'trader_id',
        'amount',
        'fee',
        'net_amount',
        'mpesa_number',
        'mpesa_conversation_id',
        'mpesa_transaction_id',
        'status',
        'failure_reason',
        'completed_at',
    ];

    protected $casts = [
        'amount'      => 'float',
        'fee'         => 'float',
        'net_amount'  => 'float',
        'completed_at' => 'datetime',
    ];

    public function trader(): BelongsTo
    {
        return $this->belongsTo(Trader::class);
    }
}

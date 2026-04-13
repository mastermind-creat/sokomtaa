<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notice extends Model
{
    use HasFactory;

    protected $fillable = [
        'market_id',
        'created_by',
        'title',
        'title_sw',
        'content',
        'content_sw',
        'type',
        'audience',
        'expires_at',
        'is_pinned',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'is_pinned' => 'boolean',
    ];

    public function market(): BelongsTo
    {
        return $this->belongsTo(Market::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

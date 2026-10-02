<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'type',
        'format',
        'file_path',
        'parameters',
        'status',
        'metadata',
        'generated_at',
    ];

    protected $casts = [
        'parameters' => 'array',
        'metadata' => 'array',
        'generated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

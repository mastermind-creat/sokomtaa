<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Market extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'location',
        'county',
        'estate',
        'description',
        'latitude',
        'longitude',
        'is_active',
        'building_config',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'building_config' => 'json',
    ];

    public function stalls(): HasMany
    {
        return $this->hasMany(Stall::class);
    }

    public function traders(): HasMany
    {
        return $this->hasMany(Trader::class);
    }

    public function notices(): HasMany
    {
        return $this->hasMany(Notice::class);
    }

    public function complaints(): HasMany
    {
        return $this->hasMany(Complaint::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Region extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'is_active',
    ];

    /**
     * Get the centers for the region.
     */
    public function centers(): HasMany
    {
        return $this->hasMany(Center::class);
    }

    /**
     * Get the markets for the region through centers.
     */
    public function markets(): HasManyThrough
    {
        return $this->hasManyThrough(Market::class, Center::class);
    }
}

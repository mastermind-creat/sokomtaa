<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'password',
        'role',
        'national_id',
        'preferred_language',
        'phone_verified',
        'phone_verified_at',
        'avatar_url',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'password' => 'hashed',
        'phone_verified' => 'boolean',
        'phone_verified_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function trader(): HasOne
    {
        return $this->hasOne(Trader::class);
    }

    public function riderProfile(): HasOne
    {
        return $this->hasOne(DeliveryProfile::class);
    }

    public function deliveryTransactions(): HasMany
    {
        return $this->hasMany(DeliveryTransaction::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class, 'resident_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class, 'resident_id');
    }

    public function complaints(): HasMany
    {
        return $this->hasMany(Complaint::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function watchlist(): HasMany
    {
        return $this->hasMany(ProductWatchlist::class);
    }
}

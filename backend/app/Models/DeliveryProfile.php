<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'vehicle_type',
        'license_plate',
        'license_number',
        'verification_status',
        'kyc_submitted_at',
        'id_document_url',
        'id_front_url',
        'id_back_url',
        'face_verification_url',
        'license_image_url',
        'latitude',
        'longitude',
        'is_available',
        'earnings_balance',
    ];

    protected $casts = [
        'is_available' => 'boolean',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'earnings_balance' => 'decimal:2',
        'kyc_submitted_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

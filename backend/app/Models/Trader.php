<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Trader extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'market_id',
        'stall_id',
        'stall_type',
        'latitude',
        'longitude',
        'business_name',
        'business_name_sw',
        'description',
        'mpesa_number',
        'permit_number',
        'permit_image_url',
        'id_front_url',
        'id_back_url',
        'selfie_url',
        'verification_status',
        'rejection_reason',
        'avatar_url',
        'banner_url',
        'is_open',
        'opening_time',
        'closing_time',
        'fee_payment_frequency',
        'last_fee_deduction_at',
        'average_rating',
        'total_reviews',
        'profile_views',
        // Custom M-Pesa integration
        'custom_mpesa_enabled',
        'custom_mpesa_consumer_key',
        'custom_mpesa_consumer_secret',
        'custom_mpesa_passkey',
        'custom_mpesa_shortcode',
        'custom_mpesa_transaction_type',
        'custom_mpesa_environment',
        'custom_mpesa_verified_at',
    ];

    /**
     * Raw credential fields are never serialised to JSON/API responses.
     * The controller uses getDecrypted*() helpers instead.
     */
    protected $hidden = [
        'custom_mpesa_consumer_key',
        'custom_mpesa_consumer_secret',
        'custom_mpesa_passkey',
    ];

    protected $casts = [
        'is_open'                  => 'boolean',
        'custom_mpesa_enabled'     => 'boolean',
        'average_rating'           => 'decimal:2',
        'latitude'                 => 'decimal:7',
        'longitude'                => 'decimal:7',
        'last_fee_deduction_at'    => 'datetime',
        'custom_mpesa_verified_at' => 'datetime',
    ];

    protected $appends = ['is_currently_open'];

    // ── Encrypted Credential Accessors / Mutators ─────────────────────────────

    /**
     * Automatically encrypt when setting consumer key.
     */
    public function setCustomMpesaConsumerKeyAttribute(?string $value): void
    {
        $this->attributes['custom_mpesa_consumer_key'] = $value ? encrypt($value) : null;
    }

    /**
     * Decrypt the consumer key for internal service use.
     */
    public function getDecryptedConsumerKey(): ?string
    {
        $raw = $this->attributes['custom_mpesa_consumer_key'] ?? null;
        return $raw ? decrypt($raw) : null;
    }

    public function setCustomMpesaConsumerSecretAttribute(?string $value): void
    {
        $this->attributes['custom_mpesa_consumer_secret'] = $value ? encrypt($value) : null;
    }

    public function getDecryptedConsumerSecret(): ?string
    {
        $raw = $this->attributes['custom_mpesa_consumer_secret'] ?? null;
        return $raw ? decrypt($raw) : null;
    }

    public function setCustomMpesaPasskeyAttribute(?string $value): void
    {
        $this->attributes['custom_mpesa_passkey'] = $value ? encrypt($value) : null;
    }

    public function getDecryptedPasskey(): ?string
    {
        $raw = $this->attributes['custom_mpesa_passkey'] ?? null;
        return $raw ? decrypt($raw) : null;
    }

    /**
     * Returns true only when all required custom credentials are stored.
     */
    public function hasValidCustomMpesa(): bool
    {
        return $this->custom_mpesa_enabled
            && !empty($this->attributes['custom_mpesa_consumer_key'])
            && !empty($this->attributes['custom_mpesa_consumer_secret'])
            && !empty($this->attributes['custom_mpesa_passkey'])
            && !empty($this->custom_mpesa_shortcode);
    }

    /**
     * Get the effective open status of the trader.
     * Respects both the manual toggle and the business hours.
     */
    public function getIsCurrentlyOpenAttribute(): bool
    {
        // If manually closed or unset, it's definitely closed
        if (!($this->attributes['is_open'] ?? false)) {
            return false;
        }

        // If no business hours are set, respect the manual toggle
        if (!$this->opening_time || !$this->closing_time) {
            return true;
        }

        // Check against current time in Kenya (Africa/Nairobi)
        $now = now()->setTimezone('Africa/Nairobi');
        $currentTime = $now->format('H:i');

        // Handle normal day shifts (e.g., 08:00 to 18:00)
        if ($this->opening_time < $this->closing_time) {
            return $currentTime >= $this->opening_time && $currentTime <= $this->closing_time;
        } 
        
        // Handle overnight shifts if any (e.g., 20:00 to 05:00)
        return $currentTime >= $this->opening_time || $currentTime <= $this->closing_time;
    }


    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function stall(): BelongsTo
    {
        return $this->belongsTo(Stall::class);
    }

    public function market(): BelongsTo
    {
        return $this->belongsTo(Market::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function marketFees(): HasMany
    {
        return $this->hasMany(MarketFee::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function wallet(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Wallet::class);
    }
}

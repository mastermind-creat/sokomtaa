<?php

namespace App\Traits;

trait PhoneNormalization
{
    /**
     * Normalizes Kenyan phone numbers to the format 254XXXXXXXXX
     *
     * @param string|null $phone
     * @return string|null
     */
    public function normalizePhone(?string $phone): ?string
    {
        if (!$phone) {
            return null;
        }

        // Remove all non-numeric characters except +
        $phone = preg_replace('/[^0-9+]/', '', $phone);
        
        // Handle +254...
        if (str_starts_with($phone, '+254')) {
            return substr($phone, 1);
        }
        
        // Handle 07... or 01...
        if (str_starts_with($phone, '0')) {
            return '254' . substr($phone, 1);
        }
        
        // Handle 254... (already normalized or starting with 254)
        if (str_starts_with($phone, '254') && strlen($phone) >= 12) {
            return $phone;
        }
        
        // Handle 7... or 1... (9 digits)
        if (strlen($phone) === 9 && (str_starts_with($phone, '7') || str_starts_with($phone, '1'))) {
            return '254' . $phone;
        }
        
        return $phone;
    }
}

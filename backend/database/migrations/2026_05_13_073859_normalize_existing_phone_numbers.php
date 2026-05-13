<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $normalize = function ($phone) {
            if (!$phone) return $phone;
            
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
            
            // Handle 254... (already normalized)
            if (str_starts_with($phone, '254') && strlen($phone) >= 12) {
                return $phone;
            }
            
            // Handle 7... or 1...
            if (strlen($phone) === 9 && (str_starts_with($phone, '7') || str_starts_with($phone, '1'))) {
                return '254' . $phone;
            }
            
            return $phone;
        };

        // Normalize users.phone
        DB::table('users')->get()->each(function ($user) use ($normalize) {
            $newPhone = $normalize($user->phone);
            if ($newPhone !== $user->phone) {
                // Check if another user already has this normalized phone
                $exists = DB::table('users')
                    ->where('phone', $newPhone)
                    ->where('id', '!=', $user->id)
                    ->exists();
                
                if ($exists) {
                    Log::warning("Skipping normalization for user ID {$user->id} due to collision: {$user->phone} would become {$newPhone}, which is already taken.");
                    return;
                }

                Log::info("Normalizing user phone: {$user->phone} -> {$newPhone}");
                DB::table('users')->where('id', $user->id)->update(['phone' => $newPhone]);
            }
        });

        // Normalize traders.mpesa_number
        DB::table('traders')->get()->each(function ($trader) use ($normalize) {
            if ($trader->mpesa_number) {
                $newMpesa = $normalize($trader->mpesa_number);
                if ($newMpesa !== $trader->mpesa_number) {
                    Log::info("Normalizing trader mpesa_number: {$trader->mpesa_number} -> {$newMpesa}");
                    DB::table('traders')->where('id', $trader->id)->update(['mpesa_number' => $newMpesa]);
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No easy way to reverse this as we don't know the original formats
    }
};

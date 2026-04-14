<?php

namespace App\Services;

use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;
use Exception;

class WalletService
{
    /**
     * Credit a wallet (Top-up).
     */
    public function credit(Wallet $wallet, float $amount, string $description, string $refType = null, string $refId = null): WalletTransaction
    {
        return DB::transaction(function () use ($wallet, $amount, $description, $refType, $refId) {
            // Update balance
            $wallet->increment('balance', $amount);

            // Create transaction record
            return $wallet->transactions()->create([
                'amount' => $amount,
                'type' => 'credit',
                'description' => $description,
                'reference_type' => $refType,
                'reference_id' => $refId,
            ]);
        });
    }

    /**
     * Debit a wallet (Deduction).
     */
    public function debit(Wallet $wallet, float $amount, string $description, string $refType = null, string $refId = null): WalletTransaction
    {
        if ($wallet->balance < $amount) {
            throw new Exception("Insalio haitoshi (Insufficient balance) in wallet ID {$wallet->id}");
        }

        return DB::transaction(function () use ($wallet, $amount, $description, $refType, $refId) {
            // Update balance
            $wallet->decrement('balance', $amount);

            // Create transaction record
            return $wallet->transactions()->create([
                'amount' => $amount,
                'type' => 'debit',
                'description' => $description,
                'reference_type' => $refType,
                'reference_id' => $refId,
            ]);
        });
    }

    /**
     * Get or create a wallet for a trader.
     */
    public function getOrCreateForTrader($traderId): Wallet
    {
        return Wallet::firstOrCreate(
            ['trader_id' => $traderId],
            ['balance' => 0.00, 'is_active' => true]
        );
    }
}

<?php

namespace App\Services;

use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;
use Exception;

class WalletService
{
    /**
     * Credit a wallet (Top-up / Sale earnings).
     */
    public function credit(Wallet $wallet, float $amount, string $description, string $refType = null, string $refId = null): WalletTransaction
    {
        return DB::transaction(function () use ($wallet, $amount, $description, $refType, $refId) {
            $wallet->increment('balance', $amount);
            $wallet->refresh();

            return $wallet->transactions()->create([
                'amount'        => $amount,
                'type'          => 'credit',
                'status'        => 'completed',
                'balance_after' => $wallet->balance,
                'description'   => $description,
                'reference_type' => $refType,
                'reference_id'   => $refId,
            ]);
        });
    }

    /**
     * Debit a wallet (Fee deduction / Withdrawal).
     */
    public function debit(Wallet $wallet, float $amount, string $description, string $refType = null, string $refId = null, string $status = 'completed'): WalletTransaction
    {
        if ($wallet->balance < $amount) {
            throw new Exception("Salio haitoshi (Insufficient balance). Available: KES {$wallet->balance}, Requested: KES {$amount}.");
        }

        return DB::transaction(function () use ($wallet, $amount, $description, $refType, $refId, $status) {
            $wallet->decrement('balance', $amount);
            $wallet->refresh();

            return $wallet->transactions()->create([
                'amount'         => $amount,
                'type'           => 'debit',
                'status'         => $status,
                'balance_after'  => $wallet->balance,
                'description'    => $description,
                'reference_type' => $refType,
                'reference_id'   => $refId,
            ]);
        });
    }

    /**
     * Create a pending withdrawal request (deducts immediately, status = pending).
     */
    public function requestWithdrawal(Wallet $wallet, float $amount, string $mpesaPhone): WalletTransaction
    {
        if ($amount < 10) {
            throw new Exception('Minimum withdrawal amount is KES 10.');
        }

        return $this->debit(
            $wallet,
            $amount,
            "Withdrawal Request to {$mpesaPhone}",
            'withdrawal',
            null,
            'pending'
        );
    }

    /**
     * Mark a pending withdrawal as completed or failed.
     */
    public function resolveWithdrawal(WalletTransaction $tx, string $status, ?string $mpesaReceiptId = null): WalletTransaction
    {
        if ($tx->reference_type !== 'withdrawal') {
            throw new Exception('Transaction is not a withdrawal.');
        }

        // If failed, reverse the debit — refund to wallet
        if ($status === 'failed') {
            DB::transaction(function () use ($tx) {
                $tx->wallet->increment('balance', $tx->amount);
                $tx->update(['status' => 'failed']);
            });
        } else {
            $tx->update([
                'status'       => 'completed',
                'reference_id' => $mpesaReceiptId,
            ]);
        }

        return $tx->fresh();
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

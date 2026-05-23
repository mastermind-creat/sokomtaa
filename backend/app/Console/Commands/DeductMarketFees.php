<?php

// v2.1.0 — Flexible fee support: respects market is_fee_enabled toggle and explicit daily/weekly rates

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Trader;
use App\Models\MarketFee;
use App\Services\WalletService;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class DeductMarketFees extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fees:deduct';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically deduct market fees from trader wallets based on their frequency (Daily/Weekly).';

    protected $walletService;
    protected $notificationService;

    public function __construct(WalletService $walletService, NotificationService $notificationService)
    {
        parent::__construct();
        $this->walletService = $walletService;
        $this->notificationService = $notificationService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting Market Fee Automated Deductions...');

        // 1. Fetch all traders with active stall allocations in markets where fees are enabled
        $traders = Trader::whereHas('stall')
            ->whereHas('market', function($q) {
                $q->where('is_fee_enabled', true);
            })
            ->with(['stall', 'user', 'wallet', 'market'])
            ->get();

        $processedCount = 0;
        $failureCount = 0;

        foreach ($traders as $trader) {
            // Extra check for market enablement just in case
            if (!$trader->market->is_fee_enabled) {
                continue;
            }

            if (!$this->isDueForDeduction($trader)) {
                continue;
            }

            $amount = $this->calculateDeductionAmount($trader);
            
            // If amount is 0, skip
            if ($amount <= 0) continue;

            $period = Carbon::now()->format('Y-m-d'); // Track deduction per day

            try {
                // Ensure wallet exists
                $wallet = $this->walletService->getOrCreateForTrader($trader->id);

                // Attempt Debit
                $transaction = $this->walletService->debit(
                    $wallet, 
                    $amount, 
                    "Market Fee Deduction ({$trader->fee_payment_frequency}) for {$period}",
                    'market_fee'
                );

                // Success Record
                MarketFee::create([
                    'trader_id' => $trader->id,
                    'market_id' => $trader->market_id,
                    'amount' => $amount,
                    'period' => $period,
                    'status' => 'paid',
                    'payment_id' => null,
                    'due_date' => Carbon::now(),
                    'paid_at' => Carbon::now(),
                    'notes' => "Wallet transaction ID: {$transaction->id}"
                ]);

                // Update Trader
                $trader->update(['last_fee_deduction_at' => Carbon::now()]);
                $processedCount++;

            } catch (\Exception $e) {
                // Failure (Usually Insufficient Balance)
                $this->handleDeductionFailure($trader, $amount, $period, $e->getMessage());
                $failureCount++;
            }
        }

        $this->info("Successfully processed {$processedCount} deductions.");
        if ($failureCount > 0) {
            $this->warn("Failed to process {$failureCount} deductions due to insufficient balance.");
        }
    }

    /**
     * Check if a trader is due for their next deduction based on frequency.
     */
    protected function isDueForDeduction(Trader $trader): bool
    {
        if (!$trader->last_fee_deduction_at) return true;

        $last = $trader->last_fee_deduction_at;
        $now = Carbon::now();

        if ($trader->fee_payment_frequency === 'daily') {
            return $last->diffInDays($now) >= 1;
        }

        if ($trader->fee_payment_frequency === 'weekly') {
            return $last->diffInWeeks($now) >= 1;
        }

        // Default to monthly if not specified (though monthly isn't in frequency enum yet)
        if ($trader->fee_payment_frequency === 'monthly') {
            return $last->diffInMonths($now) >= 1;
        }

        return false;
    }

    /**
     * Calculate deduction based on Fees and Frequency.
     * Prioritizes explicit daily/weekly/monthly fees over calculation.
     */
    protected function calculateDeductionAmount(Trader $trader): float
    {
        $stall = $trader->stall;

        if ($trader->fee_payment_frequency === 'daily') {
            if ($stall->daily_fee > 0) return (float) $stall->daily_fee;
            return round($stall->monthly_fee / 30, 2);
        }

        if ($trader->fee_payment_frequency === 'weekly') {
            if ($stall->weekly_fee > 0) return (float) $stall->weekly_fee;
            return round($stall->monthly_fee / 4, 2);
        }

        return (float) $stall->monthly_fee;
    }

    /**
     * Handle failed deduction (Insufficient funds).
     */
    protected function handleDeductionFailure(Trader $trader, float $amount, string $period, string $error)
    {
        Log::warning("Fee Deduction Failed for Trader {$trader->id}: {$error}");

        // Create Unpaid Record
        MarketFee::create([
            'trader_id' => $trader->id,
            'market_id' => $trader->market_id,
            'amount' => $amount,
            'period' => $period,
            'status' => 'unpaid',
            'due_date' => Carbon::now(),
            'notes' => "Failed wallet deduction: {$error}"
        ]);

        // Notify Trader
        $this->notificationService->send(
            $trader->user,
            'Insufficient Wallet Balance',
            "We were unable to deduct your market fee of KES {$amount}. Please top up your wallet via M-Pesa to avoid a penalty.",
            'payment',
            ['amount' => $amount],
            true // SMS Notification
        );
    }
}

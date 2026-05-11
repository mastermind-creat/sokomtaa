<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MarketFee;
use App\Models\Trader;
use App\Models\WalletTransaction;
use App\Models\Stall;
use App\Models\Market;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FeeManagementController extends Controller
{
    use ApiResponse;

    /**
     * Get high-level collection statistics for the Admin Dashboard.
     */
    public function stats(Request $request): JsonResponse
    {
        $marketId = $request->market_id;
        $period = $request->period ?? Carbon::now()->format('Y-m');

        $query = MarketFee::query();
        if ($marketId) {
            $query->where('market_id', $marketId);
        }

        $stats = [
            'total_target' => (float) $query->clone()->sum('amount'),
            'total_collected' => (float) $query->clone()->where('status', 'paid')->sum('amount'),
            'collection_rate' => 0,
            'delinquent_count' => Trader::whereHas('marketFees', function($q) {
                // Delinquent if they have more than 14 cumulative unpaid days
                $q->where('status', 'unpaid');
            })->count(),
            'wallet_float' => (float) \App\Models\Wallet::sum('balance'),
        ];

        if ($stats['total_target'] > 0) {
            $stats['collection_rate'] = round(($stats['total_collected'] / $stats['total_target']) * 100, 1);
        }

        return $this->success($stats);
    }

    /**
     * List all recent wallet transactions for auditing.
     */
    public function transactions(Request $request): JsonResponse
    {
        $transactions = WalletTransaction::with(['wallet.trader.user'])
            ->latest()
            ->paginate(20);

        return $this->paginated($transactions);
    }

    /**
     * List traders with overdue fees (> 14 days).
     */
    public function delinquents(): JsonResponse
    {
        // A trader is delinquent if they have unpaid fees spanning more than 14 days
        $delinquents = Trader::with(['user', 'market', 'stall'])
            ->whereHas('marketFees', function($q) {
                $q->where('status', 'unpaid');
            })
            ->get()
            ->filter(function($trader) {
                $unpaidCount = $trader->marketFees()->where('status', 'unpaid')->count();
                // If daily: 14 unpaid. If weekly: 2 unpaid (~14 days).
                $threshold = $trader->fee_payment_frequency === 'daily' ? 14 : 2;
                return $unpaidCount >= $threshold;
            })
            ->values();

        return $this->success($delinquents);
    }

    /**
     * Update the base fees for a Market or Stall.
     */
    public function updateFee(Request $request): JsonResponse
    {
        $request->validate([
            'type' => 'required|in:market,stall',
            'target_id' => 'required|integer',
            'monthly_fee' => 'nullable|numeric|min:0',
            'daily_fee' => 'nullable|numeric|min:0',
            'weekly_fee' => 'nullable|numeric|min:0',
            'is_fee_enabled' => 'nullable|boolean',
        ]);

        $updateData = [];
        if ($request->has('monthly_fee')) $updateData['monthly_fee'] = $request->monthly_fee;
        if ($request->has('daily_fee')) $updateData['daily_fee'] = $request->daily_fee;
        if ($request->has('weekly_fee')) $updateData['weekly_fee'] = $request->weekly_fee;

        if ($request->type === 'market') {
            $marketUpdateData = [];
            if ($request->has('monthly_fee')) $marketUpdateData['default_monthly_fee'] = $request->monthly_fee;
            if ($request->has('daily_fee')) $marketUpdateData['default_daily_fee'] = $request->daily_fee;
            if ($request->has('weekly_fee')) $marketUpdateData['default_weekly_fee'] = $request->weekly_fee;
            if ($request->has('is_fee_enabled')) $marketUpdateData['is_fee_enabled'] = $request->is_fee_enabled;

            Market::where('id', $request->target_id)->update($marketUpdateData);

            // Sync all stalls in this market if fees were changed
            if (!empty($updateData)) {
                Stall::where('market_id', $request->target_id)->update($updateData);
            }
        } else {
            Stall::where('id', $request->target_id)->update($updateData);
        }

        return $this->success(null, 'Market fees updated successfully. (Ada za soko zimesasishwa.)');
    }
    public function updateGlobalRate(Request $request): JsonResponse
    {
        $request->validate([
            'monthly_fee' => 'nullable|numeric|min:0',
            'daily_fee' => 'nullable|numeric|min:0',
            'weekly_fee' => 'nullable|numeric|min:0',
            'is_fee_enabled' => 'nullable|boolean',
        ]);

        $marketUpdateData = [];
        $stallUpdateData = [];

        if ($request->has('monthly_fee')) {
            $marketUpdateData['default_monthly_fee'] = $request->monthly_fee;
            $stallUpdateData['monthly_fee'] = $request->monthly_fee;
        }
        if ($request->has('daily_fee')) {
            $marketUpdateData['default_daily_fee'] = $request->daily_fee;
            $stallUpdateData['daily_fee'] = $request->daily_fee;
        }
        if ($request->has('weekly_fee')) {
            $marketUpdateData['default_weekly_fee'] = $request->weekly_fee;
            $stallUpdateData['weekly_fee'] = $request->weekly_fee;
        }
        if ($request->has('is_fee_enabled')) {
            $marketUpdateData['is_fee_enabled'] = $request->is_fee_enabled;
        }

        if (!empty($marketUpdateData)) {
            Market::query()->update($marketUpdateData);
        }

        if (!empty($stallUpdateData)) {
            Stall::query()->update($stallUpdateData);
        }

        return $this->success(null, "Global rates and system configurations updated successfully. (Vigezo vya mfumo vimesasishwa kote.)");
    }
}

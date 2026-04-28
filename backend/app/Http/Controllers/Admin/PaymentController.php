<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PaymentController extends Controller
{
    /**
     * Return transaction records for Dispute resolutions and fee ledgers.
     */
    public function index(Request $request): JsonResponse
    {
        $type = $request->query('type', 'fees');

        // Mock ledger data
        if ($type === 'fees') {
            $data = [
                ['id' => 1, 'ref' => 'TXN-001', 'mpesa_id' => 'QWE123RTY', 'trader_name' => 'Mama Wanjiru', 'stall' => 'A1', 'period' => 'Jan 2025', 'amount' => 1500, 'paid_at' => '2025-01-14T09:30:00Z', 'status' => 'completed'],
                ['id' => 2, 'ref' => 'TXN-002', 'mpesa_id' => 'ASD456FGH', 'trader_name' => 'Tech Safi Store', 'stall' => 'B4', 'period' => 'Jan 2025', 'amount' => 3000, 'paid_at' => '2025-01-15T11:20:00Z', 'status' => 'completed']
            ];
        } else {
            $data = [
                ['id' => 101, 'ref' => 'RES-K7B', 'code' => '#K7B', 'resident' => 'John Doe', 'trader' => 'Mama Wanjiru', 'product' => 'Sukuma Wiki', 'amount' => 150, 'paid_at' => '2025-01-14T14:10:00Z', 'status' => 'completed', 'mpesa_id' => 'ZXC789VBN']
            ];
        }

        return response()->json([
            'success' => true,
            'message' => 'Payments ledger retrieved.',
            'data' => $data
        ]);
    }
}

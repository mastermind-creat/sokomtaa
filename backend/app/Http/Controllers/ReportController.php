<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\Reservation;
use App\Models\Payment;
use App\Models\MarketFee;
use App\Models\User;
use App\Models\Complaint;
use App\Exports\ActivityExport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $reports = Report::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json($reports);
    }

    public function generateReceipt(Request $request, Reservation $reservation)
    {
        if ($request->user()->role !== 'admin' &&
            $request->user()->id !== $reservation->resident_id &&
            $request->user()->id !== $reservation->trader->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $reservation->load(['resident', 'trader.stall', 'trader.market', 'product.category', 'payment']);

        if (!class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
            return response()->json([
                'message' => 'PDF receipt generation is not available on this server.'
            ], 400);
        }

        $pdf = Pdf::loadView('reports.receipt', ['reservation' => $reservation]);

        $filename = 'receipt_' . $reservation->reservation_code . '_' . time() . '.pdf';
        $path = 'reports/' . $filename;
        Storage::disk('public')->put($path, $pdf->output());

        $report = Report::create([
            'user_id'      => $request->user()->id,
            'title'        => 'Receipt: ' . $reservation->reservation_code,
            'type'         => 'receipt',
            'format'       => 'pdf',
            'file_path'    => $path,
            'status'       => 'completed',
            'generated_at' => now(),
            'metadata'     => [
                'amount'    => $reservation->total_amount,
                'reference' => $reservation->reservation_code
            ]
        ]);

        return response()->json([
            'message'      => 'Receipt generated successfully',
            'report'       => $report,
            'download_url' => asset('storage/' . $path)
        ]);
    }

    public function generateActivityReport(Request $request)
    {
        try {
            $type   = $request->input('type', 'revenue'); // revenue | activity | audit
            $format = $request->input('format', 'pdf');   // pdf | xlsx

            try {
                $startDate = Carbon::parse($request->input('start_date', now()->startOfMonth()->toDateString()))->startOfDay();
                $endDate   = Carbon::parse($request->input('end_date',   now()->toDateString()))->endOfDay();
            } catch (\Exception $e) {
                $startDate = now()->startOfMonth()->startOfDay();
                $endDate   = now()->endOfDay();
            }

            $data       = [];
            $extraStats = [];
            $title      = 'Report';

            // ── TRADER ───────────────────────────────────────────────────────────
            if ($request->user()->role === 'trader') {
                $trader = $request->user()->trader;
                if (!$trader) {
                    return response()->json(['message' => 'Trader profile not found'], 404);
                }

                $title = 'Sales Report: ' . $trader->business_name;

                $reservations = Reservation::where('trader_id', $trader->id)
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->whereIn('status', ['paid', 'ready', 'completed'])
                    ->with(['product', 'resident'])
                    ->get();

                foreach ($reservations as $res) {
                    $data[] = [
                        'created_at'   => $res->created_at->toDateTimeString(),
                        'reference'    => $res->reservation_code,
                        'description'  => ($res->product ? $res->product->name : 'Deleted Product') . ' (Qty: ' . $res->quantity . ')',
                        'entity'       => $res->resident ? $res->resident->name : 'Unknown Resident',
                        'total_amount' => $res->total_amount,
                        'source'       => 'Reservation',
                        'status'       => ucfirst($res->status),
                    ];
                }

            // ── ADMIN ────────────────────────────────────────────────────────────
            } elseif ($request->user()->role === 'admin') {

                // ── FINANCIAL REVENUE ──────────────────────────────────────────
                if ($type === 'revenue') {
                    $title = 'Financial Revenue Report';

                    // 1) Completed M-Pesa payments (reservation payments)
                    $payments = Payment::whereBetween('created_at', [$startDate, $endDate])
                        ->where('status', 'completed')
                        ->with(['user', 'reservation.product', 'reservation.trader.market'])
                        ->get();

                    // 2) Paid market fees
                    $fees = MarketFee::whereBetween('created_at', [$startDate, $endDate])
                        ->where('status', 'paid')
                        ->with(['trader', 'market'])
                        ->get();

                    $reservationRevenue = $payments->where('type', 'reservation')->sum('amount');
                    $feeRevenue         = $fees->sum('amount');
                    $totalRevenue       = $reservationRevenue + $feeRevenue;

                    foreach ($payments as $payment) {
                        $productName = optional(optional($payment->reservation)->product)->name ?? '–';
                        $marketName  = optional(optional(optional($payment->reservation)->trader)->market)->name ?? '–';

                        $data[] = [
                            'created_at'   => ($payment->paid_at ?? $payment->created_at)->toDateTimeString(),
                            'reference'    => $payment->mpesa_transaction_id ?? ('PAY-' . str_pad($payment->id, 6, '0', STR_PAD_LEFT)),
                            'description'  => 'Reservation Payment' . ($productName !== '–' ? ': ' . $productName : ''),
                            'entity'       => ($payment->user?->name ?? 'Unknown') . ($marketName !== '–' ? ' / ' . $marketName : ''),
                            'total_amount' => $payment->amount,
                            'source'       => 'Reservation',
                            'status'       => 'Completed',
                        ];
                    }

                    foreach ($fees as $fee) {
                        $data[] = [
                            'created_at'   => ($fee->paid_at ?? $fee->created_at)->toDateTimeString(),
                            'reference'    => 'FEE-' . str_pad($fee->id, 6, '0', STR_PAD_LEFT),
                            'description'  => 'Market Fee – ' . $fee->period,
                            'entity'       => ($fee->trader?->business_name ?? 'Deleted Trader') . ' / ' . ($fee->market?->name ?? 'Unknown Market'),
                            'total_amount' => $fee->amount,
                            'source'       => 'Market Fee',
                            'status'       => 'Paid',
                        ];
                    }

                    // Sort descending by date
                    usort($data, fn($a, $b) => strcmp($b['created_at'], $a['created_at']));

                    $extraStats = [
                        'total_revenue'       => $totalRevenue,
                        'reservation_revenue' => $reservationRevenue,
                        'fee_revenue'         => $feeRevenue,
                        'reservation_count'   => $payments->count(),
                        'fee_count'           => $fees->count(),
                        'grand_count'         => count($data),
                    ];

                // ── MARKET ACTIVITY ────────────────────────────────────────────
                } elseif ($type === 'activity') {
                    $title = 'Market Activity Report';

                    $reservations = Reservation::whereBetween('created_at', [$startDate, $endDate])
                        ->with(['product.category', 'resident', 'trader.market', 'trader.stall'])
                        ->get();

                    foreach ($reservations as $res) {
                        $data[] = [
                            'created_at'   => $res->created_at->toDateTimeString(),
                            'reference'    => $res->reservation_code,
                            'description'  => ($res->product?->name ?? 'Deleted Product') . ' × ' . $res->quantity,
                            'entity'       => $res->trader?->business_name ?? 'Unknown Trader',
                            'market'       => $res->trader?->market?->name ?? 'Unknown Market',
                            'resident'     => $res->resident?->name ?? 'Unknown',
                            'category'     => $res->product?->category?->name ?? 'Uncategorized',
                            'total_amount' => $res->total_amount,
                            'source'       => $res->product?->category?->name ?? 'Reservation',
                            'status'       => $res->status,
                        ];
                    }

                    $collected      = collect($data);
                    $statusGroups   = $collected->groupBy('status');
                    $marketGroups   = $collected->groupBy('market');

                    $statusBreakdown = [];
                    foreach ($statusGroups as $status => $group) {
                        $statusBreakdown[$status] = [
                            'count'  => $group->count(),
                            'amount' => $group->sum('total_amount'),
                        ];
                    }

                    $marketBreakdown = [];
                    foreach ($marketGroups as $market => $group) {
                        $marketBreakdown[$market] = [
                            'count'  => $group->count(),
                            'amount' => $group->sum('total_amount'),
                        ];
                    }

                    $extraStats = [
                        'total_reservations' => $collected->count(),
                        'total_volume'       => $collected->sum('total_amount'),
                        'completed_volume'   => $collected->where('status', 'completed')->sum('total_amount'),
                        'status_breakdown'   => $statusBreakdown,
                        'market_breakdown'   => $marketBreakdown,
                        'unique_traders'     => $collected->pluck('entity')->unique()->count(),
                        'unique_residents'   => $collected->pluck('resident')->unique()->count(),
                    ];

                // ── SECURITY / AUDIT ───────────────────────────────────────────
                } elseif ($type === 'audit') {
                    $title = 'System Audit Report';

                    // User registrations
                    $users = User::whereBetween('created_at', [$startDate, $endDate])
                        ->orderBy('created_at', 'desc')
                        ->get();

                    foreach ($users as $user) {
                        $data[] = [
                            'created_at'   => $user->created_at->toDateTimeString(),
                            'reference'    => 'USR-' . str_pad($user->id, 6, '0', STR_PAD_LEFT),
                            'description'  => 'User Registration',
                            'entity'       => $user->name . ' (' . $user->phone . ')',
                            'total_amount' => 0,
                            'source'       => 'Registration',
                            'status'       => ucfirst($user->role),
                        ];
                    }

                    // Complaints
                    $complaints = Complaint::whereBetween('created_at', [$startDate, $endDate])
                        ->with(['user', 'market'])
                        ->orderBy('created_at', 'desc')
                        ->get();

                    foreach ($complaints as $complaint) {
                        $data[] = [
                            'created_at'   => $complaint->created_at->toDateTimeString(),
                            'reference'    => 'CMP-' . str_pad($complaint->id, 6, '0', STR_PAD_LEFT),
                            'description'  => $complaint->subject,
                            'entity'       => ($complaint->user?->name ?? 'Unknown') . ' / ' . ($complaint->market?->name ?? 'Unknown Market'),
                            'total_amount' => 0,
                            'source'       => 'Complaint',
                            'status'       => ucfirst($complaint->status),
                        ];
                    }

                    usort($data, fn($a, $b) => strcmp($b['created_at'], $a['created_at']));

                    $roleGroups = collect($users)->groupBy('role');
                    $extraStats = [
                        'total_users'      => $users->count(),
                        'traders'          => $roleGroups->get('trader', collect())->count(),
                        'residents'        => $roleGroups->get('resident', collect())->count(),
                        'admins'           => $roleGroups->get('admin', collect())->count(),
                        'total_complaints' => $complaints->count(),
                        'open_complaints'  => $complaints->where('status', 'open')->count(),
                    ];
                }
            }

            // ── Generate File ────────────────────────────────────────────────────
            $filename = Str::slug($title) . '_' . time() . '.' . $format;
            $path     = 'reports/' . $filename;

            if ($format === 'pdf') {
                if (!class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
                    return response()->json([
                        'message' => 'PDF generation is not available. Please select "Excel" format instead.'
                    ], 400);
                }

                // Use a dedicated blade for market activity
                $viewName = ($type === 'activity' && $request->user()->role === 'admin')
                    ? 'reports.market_activity'
                    : 'reports.activity';

                $pdf = Pdf::loadView($viewName, [
                    'title'       => $title,
                    'data'        => $data,
                    'user'        => $request->user(),
                    'start_date'  => $startDate,
                    'end_date'    => $endDate,
                    'type'        => $type,
                    'extra_stats' => $extraStats,
                ])->setPaper('a4', 'portrait');

                Storage::disk('public')->put($path, $pdf->output());
            } else {
                Excel::store(new ActivityExport($data), $path, 'public');
            }

            $report = Report::create([
                'user_id'      => $request->user()->id,
                'title'        => $title,
                'type'         => $type,
                'format'       => $format,
                'file_path'    => $path,
                'status'       => 'completed',
                'generated_at' => now(),
                'parameters'   => $request->all(),
                'metadata'     => [
                    'total_amount' => collect($data)->sum('total_amount'),
                    'count'        => count($data),
                    'extra_stats'  => $extraStats,
                ]
            ]);

            return response()->json([
                'message'      => 'Report generated successfully',
                'report'       => $report,
                'download_url' => asset('storage/' . $path)
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to generate report: ' . $e->getMessage(),
                'trace'   => $e->getTraceAsString()
            ], 500);
        }
    }

    public function download(Request $request, Report $report)
    {
        if ($request->user()->id !== $report->user_id && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!Storage::disk('public')->exists($report->file_path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return response()->download(
            storage_path('app/public/' . $report->file_path),
            $report->title . '.' . $report->format
        );
    }

    public function destroy(Request $request, Report $report)
    {
        if ($request->user()->id !== $report->user_id && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($report->file_path) {
            Storage::disk('public')->delete($report->file_path);
        }

        $report->delete();

        return response()->json(['message' => 'Report deleted successfully']);
    }
}

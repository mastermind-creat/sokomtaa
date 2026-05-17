<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\Reservation;
use App\Models\Payment;
use App\Models\MarketFee;
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
        // Auth check
        if ($request->user()->role !== 'admin' && 
            $request->user()->id !== $reservation->resident_id && 
            $request->user()->id !== $reservation->trader->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $reservation->load(['resident', 'trader.stall', 'trader.market', 'product.category', 'payment']);

        $pdf = Pdf::loadView('reports.receipt', ['reservation' => $reservation]);
        
        $filename = 'receipt_' . $reservation->reservation_code . '_' . time() . '.pdf';
        $path = 'reports/' . $filename;
        
        Storage::disk('public')->put($path, $pdf->output());

        $report = Report::create([
            'user_id' => $request->user()->id,
            'title' => 'Receipt: ' . $reservation->reservation_code,
            'type' => 'receipt',
            'format' => 'pdf',
            'file_path' => $path,
            'status' => 'completed',
            'generated_at' => now(),
            'metadata' => [
                'amount' => $reservation->total_amount,
                'reference' => $reservation->reservation_code
            ]
        ]);

        return response()->json([
            'message' => 'Receipt generated successfully',
            'report' => $report,
            'download_url' => asset('storage/' . $path)
        ]);
    }

    public function generateActivityReport(Request $request)
    {
        try {
            $type = $request->input('type', 'activity'); // sales, revenue, fees
            $format = $request->input('format', 'pdf'); // pdf, xlsx
            
            try {
                $startDate = Carbon::parse($request->input('start_date', now()->startOfMonth()->toDateString()))->startOfDay();
                $endDate = Carbon::parse($request->input('end_date', now()->endOfMonth()->toDateString()))->endOfDay();
            } catch (\Exception $e) {
                $startDate = now()->startOfMonth()->startOfDay();
                $endDate = now()->endOfMonth()->endOfDay();
            }

            $data = [];
            $title = "Activity Report";

            if ($request->user()->role === 'trader') {
                $trader = $request->user()->trader;
                if (!$trader) {
                    return response()->json(['message' => 'Trader profile not found'], 404);
                }
                $title = "Sales Report: " . $trader->business_name;
                
                $reservations = Reservation::where('trader_id', $trader->id)
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->whereIn('status', ['paid', 'ready', 'completed'])
                    ->with(['product', 'resident'])
                    ->get();

                foreach ($reservations as $res) {
                    $data[] = [
                        'created_at' => $res->created_at->toDateTimeString(),
                        'reference' => $res->reservation_code,
                        'description' => ($res->product ? $res->product->name : 'Deleted Product') . ' (Qty: ' . $res->quantity . ')',
                        'entity' => $res->resident ? $res->resident->name : 'Unknown Resident',
                        'total_amount' => $res->total_amount,
                        'status' => $res->status
                    ];
                }
            } elseif ($request->user()->role === 'admin') {
                $title = "County Revenue Report";
                
                $fees = MarketFee::whereBetween('created_at', [$startDate, $endDate])
                    ->where('status', 'paid')
                    ->with(['trader', 'market'])
                    ->get();

                foreach ($fees as $fee) {
                    $data[] = [
                        'created_at' => $fee->created_at->toDateTimeString(),
                        'reference' => 'FEE-' . $fee->id,
                        'description' => 'Market Fee (' . $fee->period . ')',
                        'entity' => ($fee->trader ? $fee->trader->business_name : 'Deleted Trader') . ' (' . ($fee->market ? $fee->market->name : 'Unknown Market') . ')',
                        'total_amount' => $fee->amount,
                        'status' => $fee->status
                    ];
                }
            }

            $filename = Str::slug($title) . '_' . time() . '.' . $format;
            $path = 'reports/' . $filename;

            if ($format === 'pdf') {
                $pdf = Pdf::loadView('reports.activity', [
                    'title' => $title,
                    'data' => $data,
                    'user' => $request->user(),
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]);
                Storage::disk('public')->put($path, $pdf->output());
            } else {
                Excel::store(new ActivityExport($data), $path, 'public');
            }

            $report = Report::create([
                'user_id' => $request->user()->id,
                'title' => $title,
                'type' => $type,
                'format' => $format,
                'file_path' => $path,
                'status' => 'completed',
                'generated_at' => now(),
                'parameters' => $request->all(),
                'metadata' => [
                    'total_amount' => collect($data)->sum('total_amount'),
                    'count' => count($data)
                ]
            ]);

            return response()->json([
                'message' => 'Report generated successfully',
                'report' => $report,
                'download_url' => asset('storage/' . $path)
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to generate report: ' . $e->getMessage(),
                'trace' => $e->getTraceAsString()
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

        return response()->download(storage_path('app/public/' . $report->file_path), $report->title . '.' . $report->format);
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

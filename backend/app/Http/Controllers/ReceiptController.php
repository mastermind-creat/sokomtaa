<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class ReceiptController extends Controller
{
    public function download(Request $request, Reservation $reservation)
    {
        // 1. Authorization: Only resident, trader, or admin can access
        $user = $request->user();
        
        if ($user->role === 'resident' && $reservation->resident_id !== $user->id) {
            abort(403, 'Unauthorized access to this receipt.');
        }
        
        if ($user->role === 'trader' && $reservation->trader_id !== $user->trader->id) {
            abort(403, 'Unauthorized access to this receipt.');
        }

        // Ensure reservation is at least paid or completed
        if (in_array($reservation->status, ['pending', 'cancelled'])) {
            abort(400, 'Receipt is not available for this reservation status.');
        }

        // 2. Generate QR Code (Base64 encoded SVG or PNG)
        // We encode the reservation_code. An in-app scanner will scan this code.
        $qrCode = base64_encode(QrCode::format('svg')->size(150)->margin(1)->generate($reservation->reservation_code));

        // 3. Load View
        $pdf = Pdf::loadView('receipts.reservation', [
            'reservation' => $reservation->load(['resident', 'trader', 'product', 'payment']),
            'qrCode' => $qrCode,
            'user' => $user
        ]);

        // Optional: Make it download or just stream
        // $request->query('download') ? $pdf->download(...) : $pdf->stream(...)
        $action = $request->query('action', 'stream');
        $filename = 'Receipt_' . $reservation->reservation_code . '.pdf';

        if ($action === 'download') {
            return $pdf->download($filename);
        }

        return $pdf->stream($filename);
    }
}

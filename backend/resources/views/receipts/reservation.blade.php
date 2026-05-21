<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Receipt - #{{ $reservation->reservation_code }}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1a1a1a;
            font-size: 14px;
            margin: 0;
            padding: 0;
            background-color: #fff;
        }
        .container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 2px dashed #e5e7eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: 900;
            color: #16a34a;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin: 0;
        }
        .receipt-title {
            font-size: 12px;
            font-weight: bold;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 3px;
            margin-top: 5px;
        }
        .flex-container {
            width: 100%;
        }
        .col-left {
            float: left;
            width: 50%;
        }
        .col-right {
            float: right;
            width: 50%;
            text-align: right;
        }
        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }
        .section-title {
            font-size: 10px;
            font-weight: bold;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 5px;
        }
        .info-text {
            font-size: 14px;
            font-weight: bold;
            margin: 0 0 5px 0;
        }
        .info-subtext {
            font-size: 12px;
            color: #6b7280;
            margin: 0;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 30px;
            margin-bottom: 30px;
        }
        .table th {
            border-bottom: 2px solid #1a1a1a;
            text-align: left;
            padding: 10px 0;
            font-size: 10px;
            font-weight: bold;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .table td {
            border-bottom: 1px solid #e5e7eb;
            padding: 15px 0;
            font-size: 14px;
            font-weight: bold;
        }
        .text-right {
            text-align: right !important;
        }
        .summary-box {
            float: right;
            width: 300px;
        }
        .summary-row {
            padding: 5px 0;
        }
        .summary-total {
            border-top: 2px solid #1a1a1a;
            padding-top: 10px;
            margin-top: 5px;
            font-size: 18px;
            font-weight: 900;
        }
        .qr-container {
            text-align: center;
            margin-top: 50px;
            padding-top: 30px;
            border-top: 1px dashed #e5e7eb;
        }
        .qr-code {
            display: inline-block;
            padding: 10px;
            border: 2px solid #e5e7eb;
            border-radius: 10px;
            margin-bottom: 10px;
        }
        .qr-text {
            font-size: 10px;
            font-weight: bold;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 10px;
            color: #9ca3af;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            background-color: #ecfdf5;
            color: #059669;
            border: 1px solid #a7f3d0;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1 class="logo">Soko Mtaa</h1>
            <div class="receipt-title">Official Receipt</div>
        </div>

        <!-- Details -->
        <div class="flex-container clearfix">
            <div class="col-left">
                <div class="section-title">Billed To</div>
                <p class="info-text">{{ $reservation->resident->name }}</p>
                <p class="info-subtext">{{ $reservation->resident->phone }}</p>
                <p class="info-subtext">{{ $reservation->resident->email }}</p>
            </div>
            <div class="col-right">
                <div class="section-title">Receipt Details</div>
                <p class="info-text">Code: #{{ $reservation->reservation_code }}</p>
                <p class="info-subtext">Date: {{ $reservation->created_at->format('M d, Y H:i') }}</p>
                <div style="margin-top: 10px;">
                    <span class="badge">{{ strtoupper($reservation->status) }}</span>
                </div>
            </div>
        </div>

        <!-- Trader / Market Info -->
        <div class="flex-container clearfix" style="margin-top: 30px;">
            <div class="col-left">
                <div class="section-title">Sold By</div>
                <p class="info-text">{{ $reservation->trader->business_name }}</p>
                <p class="info-subtext">{{ $reservation->trader->market->name ?? 'Market' }}</p>
                <p class="info-subtext">Stall: {{ $reservation->trader->stall->stall_number ?? 'N/A' }}</p>
            </div>
        </div>

        <!-- Order Items -->
        <table class="table">
            <thead>
                <tr>
                    <th>Item Description</th>
                    <th class="text-right">Qty</th>
                    <th class="text-right">Unit Price</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        {{ $reservation->product->name }}
                        @if($reservation->delivery_option)
                            <div style="font-size: 10px; color: #6b7280; font-weight: normal; margin-top: 4px;">Includes Delivery</div>
                        @endif
                    </td>
                    <td class="text-right">{{ $reservation->quantity }}</td>
                    <td class="text-right">KES {{ number_format($reservation->unit_price, 2) }}</td>
                    <td class="text-right">KES {{ number_format($reservation->unit_price * $reservation->quantity, 2) }}</td>
                </tr>
            </tbody>
        </table>

        <!-- Summary -->
        <div class="clearfix">
            <div class="summary-box">
                <div class="summary-row clearfix">
                    <div class="col-left" style="color: #6b7280;">Subtotal</div>
                    <div class="col-right">KES {{ number_format($reservation->unit_price * $reservation->quantity, 2) }}</div>
                </div>
                <div class="summary-row clearfix">
                    <div class="col-left" style="color: #6b7280;">Service Fee</div>
                    <div class="col-right">KES {{ number_format($reservation->service_fee, 2) }}</div>
                </div>
                @if($reservation->delivery_option)
                <div class="summary-row clearfix">
                    <div class="col-left" style="color: #6b7280;">Delivery Fee</div>
                    <div class="col-right">KES {{ number_format($reservation->delivery_fee, 2) }}</div>
                </div>
                @endif
                <div class="summary-row summary-total clearfix">
                    <div class="col-left">Total Paid</div>
                    <div class="col-right text-green">KES {{ number_format($reservation->total_amount, 2) }}</div>
                </div>
            </div>
        </div>

        <!-- QR Code Verification -->
        <div class="qr-container">
            <div class="qr-code">
                <img src="data:image/svg+xml;base64,{{ $qrCode }}" alt="QR Code" width="120" height="120">
            </div>
            <div class="qr-text">Scan to verify pickup</div>
            <p style="font-size: 14px; font-weight: 900; letter-spacing: 2px; margin-top: 10px;">{{ $reservation->reservation_code }}</p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Thank you for shopping at Soko Mtaa.</p>
            <p>Generated on {{ now()->format('Y-m-d H:i:s') }}</p>
        </div>
    </div>
</body>
</html>

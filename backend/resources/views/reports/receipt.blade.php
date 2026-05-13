<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Receipt - {{ $reservation->reservation_code }}</title>
    <style>
        @page {
            margin: 0cm 0cm;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 14px;
            color: #1A1A1A;
            margin: 0;
            padding: 0;
            background-color: #FAFAF8;
        }
        .header {
            background-color: #1B6B3A;
            color: white;
            padding: 40px 60px;
            text-align: left;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .header p {
            margin: 5px 0 0;
            opacity: 0.8;
            font-size: 12px;
            letter-spacing: 1px;
        }
        .content {
            padding: 60px;
            background-color: white;
            margin: -20px 40px 40px;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }
        .receipt-info {
            display: table;
            width: 100%;
            margin-bottom: 40px;
        }
        .receipt-info div {
            display: table-cell;
            width: 50%;
        }
        .receipt-info .right {
            text-align: right;
        }
        .label {
            color: #6B7280;
            text-transform: uppercase;
            font-size: 10px;
            font-weight: bold;
            letter-spacing: 1px;
            margin-bottom: 5px;
        }
        .value {
            font-weight: bold;
            font-size: 16px;
            color: #1B6B3A;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 40px;
        }
        .table th {
            text-align: left;
            padding: 15px;
            background-color: #F9FAFB;
            color: #6B7280;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 2px solid #E5E7EB;
        }
        .table td {
            padding: 20px 15px;
            border-bottom: 1px solid #E5E7EB;
        }
        .table .price {
            text-align: right;
            font-weight: bold;
            color: #1B6B3A;
        }
        .total-section {
            margin-top: 40px;
            text-align: right;
        }
        .total-box {
            display: inline-block;
            background-color: #1B6B3A;
            color: white;
            padding: 20px 40px;
            border-radius: 15px;
        }
        .total-box .total-label {
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 5px;
            opacity: 0.8;
        }
        .total-box .total-value {
            font-size: 24px;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            padding: 40px;
            color: #9CA3AF;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .stamp {
            position: absolute;
            top: 200px;
            right: 100px;
            border: 4px solid #F5A623;
            color: #F5A623;
            padding: 10px 20px;
            border-radius: 10px;
            transform: rotate(-15deg);
            font-weight: bold;
            font-size: 20px;
            text-transform: uppercase;
            opacity: 0.5;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Soko Mtaa</h1>
        <p>Marketplace Transaction Receipt</p>
    </div>

    <div class="content">
        <div class="stamp">Verified</div>

        <div class="receipt-info">
            <div>
                <p class="label">Issued To</p>
                <p class="value">{{ $reservation->resident->name }}</p>
                <p style="font-size: 12px; color: #6B7280;">{{ $reservation->resident->phone }}</p>
            </div>
            <div class="right">
                <p class="label">Reservation Code</p>
                <p class="value">{{ $reservation->reservation_code }}</p>
                <p class="label" style="margin-top: 15px;">Date</p>
                <p class="value" style="font-size: 12px;">{{ $reservation->created_at->format('M d, Y H:i') }}</p>
            </div>
        </div>

        <div style="margin-top: 40px; border-top: 1px solid #E5E7EB; padding-top: 40px;">
            <p class="label">Merchant Details</p>
            <p class="value" style="font-size: 14px;">{{ $reservation->trader->business_name }}</p>
            <p style="font-size: 12px; color: #6B7280;">Stall: {{ $reservation->trader->stall->stall_number }} · {{ $reservation->trader->market->name }}</p>
        </div>

        <table class="table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Unit Price</th>
                    <th style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <span style="font-weight: bold;">{{ $reservation->product->name }}</span><br>
                        <span style="font-size: 11px; color: #6B7280;">Category: {{ $reservation->product->category->name }}</span>
                    </td>
                    <td style="text-align: center;">{{ $reservation->quantity }}</td>
                    <td style="text-align: right;">KES {{ number_format($reservation->unit_price, 2) }}</td>
                    <td class="price">KES {{ number_format($reservation->total_amount, 2) }}</td>
                </tr>
            </tbody>
        </table>

        <div class="total-section">
            <div class="total-box">
                <p class="total-label">Total Amount Paid</p>
                <p class="total-value">KES {{ number_format($reservation->total_amount, 2) }}</p>
            </div>
            <p style="font-size: 11px; color: #6B7280; margin-top: 15px;">
                Payment Method: M-PESA<br>
                Transaction ID: {{ $reservation->payment->mpesa_transaction_id ?? 'MPXXXXXXXX' }}
            </p>
        </div>
    </div>

    <div class="footer">
        Thank you for supporting your local market traders.<br>
        This is a computer generated receipt and does not require a signature.
    </div>
</body>
</html>

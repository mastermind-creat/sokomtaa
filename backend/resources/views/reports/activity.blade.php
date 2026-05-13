<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Activity Report - {{ $title }}</title>
    <style>
        @page {
            margin: 2cm;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 12px;
            color: #1A1A1A;
            margin: 0;
            padding: 0;
        }
        .header {
            margin-bottom: 40px;
            border-bottom: 2px solid #1B6B3A;
            padding-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            color: #1B6B3A;
            font-size: 24px;
            text-transform: uppercase;
        }
        .header p {
            margin: 5px 0 0;
            color: #6B7280;
        }
        .summary-grid {
            display: table;
            width: 100%;
            margin-bottom: 40px;
        }
        .summary-item {
            display: table-cell;
            background-color: #F9FAFB;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        .summary-label {
            font-size: 10px;
            text-transform: uppercase;
            color: #6B7280;
            margin-bottom: 5px;
        }
        .summary-value {
            font-size: 18px;
            font-weight: bold;
            color: #1B6B3A;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
        }
        .table th {
            text-align: left;
            padding: 10px;
            background-color: #1B6B3A;
            color: white;
            font-size: 10px;
            text-transform: uppercase;
        }
        .table td {
            padding: 10px;
            border-bottom: 1px solid #E5E7EB;
        }
        .table tr:nth-child(even) {
            background-color: #FDFDFD;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #9CA3AF;
            font-size: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $title }}</h1>
        <p>Generated on {{ now()->format('M d, Y H:i') }} for {{ $user->name }}</p>
    </div>

    <div class="summary-grid">
        <div class="summary-item">
            <p class="summary-label">Total Transactions</p>
            <p class="summary-value">{{ count($data) }}</p>
        </div>
        <div style="width: 20px; display: table-cell;"></div>
        <div class="summary-item">
            <p class="summary-label">Total Volume</p>
            <p class="summary-value">KES {{ number_format(collect($data)->sum('total_amount'), 2) }}</p>
        </div>
    </div>

    <table class="table">
        <thead>
            <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Description</th>
                <th>Entity</th>
                <th style="text-align: right;">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $row)
                <tr>
                    <td>{{ \Carbon\Carbon::parse($row['created_at'])->format('d/m/Y') }}</td>
                    <td style="font-family: monospace;">{{ $row['reference'] }}</td>
                    <td>{{ $row['description'] }}</td>
                    <td>{{ $row['entity'] }}</td>
                    <td style="text-align: right; font-weight: bold;">KES {{ number_format($row['total_amount'], 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Soko Mtaa Digital Marketplace - Empowering Local Trade
    </div>
</body>
</html>

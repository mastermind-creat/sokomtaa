<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        @page { margin: 1.8cm 2cm 1.8cm 2cm; }
        * { box-sizing: border-box; }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 11px;
            color: #1A1A1A;
            margin: 0;
            padding: 0;
            line-height: 1.5;
        }

        /* ── Letterhead ───────────────────────────────── */
        .letterhead { border-bottom: 3px solid #1B6B3A; padding-bottom: 14px; margin-bottom: 18px; }
        .lh-row     { display: table; width: 100%; }
        .lh-left    { display: table-cell; vertical-align: middle; width: 60%; }
        .lh-right   { display: table-cell; vertical-align: middle; text-align: right; width: 40%; }
        .org-name   { font-size: 22px; font-weight: bold; color: #1B6B3A; margin: 0 0 2px; letter-spacing: 1px; }
        .org-sub    { font-size: 8px; text-transform: uppercase; letter-spacing: 2px; color: #6B7280; margin: 0; }
        .official-badge {
            background-color: #F5A623; color: white; font-size: 8px; font-weight: bold;
            text-transform: uppercase; letter-spacing: 1px; padding: 3px 10px;
            border-radius: 20px; display: inline-block; margin-bottom: 5px;
        }
        .meta-text { font-size: 9px; color: #6B7280; margin: 0; line-height: 1.6; }

        /* ── Title Block ──────────────────────────────── */
        .title-block {
            background-color: #FFFBEB; border-left: 5px solid #F5A623;
            padding: 12px 18px; margin-bottom: 18px;
        }
        .title-block h1 {
            font-size: 17px; font-weight: bold; color: #92400E;
            margin: 0 0 4px; text-transform: uppercase;
        }
        .title-block p { font-size: 9px; color: #4B5563; margin: 0; }

        /* ── Section Title ────────────────────────────── */
        .section-title {
            font-size: 9px; font-weight: bold; text-transform: uppercase;
            letter-spacing: 1.5px; color: #6B7280;
            border-bottom: 1px solid #E5E7EB; padding-bottom: 6px;
            margin: 20px 0 10px;
        }

        /* ── KPI Grid ─────────────────────────────────── */
        .kpi-grid   { display: table; width: 100%; margin-bottom: 18px; }
        .kpi-spacer { display: table-cell; width: 10px; }
        .kpi-cell   { display: table-cell; padding: 13px; text-align: center; border: 1px solid #E5E7EB; vertical-align: middle; }
        .kpi-cell.amber { background-color: #F5A623; border-color: #F5A623; }
        .kpi-cell.green { background-color: #1B6B3A; border-color: #1B6B3A; }
        .kpi-label  { font-size: 8px; text-transform: uppercase; letter-spacing: 1px; color: #9CA3AF; margin: 0 0 4px; }
        .kpi-cell.amber .kpi-label { color: #FEF3C7; }
        .kpi-cell.green .kpi-label { color: #A7F3D0; }
        .kpi-value  { font-size: 16px; font-weight: bold; color: #1B6B3A; margin: 0; }
        .kpi-cell.amber .kpi-value { color: #FFFFFF; font-size: 18px; }
        .kpi-cell.green .kpi-value { color: #FFFFFF; font-size: 18px; }
        .kpi-sub    { font-size: 8px; color: #9CA3AF; margin: 3px 0 0; }
        .kpi-cell.amber .kpi-sub { color: #FDE68A; }
        .kpi-cell.green .kpi-sub { color: #6EE7B7; }

        /* ── Two-column grid ──────────────────────────── */
        .two-col { display: table; width: 100%; margin-bottom: 18px; }
        .col-left  { display: table-cell; width: 49%; vertical-align: top; }
        .col-right { display: table-cell; width: 49%; vertical-align: top; }
        .col-gap   { display: table-cell; width: 2%; }

        /* ── Status Breakdown Table ───────────────────── */
        .mini-table { width: 100%; border-collapse: collapse; }
        .mini-table th {
            background-color: #F3F4F6; font-size: 8px; text-transform: uppercase;
            letter-spacing: 0.5px; padding: 6px 8px; text-align: left; color: #6B7280;
        }
        .mini-table th.right { text-align: right; }
        .mini-table td { padding: 6px 8px; border-bottom: 1px solid #F3F4F6; font-size: 10px; }
        .mini-table td.right { text-align: right; font-weight: bold; }
        .mini-table tr:last-child td { border-bottom: none; }

        /* ── Status Badges ────────────────────────────── */
        .badge {
            display: inline-block; font-size: 7.5px; font-weight: bold;
            text-transform: uppercase; padding: 2px 7px; border-radius: 20px;
        }
        .badge-completed { background-color: #D1FAE5; color: #065F46; }
        .badge-paid      { background-color: #DBEAFE; color: #1D4ED8; }
        .badge-ready     { background-color: #EDE9FE; color: #5B21B6; }
        .badge-pending   { background-color: #FEF9C3; color: #854D0E; }
        .badge-cancelled { background-color: #F3F4F6; color: #6B7280; }
        .badge-expired   { background-color: #FEE2E2; color: #991B1B; }

        /* ── Main Data Table ──────────────────────────── */
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 9.5px; }
        .data-table thead tr { background-color: #1B6B3A; }
        .data-table th {
            color: white; font-size: 8px; font-weight: bold; text-transform: uppercase;
            letter-spacing: 0.5px; padding: 7px 8px; text-align: left;
        }
        .data-table th.right { text-align: right; }
        .data-table td { padding: 6px 8px; border-bottom: 1px solid #F3F4F6; vertical-align: middle; }
        .data-table tr:nth-child(even) td { background-color: #FAFAFA; }
        .data-table td.mono { font-family: 'Courier New', monospace; font-size: 8.5px; }
        .data-table td.right { text-align: right; font-weight: bold; }
        .data-table td.muted { color: #9CA3AF; font-size: 9px; }

        /* ── Footer ───────────────────────────────────── */
        .report-footer {
            margin-top: 30px; border-top: 1px solid #E5E7EB; padding-top: 10px;
            display: table; width: 100%;
        }
        .footer-left  { display: table-cell; font-size: 8px; color: #9CA3AF; vertical-align: top; }
        .footer-right { display: table-cell; text-align: right; font-size: 8px; color: #9CA3AF; vertical-align: top; }

        .notice {
            background-color: #FFF7ED; border: 1px solid #FED7AA;
            padding: 7px 12px; margin-bottom: 14px; font-size: 8.5px; color: #9A3412;
        }
    </style>
</head>
<body>

    {{-- ── LETTERHEAD ──────────────────────────────────────────── --}}
    <div class="letterhead">
        <div class="lh-row">
            <div class="lh-left">
                <p class="org-name">SOKO MTAA</p>
                <p class="org-sub">Digital Marketplace Platform &bull; Market Activity Intelligence</p>
            </div>
            <div class="lh-right">
                <div class="official-badge">Market Activity Report</div>
                <p class="meta-text">
                    Generated: {{ now()->format('d M Y, H:i T') }}<br>
                    Prepared by: {{ $user->name }}<br>
                    Role: County Administrator
                </p>
            </div>
        </div>
    </div>

    {{-- ── TITLE BLOCK ─────────────────────────────────────────── --}}
    <div class="title-block">
        <h1>{{ $title }}</h1>
        <p>
            Reporting Period: <strong>{{ $start_date->format('d M Y') }}</strong>
            &mdash; <strong>{{ $end_date->format('d M Y') }}</strong>
            &nbsp;|&nbsp; {{ $start_date->diffInDays($end_date) + 1 }} day(s) covered
        </p>
    </div>

    {{-- ── NOTICE ───────────────────────────────────────────────── --}}
    <div class="notice">
        &#9888;&nbsp; This document is intended for official use by county administration only. Contains live marketplace data.
    </div>

    {{-- ── KPI SUMMARY ─────────────────────────────────────────── --}}
    <p class="section-title">Activity Overview</p>

    @php
        $stats = $extra_stats ?? [];
        $totalRes   = $stats['total_reservations'] ?? count($data);
        $totalVol   = $stats['total_volume'] ?? collect($data)->sum('total_amount');
        $compVol    = $stats['completed_volume'] ?? 0;
        $traders    = $stats['unique_traders'] ?? '–';
        $residents  = $stats['unique_residents'] ?? '–';
        $breakdown  = $stats['status_breakdown'] ?? [];
        $mktBreak   = $stats['market_breakdown'] ?? [];
        $completed  = $breakdown['completed']['count'] ?? 0;
        $paid       = $breakdown['paid']['count'] ?? 0;
        $pending    = $breakdown['pending']['count'] ?? 0;
        $cancelled  = $breakdown['cancelled']['count'] ?? 0;
        $expired    = $breakdown['expired']['count'] ?? 0;
        $active     = $paid + ($breakdown['ready']['count'] ?? 0);
    @endphp

    <div class="kpi-grid">
        <div class="kpi-cell amber">
            <p class="kpi-label">Total Reservations</p>
            <p class="kpi-value">{{ $totalRes }}</p>
            <p class="kpi-sub">Across all markets</p>
        </div>
        <div class="kpi-spacer"></div>
        <div class="kpi-cell green">
            <p class="kpi-label">Completed Orders</p>
            <p class="kpi-value">{{ $completed }}</p>
            <p class="kpi-sub">Picked up by residents</p>
        </div>
        <div class="kpi-spacer"></div>
        <div class="kpi-cell">
            <p class="kpi-label">Total GMV</p>
            <p class="kpi-value">KES {{ number_format($totalVol, 2) }}</p>
            <p class="kpi-sub">Gross Merchandise Value</p>
        </div>
        <div class="kpi-spacer"></div>
        <div class="kpi-cell">
            <p class="kpi-label">Completed GMV</p>
            <p class="kpi-value">KES {{ number_format($compVol, 2) }}</p>
            <p class="kpi-sub">Revenue from closed orders</p>
        </div>
    </div>

    {{-- ── STATUS + MARKET BREAKDOWN ───────────────────────────── --}}
    <p class="section-title">Breakdown Analysis</p>

    <div class="two-col">
        {{-- Status Breakdown --}}
        <div class="col-left">
            <p style="font-size:9px; font-weight:bold; color:#374151; margin:0 0 6px;">Order Status Distribution</p>
            <table class="mini-table">
                <thead>
                    <tr>
                        <th>Status</th>
                        <th class="right">Count</th>
                        <th class="right">Amount (KES)</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($breakdown as $status => $info)
                    <tr>
                        <td><span class="badge badge-{{ strtolower($status) }}">{{ ucfirst($status) }}</span></td>
                        <td class="right">{{ $info['count'] }}</td>
                        <td class="right">{{ number_format($info['amount'], 2) }}</td>
                    </tr>
                    @endforeach
                    @if(empty($breakdown))
                    <tr><td colspan="3" style="color:#9CA3AF; text-align:center; padding:10px;">No data</td></tr>
                    @endif
                </tbody>
            </table>
        </div>

        <div class="col-gap"></div>

        {{-- Market Breakdown --}}
        <div class="col-right">
            <p style="font-size:9px; font-weight:bold; color:#374151; margin:0 0 6px;">Activity by Market</p>
            <table class="mini-table">
                <thead>
                    <tr>
                        <th>Market</th>
                        <th class="right">Orders</th>
                        <th class="right">Volume (KES)</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($mktBreak as $market => $info)
                    <tr>
                        <td>{{ $market }}</td>
                        <td class="right">{{ $info['count'] }}</td>
                        <td class="right">{{ number_format($info['amount'], 2) }}</td>
                    </tr>
                    @endforeach
                    @if(empty($mktBreak))
                    <tr><td colspan="3" style="color:#9CA3AF; text-align:center; padding:10px;">No data</td></tr>
                    @endif
                </tbody>
            </table>
        </div>
    </div>

    {{-- ── PLATFORM HEALTH METRICS ─────────────────────────────── --}}
    <p class="section-title">Platform Health Metrics</p>
    <div class="kpi-grid">
        <div class="kpi-cell">
            <p class="kpi-label">Active Traders</p>
            <p class="kpi-value">{{ $traders }}</p>
            <p class="kpi-sub">With reservations this period</p>
        </div>
        <div class="kpi-spacer"></div>
        <div class="kpi-cell">
            <p class="kpi-label">Unique Customers</p>
            <p class="kpi-value">{{ $residents }}</p>
            <p class="kpi-sub">Residents placing orders</p>
        </div>
        <div class="kpi-spacer"></div>
        <div class="kpi-cell">
            <p class="kpi-label">Cancellation Rate</p>
            <p class="kpi-value">{{ $totalRes > 0 ? round(($cancelled / $totalRes) * 100, 1) : 0 }}%</p>
            <p class="kpi-sub">{{ $cancelled }} cancelled orders</p>
        </div>
        <div class="kpi-spacer"></div>
        <div class="kpi-cell">
            <p class="kpi-label">Completion Rate</p>
            <p class="kpi-value">{{ $totalRes > 0 ? round(($completed / $totalRes) * 100, 1) : 0 }}%</p>
            <p class="kpi-sub">{{ $completed }} fulfilled orders</p>
        </div>
    </div>

    {{-- ── DETAILED RESERVATION LOG ─────────────────────────────── --}}
    <p class="section-title">Detailed Reservation Log</p>

    @if(count($data) > 0)
    <table class="data-table">
        <thead>
            <tr>
                <th>Date</th>
                <th>Ref Code</th>
                <th>Product</th>
                <th>Trader / Market</th>
                <th>Resident</th>
                <th>Category</th>
                <th>Status</th>
                <th class="right">Amount (KES)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $row)
            <tr>
                <td class="muted">{{ \Carbon\Carbon::parse($row['created_at'])->format('d/m/Y') }}</td>
                <td class="mono">{{ $row['reference'] }}</td>
                <td>{{ $row['description'] }}</td>
                <td>{{ $row['entity'] }}<br><span class="muted">{{ $row['market'] ?? '' }}</span></td>
                <td class="muted">{{ $row['resident'] ?? '–' }}</td>
                <td class="muted">{{ $row['category'] ?? '–' }}</td>
                <td><span class="badge badge-{{ strtolower($row['status']) }}">{{ $row['status'] }}</span></td>
                <td class="right">{{ number_format($row['total_amount'], 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    {{-- Grand Total Row --}}
    <table style="width:100%; border-collapse:collapse; margin-top:-10px;">
        <tr>
            <td style="text-align:right; font-size:11px; font-weight:bold; padding:8px 8px; border-top:2px solid #1B6B3A; color:#1B6B3A;">
                GRAND TOTAL (ALL ORDERS): KES {{ number_format(collect($data)->sum('total_amount'), 2) }}
                &nbsp;&nbsp;|&nbsp;&nbsp;
                COMPLETED VALUE: KES {{ number_format($compVol, 2) }}
            </td>
        </tr>
    </table>

    @else
    <p style="text-align:center; color:#9CA3AF; padding:30px; border:1px dashed #E5E7EB;">
        No reservations found for the selected period.
    </p>
    @endif

    {{-- ── FOOTER ───────────────────────────────────────────────── --}}
    <div class="report-footer">
        <div class="footer-left">
            Soko Mtaa Digital Marketplace &bull; Empowering Local Trade<br>
            This report was auto-generated and reflects live marketplace data.
        </div>
        <div class="footer-right">
            Report ID: ACT-{{ strtoupper(substr(md5(now()), 0, 8)) }}<br>
            &copy; {{ now()->year }} County Administration
        </div>
    </div>

</body>
</html>

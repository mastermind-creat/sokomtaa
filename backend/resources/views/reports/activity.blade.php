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
        .letterhead {
            border-bottom: 3px solid #1B6B3A;
            padding-bottom: 14px;
            margin-bottom: 18px;
        }
        .lh-row { display: table; width: 100%; }
        .lh-left { display: table-cell; vertical-align: middle; width: 60%; }
        .lh-right { display: table-cell; vertical-align: middle; text-align: right; width: 40%; }
        .org-name {
            font-size: 22px;
            font-weight: bold;
            color: #1B6B3A;
            margin: 0 0 2px 0;
            letter-spacing: 1px;
        }
        .org-sub {
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #6B7280;
            margin: 0;
        }
        .official-badge {
            background-color: #1B6B3A;
            color: white;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding: 3px 10px;
            border-radius: 20px;
            display: inline-block;
            margin-bottom: 5px;
        }
        .meta-text { font-size: 9px; color: #6B7280; margin: 0; line-height: 1.6; }

        /* ── Title Block ──────────────────────────────── */
        .title-block {
            background-color: #F0FDF4;
            border-left: 5px solid #1B6B3A;
            padding: 12px 18px;
            margin-bottom: 22px;
        }
        .title-block h1 {
            font-size: 17px;
            font-weight: bold;
            color: #1B6B3A;
            margin: 0 0 4px 0;
            text-transform: uppercase;
        }
        .title-block p { font-size: 9px; color: #4B5563; margin: 0; }

        /* ── KPI Grid ─────────────────────────────────── */
        .kpi-grid { display: table; width: 100%; margin-bottom: 22px; }
        .kpi-spacer { display: table-cell; width: 10px; }
        .kpi-cell {
            display: table-cell;
            padding: 14px;
            text-align: center;
            border: 1px solid #E5E7EB;
            vertical-align: middle;
        }
        .kpi-cell.dark {
            background-color: #1B6B3A;
            border-color: #1B6B3A;
        }
        .kpi-label { font-size: 8px; text-transform: uppercase; letter-spacing: 1px; color: #9CA3AF; margin: 0 0 4px; }
        .kpi-cell.dark .kpi-label { color: #A7F3D0; }
        .kpi-value { font-size: 16px; font-weight: bold; color: #1B6B3A; margin: 0; }
        .kpi-cell.dark .kpi-value { color: #FFFFFF; font-size: 18px; }
        .kpi-sub { font-size: 8px; color: #9CA3AF; margin: 3px 0 0; }
        .kpi-cell.dark .kpi-sub { color: #6EE7B7; }

        /* ── Source Breakdown ─────────────────────────── */
        .section-title {
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #6B7280;
            border-bottom: 1px solid #E5E7EB;
            padding-bottom: 6px;
            margin: 20px 0 10px;
        }
        .breakdown-grid { display: table; width: 100%; margin-bottom: 18px; }
        .bd-cell {
            display: table-cell;
            background-color: #F9FAFB;
            border: 1px solid #E5E7EB;
            padding: 12px 14px;
            vertical-align: top;
        }
        .bd-title { font-size: 9px; text-transform: uppercase; color: #6B7280; font-weight: bold; margin: 0 0 4px; }
        .bd-value { font-size: 15px; font-weight: bold; color: #1B6B3A; margin: 0; }
        .bd-sub { font-size: 9px; color: #9CA3AF; margin: 3px 0 0; }
        .bd-spacer { display: table-cell; width: 10px; }

        /* ── Data Table ───────────────────────────────── */
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .data-table thead tr { background-color: #1B6B3A; }
        .data-table th {
            color: white;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 8px 9px;
            text-align: left;
        }
        .data-table th.right { text-align: right; }
        .data-table td {
            padding: 7px 9px;
            border-bottom: 1px solid #F3F4F6;
            font-size: 10px;
            vertical-align: middle;
        }
        .data-table tr:nth-child(even) td { background-color: #FAFAFA; }
        .data-table td.mono { font-family: 'Courier New', monospace; font-size: 9px; }
        .data-table td.right { text-align: right; font-weight: bold; }

        /* ── Badges ───────────────────────────────────── */
        .badge {
            display: inline-block;
            font-size: 7.5px;
            font-weight: bold;
            text-transform: uppercase;
            padding: 2px 7px;
            border-radius: 20px;
        }
        .badge-reservation { background-color: #DBEAFE; color: #1D4ED8; }
        .badge-fee         { background-color: #FEF3C7; color: #92400E; }
        .badge-completed   { background-color: #D1FAE5; color: #065F46; }
        .badge-paid        { background-color: #D1FAE5; color: #065F46; }
        .badge-pending     { background-color: #FEF9C3; color: #854D0E; }
        .badge-failed      { background-color: #FEE2E2; color: #991B1B; }

        /* ── Footer ───────────────────────────────────── */
        .report-footer {
            margin-top: 30px;
            border-top: 1px solid #E5E7EB;
            padding-top: 10px;
            display: table;
            width: 100%;
        }
        .footer-left  { display: table-cell; font-size: 8px; color: #9CA3AF; vertical-align: top; }
        .footer-right { display: table-cell; text-align: right; font-size: 8px; color: #9CA3AF; vertical-align: top; }

        /* ── Confidential Notice ──────────────────────── */
        .notice {
            background-color: #FFF7ED;
            border: 1px solid #FED7AA;
            padding: 7px 12px;
            margin-bottom: 14px;
            font-size: 8.5px;
            color: #9A3412;
        }
    </style>
</head>
<body>

    {{-- ── LETTERHEAD ──────────────────────────────────────────── --}}
    <div class="letterhead">
        <div class="lh-row">
            <div class="lh-left">
                <p class="org-name">SOKO MTAA</p>
                <p class="org-sub">Digital Marketplace Platform &bull; County Administration System</p>
            </div>
            <div class="lh-right">
                <div class="official-badge">Official County Document</div>
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

    {{-- ── CONFIDENTIAL NOTICE ─────────────────────────────────── --}}
    <div class="notice">
        &#9888;&nbsp; This document is intended for official use by county administration only.
        Unauthorised distribution is prohibited.
    </div>

    {{-- ── KPI SUMMARY ─────────────────────────────────────────── --}}
    <p class="section-title">Executive Summary</p>

    <div class="kpi-grid">
        <div class="kpi-cell dark">
            <p class="kpi-label">Total Revenue</p>
            <p class="kpi-value">KES {{ number_format($extra_stats['total_revenue'] ?? collect($data)->sum('total_amount'), 2) }}</p>
            <p class="kpi-sub">All revenue streams</p>
        </div>
        <div class="kpi-spacer"></div>
        <div class="kpi-cell">
            <p class="kpi-label">Reservation Revenue</p>
            <p class="kpi-value">KES {{ number_format($extra_stats['reservation_revenue'] ?? 0, 2) }}</p>
            <p class="kpi-sub">{{ $extra_stats['reservation_count'] ?? 0 }} transactions</p>
        </div>
        <div class="kpi-spacer"></div>
        <div class="kpi-cell">
            <p class="kpi-label">Market Fee Revenue</p>
            <p class="kpi-value">KES {{ number_format($extra_stats['fee_revenue'] ?? 0, 2) }}</p>
            <p class="kpi-sub">{{ $extra_stats['fee_count'] ?? 0 }} fee records</p>
        </div>
        <div class="kpi-spacer"></div>
        <div class="kpi-cell">
            <p class="kpi-label">Total Transactions</p>
            <p class="kpi-value">{{ $extra_stats['grand_count'] ?? count($data) }}</p>
            <p class="kpi-sub">Across all sources</p>
        </div>
    </div>

    {{-- ── REVENUE SOURCE BREAKDOWN ─────────────────────────────── --}}
    @if(!empty($extra_stats))
    <p class="section-title">Revenue Source Breakdown</p>
    <div class="breakdown-grid">
        <div class="bd-cell">
            <p class="bd-title">Marketplace Reservations (M-Pesa)</p>
            <p class="bd-value">KES {{ number_format($extra_stats['reservation_revenue'] ?? 0, 2) }}</p>
            <p class="bd-sub">{{ $extra_stats['reservation_count'] ?? 0 }} completed payments from residents</p>
        </div>
        <div class="bd-spacer"></div>
        <div class="bd-cell">
            <p class="bd-title">County Market Fees</p>
            <p class="bd-value">KES {{ number_format($extra_stats['fee_revenue'] ?? 0, 2) }}</p>
            <p class="bd-sub">{{ $extra_stats['fee_count'] ?? 0 }} traders paid their stall fees</p>
        </div>
        <div class="bd-spacer"></div>
        @php
            $total = $extra_stats['total_revenue'] ?? 0;
            $resPct = $total > 0 ? round(($extra_stats['reservation_revenue'] ?? 0) / $total * 100, 1) : 0;
            $feePct = $total > 0 ? round(($extra_stats['fee_revenue'] ?? 0) / $total * 100, 1) : 0;
        @endphp
        <div class="bd-cell">
            <p class="bd-title">Split</p>
            <p class="bd-value">{{ $resPct }}% / {{ $feePct }}%</p>
            <p class="bd-sub">Reservations vs Market Fees</p>
        </div>
    </div>
    @endif

    {{-- ── TRANSACTION LOG ──────────────────────────────────────── --}}
    <p class="section-title">Detailed Transaction Log</p>

    @if(count($data) > 0)
    <table class="data-table">
        <thead>
            <tr>
                <th>Date &amp; Time</th>
                <th>Reference</th>
                <th>Description</th>
                <th>Entity</th>
                <th>Source</th>
                <th>Status</th>
                <th class="right">Amount (KES)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $row)
            <tr>
                <td>{{ \Carbon\Carbon::parse($row['created_at'])->format('d/m/Y H:i') }}</td>
                <td class="mono">{{ $row['reference'] }}</td>
                <td>{{ $row['description'] }}</td>
                <td>{{ $row['entity'] }}</td>
                <td>
                    @if(($row['source'] ?? '') === 'Market Fee')
                        <span class="badge badge-fee">Fee</span>
                    @else
                        <span class="badge badge-reservation">Reserv.</span>
                    @endif
                </td>
                <td>
                    @php $s = strtolower($row['status'] ?? ''); @endphp
                    <span class="badge badge-{{ $s }}">{{ $row['status'] }}</span>
                </td>
                <td class="right">{{ number_format($row['total_amount'], 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    {{-- Running Total --}}
    <table style="width:100%; border-collapse: collapse; margin-top: -10px;">
        <tr>
            <td style="text-align:right; font-size:11px; font-weight:bold; padding: 8px 9px; border-top: 2px solid #1B6B3A; color:#1B6B3A;">
                GRAND TOTAL: KES {{ number_format(collect($data)->sum('total_amount'), 2) }}
            </td>
        </tr>
    </table>

    @else
    <p style="text-align:center; color:#9CA3AF; padding: 30px; border: 1px dashed #E5E7EB;">
        No transactions found for the selected period.
    </p>
    @endif

    {{-- ── FOOTER ───────────────────────────────────────────────── --}}
    <div class="report-footer">
        <div class="footer-left">
            Soko Mtaa Digital Marketplace &bull; Empowering Local Trade<br>
            This report was auto-generated and reflects live system data.
        </div>
        <div class="footer-right">
            Report ID: RPT-{{ strtoupper(substr(md5(now()), 0, 8)) }}<br>
            &copy; {{ now()->year }} County Administration
        </div>
    </div>

</body>
</html>

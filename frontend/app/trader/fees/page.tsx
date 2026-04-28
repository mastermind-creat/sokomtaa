'use client';

import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    AlertCircle, CheckCircle2, Clock, CreditCard,
    Download, ChevronRight, Loader2, Receipt
} from 'lucide-react';
import api from '@/lib/api';
import { ApiResponse } from '@/types';

import { useUIStore } from '@/store/uiStore';
import { useTranslation } from '@/hooks/useTranslation';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FeeSummary {
    unpaid_count: number;
    unpaid_amount: number;
    paid_amount: number;
    last_payment: string | null;
}

interface MarketFee {
    id: number;
    period: string;   // "2025-01"
    amount: string;
    status: 'unpaid' | 'paid' | 'waived';
    due_date: string;
    paid_at: string | null;
    payment?: { mpesa_transaction_id: string | null };
}

function formatPeriod(period: string): string {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });
}

const FEE_STATUS = {
    unpaid: { label: 'Unpaid',  color: 'text-red-700',   bg: 'bg-red-50',   border: 'border-red-200',  icon: <AlertCircle className="w-3.5 h-3.5" /> },
    paid:   { label: 'Paid',    color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    waived: { label: 'Waived',  color: 'text-gray-600',  bg: 'bg-gray-50',  border: 'border-gray-200',  icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
};

// ─── Summary Card ─────────────────────────────────────────────────────────────

function FeeSummaryCard({ summary, onPay, isPaying }: {
    summary: FeeSummary;
    onPay: () => void;
    isPaying: boolean;
}) {
    const hasUnpaid = summary.unpaid_count > 0;

    return (
        <div className={`rounded-3xl p-6 ${hasUnpaid ? 'bg-red-600' : 'bg-primary'} text-white`}>
            <div className="flex items-start justify-between mb-6">
                <div>
                    <p className="text-sm font-semibold opacity-80 mb-1">
                        {hasUnpaid ? 'Amount Due' : 'All Paid'}
                    </p>
                    <p className="text-4xl font-black tracking-tight">
                        KES {summary.unpaid_amount.toLocaleString()}
                    </p>
                    {summary.unpaid_count > 0 && (
                        <p className="text-sm font-medium opacity-80 mt-1">
                            {summary.unpaid_count} unpaid period{summary.unpaid_count > 1 ? 's' : ''}
                        </p>
                    )}
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/10 rounded-2xl p-3">
                    <p className="text-xs opacity-70 mb-1">Paid This Year</p>
                    <p className="text-lg font-black">KES {summary.paid_amount.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-3">
                    <p className="text-xs opacity-70 mb-1">Last Payment</p>
                    <p className="text-sm font-bold">
                        {summary.last_payment
                            ? new Date(summary.last_payment).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
                            : '—'}
                    </p>
                </div>
            </div>

            {hasUnpaid && (
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={onPay}
                    disabled={isPaying}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-white text-red-600 rounded-2xl font-black text-base min-h-[56px] hover:bg-red-50 transition-colors disabled:opacity-60"
                >
                    {isPaying ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                    ) : (
                        <><CreditCard className="w-5 h-5" /> Pay KES {summary.unpaid_amount.toLocaleString()} via M-Pesa</>
                    )}
                </motion.button>
            )}

            {!hasUnpaid && (
                <div className="flex items-center justify-center gap-2 py-3 bg-white/10 rounded-2xl">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-bold">All market fees are paid ✓</span>
                </div>
            )}
        </div>
    );
}

// ─── Fee Row ─────────────────────────────────────────────────────────────────

function FeeRow({ fee, onPay, isPaying }: { fee: MarketFee; onPay: (id: number) => void; isPaying: boolean }) {
    const cfg = FEE_STATUS[fee.status];
    return (
        <div className="flex items-center gap-4 py-4 border-b border-gray-50 last:border-0">
            <div className="flex-1 min-w-0">
                <p className="font-bold text-text-primary text-sm">{formatPeriod(fee.period)}</p>
                <p className="text-xs text-text-secondary mt-0.5">
                    Due: {new Date(fee.due_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                    {fee.paid_at ? ` · Paid ${new Date(fee.paid_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}` : ''}
                </p>
                {fee.payment?.mpesa_transaction_id && (
                    <p className="text-[10px] font-mono text-text-muted mt-1">{fee.payment.mpesa_transaction_id}</p>
                )}
            </div>

            <div className="text-right shrink-0">
                <p className="font-black text-text-primary">KES {parseFloat(fee.amount).toFixed(0)}</p>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                    {cfg.icon} {cfg.label}
                </span>
            </div>

            {fee.status === 'paid' && (
                <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors shrink-0">
                    <Receipt className="w-4 h-4 text-text-secondary" />
                </button>
            )}
            {fee.status === 'unpaid' && (
                <button
                    onClick={() => onPay(fee.id)}
                    disabled={isPaying}
                    className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 shrink-0 min-h-[36px]"
                >
                    Pay
                </button>
            )}
        </div>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TraderFeesPage() {
    const { setPageTitle } = useUIStore();
    const [isPaying, setIsPaying] = React.useState(false);

    React.useEffect(() => {
        setPageTitle('Market Fees');
    }, [setPageTitle]);

    const { data: summary, isLoading: summaryLoading } = useQuery({
        queryKey: ['trader-fee-summary'],
        queryFn: async () => {
            const res = await api.get<never, ApiResponse<FeeSummary>>('/fees/summary');
            return res.data;
        },
    });

    const { data: feesData, isLoading: feesLoading } = useQuery({
        queryKey: ['trader-fees'],
        queryFn: async () => {
            const res = await api.get<never, ApiResponse<{ data: MarketFee[] }>>('/fees');
            return res.data;
        },
    });

    const fees: MarketFee[] = Array.isArray(feesData) ? feesData : (feesData as any)?.data ?? [];

    const handlePayAll = async () => {
        setIsPaying(true);
        try {
            await api.post('/payments/mpesa/stkpush', {
                type: 'market_fee',
                amount: summary?.unpaid_amount,
            });
        } finally {
            setIsPaying(false);
        }
    };

    const handlePaySingle = async (feeId: number) => {
        setIsPaying(true);
        try {
            await api.post('/payments/mpesa/stkpush', { type: 'market_fee', fee_id: feeId });
        } finally {
            setIsPaying(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                <h1 className="text-2xl font-black text-text-primary tracking-tight">Market Fees</h1>

                {/* Summary Card */}
                {summaryLoading ? (
                    <div className="h-64 bg-gray-200 rounded-3xl animate-pulse" />
                ) : summary ? (
                    <FeeSummaryCard summary={summary} onPay={handlePayAll} isPaying={isPaying} />
                ) : null}

                {/* Fee History */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">Payment History</h2>
                    </div>

                    {feesLoading ? (
                        <div className="p-5 space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-4 animate-pulse">
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-32 bg-gray-200 rounded" />
                                        <div className="h-3 w-24 bg-gray-100 rounded" />
                                    </div>
                                    <div className="h-8 w-20 bg-gray-200 rounded-xl" />
                                </div>
                            ))}
                        </div>
                    ) : fees.length === 0 ? (
                        <div className="text-center py-12 text-text-secondary">
                            <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-medium">No fee records yet</p>
                        </div>
                    ) : (
                        <div className="px-5">
                            {fees.map(fee => (
                                <FeeRow key={fee.id} fee={fee} onPay={handlePaySingle} isPaying={isPaying} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
    );
}

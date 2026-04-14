'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
    Wallet, 
    TrendingUp, 
    CreditCard, 
    Calendar, 
    ArrowRight,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    Filter,
    Search,
    ShoppingBag,
    FileText
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { motion } from 'framer-motion';
import { ApiResponse } from '@/types';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    ResponsiveContainer, 
    Tooltip,
    Cell
} from 'recharts';

interface Payment {
    id: number;
    amount: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    type: 'reservation' | 'market_fee';
    mpesa_transaction_id?: string;
    phone_number: string;
    paid_at: string;
    reservation?: {
        reservation_code: string;
        product?: { name: string };
    };
    created_at: string;
}

interface PaymentSummary {
    total_spent_this_year: number;
    transaction_count: number;
}

export default function ResidentPaymentsPage() {
    const router = useRouter();

    const { data: paymentsData, isLoading: isPaymentsLoading } = useQuery<ApiResponse<{ data: Payment[] }>>({
        queryKey: ['payments-history'],
        queryFn: () => api.get('/resident/payments'),
    });

    const { data: summaryData, isLoading: isSummaryLoading } = useQuery<ApiResponse<PaymentSummary>>({
        queryKey: ['payments-summary'],
        queryFn: () => api.get('/resident/payments/summary'),
    });

    const payments = paymentsData?.data?.data || [];
    const summary = summaryData?.data;

    // Mock data for the spending chart based on actual payments
    const chartData = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyTotals = new Array(12).fill(0);
        
        payments.forEach(p => {
            if (p.status === 'completed' && p.paid_at) {
                const date = new Date(p.paid_at);
                monthlyTotals[date.getMonth()] += parseFloat(p.amount);
            }
        });

        return months.map((name, i) => ({
            name,
            total: monthlyTotals[i]
        })).filter(m => m.total > 0 || i <= new Date().getMonth());
    }, [payments]);

    return (
        <DashboardLayout title="Miamala & Malipo (Payments)">
            <div className="space-y-6 pb-20">
                
                {/* 1. Wallet Card */}
                <div className="bg-green-950 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24" />
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-200 mb-1">Annual Spending (2025)</p>
                            <h2 className="text-4xl font-black font-mono tracking-tighter">
                                KES {summary?.total_spent_this_year.toLocaleString() || '0'}
                            </h2>
                        </div>
                        <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <Wallet size={28} />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                            <p className="text-[8px] font-black uppercase tracking-widest text-brand-100">Transactions</p>
                            <p className="text-sm font-black">{summary?.transaction_count || 0}</p>
                        </div>
                        <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                            <p className="text-[8px] font-black uppercase tracking-widest text-brand-100">Market Status</p>
                            <p className="text-sm font-black">Verified</p>
                        </div>
                    </div>
                </div>

                {/* 2. Spending Trends Chart */}
                <div className="bg-white p-6 rounded-[3.5rem] border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="text-brand-600" size={18} />
                            <h3 className="text-xs font-black uppercase tracking-widest text-green-950">Spending Trends</h3>
                        </div>
                        <select className="text-[10px] font-black uppercase tracking-tight bg-neutral-50 px-3 py-1.5 rounded-lg border-none outline-none">
                            <option>Monthly</option>
                            <option>Yearly</option>
                        </select>
                    </div>
                    <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#9CA3AF' }}
                                    dy={10}
                                />
                                <Tooltip 
                                    cursor={{ fill: '#F9FAFB' }}
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="total" radius={[8, 8, 8, 8]}>
                                    {chartData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={index === chartData.length - 1 ? '#1ea34d' : '#E5E7EB'} 
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Transaction History */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-green-950">Historia ya Malipo</h3>
                        <button className="text-[10px] font-black text-brand-600 uppercase tracking-widest flex items-center gap-1">
                            <Filter size={14} /> Filter
                        </button>
                    </div>

                    <div className="space-y-3">
                        {isPaymentsLoading ? (
                            <div className="py-12 flex justify-center">
                                <Loader2 className="animate-spin text-brand-600" />
                            </div>
                        ) : payments.length > 0 ? (
                            payments.map((payment) => (
                                <motion.div 
                                    key={payment.id}
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-brand-sm flex items-center justify-between group active:scale-[0.98] transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                                            payment.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                                        }`}>
                                            {payment.type === 'reservation' ? <ShoppingBag size={24} /> : <FileText size={24} />}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-green-950 text-sm leading-tight">
                                                {payment.reservation?.product?.name || 'Reservation Payment'}
                                            </h4>
                                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-tight flex items-center gap-1 mt-0.5">
                                                <Calendar size={10} />
                                                {new Date(payment.paid_at || payment.created_at).toLocaleDateString()} • {payment.mpesa_transaction_id || 'Pending'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-green-950 font-mono">
                                            KES {parseFloat(payment.amount).toLocaleString()}
                                        </p>
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${
                                            payment.status === 'completed' ? 'text-green-600' : 'text-amber-600'
                                        }`}>
                                            {payment.status}
                                        </span>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="py-20 text-center space-y-4 opacity-40">
                                <CreditCard size={48} className="mx-auto" />
                                <p className="text-xs font-black uppercase tracking-widest">Hujafanya malipo yoyote bado</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. M-Pesa Security Tip Wrapper */}
                <div className="bg-blue-50 p-8 rounded-[3rem] border border-blue-100 flex gap-6 items-start">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-600 shrink-0">
                        <CreditCard size={24} />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-sm font-black text-blue-950 uppercase tracking-tight">Security Tip</h4>
                        <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                            Daima hakikisha jina la mpokeaji ni <strong>Soko Mtaa Limited</strong> unapo fanya malipo ya M-Pesa STK Push. Kamwe usitoe PIN yako kwa mtu yeyote.
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

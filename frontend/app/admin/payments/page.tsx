'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    Filter, 
    Download, 
    ArrowUpRight, 
    Copy, 
    CheckCircle2, 
    XCircle, 
    Clock,
    CreditCard,
    DollarSign,
    Repeat,
    Phone,
    ArrowRight,
    ChevronRight,
    SearchX,
    FileText
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

export default function AdminPaymentsPage() {
    const { setPageTitle } = useUIStore();
    const [activeTab, setActiveTab] = useState<'fees' | 'reservations'>('fees');
    const [searchQuery, setSearchQuery] = useState('');

    React.useEffect(() => {
        setPageTitle('Financial Registry');
    }, [setPageTitle]);

    const { data: paymentsDataRaw, isLoading } = useQuery({
        queryKey: ['admin-payments', activeTab],
        queryFn: () => api.get('/admin/payments', { params: { type: activeTab } }).catch(() => ({ data: [] })),
    });

    // Fallback data for demonstration
    const payments = (paymentsDataRaw as any)?.data || (activeTab === 'fees' ? [
        { id: 1, ref: 'TXN-001', mpesa_id: 'QWE123RTY', trader_name: 'Mama Wanjiru', stall: 'A1', period: 'Jan 2025', amount: 1500, paid_at: '2025-01-14T09:30:00Z', status: 'completed' },
        { id: 2, ref: 'TXN-002', mpesa_id: 'ASD456FGH', trader_name: 'Tech Safi Store', stall: 'B4', period: 'Jan 2025', amount: 3000, paid_at: '2025-01-15T11:20:00Z', status: 'completed' },
        { id: 3, ref: 'TXN-003', mpesa_id: 'PENDING_ID', trader_name: 'Amani Drapery', stall: 'C12', period: 'Jan 2025', amount: 1200, paid_at: '2025-01-16T08:45:00Z', status: 'pending' }
    ] : [
        { id: 101, ref: 'RES-K7B', code: '#K7B', resident: 'John Doe', trader: 'Mama Wanjiru', product: 'Sukuma Wiki', amount: 150, paid_at: '2025-01-14T14:10:00Z', status: 'completed', mpesa_id: 'ZXC789VBN' }
    ]);

    const stats = [
        { label: 'Volume', value: `KES ${payments.reduce((acc: number, p: any) => acc + Number(p.amount), 0).toLocaleString()}`, color: 'text-brand-600', icon: CreditCard },
        { label: 'Efficiency', value: '94%', color: 'text-blue-600', icon: Repeat },
        { label: 'Pending', value: payments.filter((p: any) => p.status === 'pending').length, color: 'text-orange-600', icon: Clock },
    ];

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-50 text-green-700 border-green-100';
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'failed': return 'bg-red-50 text-red-700 border-red-100';
            case 'refunded': return 'bg-gray-50 text-gray-700 border-gray-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    return (
        <div className="pb-32 -mx-4 md:-mx-0">
            {/* ── Liquidity Matrix (3-col Mobile) ── */}
            <div className="grid grid-cols-3 gap-2 px-4 mb-6">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
                        <span className={cn("text-[8px] font-black uppercase tracking-widest mb-1", s.color)}>{s.label}</span>
                        <div className="text-sm font-black text-green-950 tracking-tight text-center truncate w-full">
                            {isLoading ? '...' : s.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Tab Selector (Scrollable) ── */}
            <div className="px-4 mb-6">
                <div className="flex gap-2 p-1 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto no-scrollbar">
                    {[
                        { id: 'fees', label: 'Market Levies' },
                        { id: 'reservations', label: 'Escrow Items' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex-1 px-4 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                activeTab === tab.id 
                                    ? 'bg-gray-950 text-white shadow-xl' 
                                    : 'text-text-muted hover:bg-gray-50'
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Fiscal Search ── */}
            <div className="px-4 mb-8">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-600" size={18} />
                    <input 
                        type="text"
                        placeholder="Search MPesa ID or Trader..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50"
                    />
                </div>
            </div>

            {/* ── Transaction Cards ── */}
            <div className="space-y-4 px-4">
                {isLoading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-100 rounded-[2.5rem] animate-pulse" />)
                ) : payments.length === 0 ? (
                    <div className="py-20 text-center opacity-40">
                        <SearchX size={48} className="mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">No transactions logged</p>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {payments.map((txn: any) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={txn.id}
                                className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-950 text-white rounded-2xl flex items-center justify-center">
                                                <DollarSign size={24} className="text-brand-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-green-950 uppercase tracking-tight">
                                                    {activeTab === 'fees' ? txn.trader_name : txn.resident}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="font-mono text-[9px] font-black text-text-muted uppercase tracking-tighter">
                                                        {txn.mpesa_id}
                                                    </span>
                                                    <button className="text-brand-600 active:scale-90 transition-all">
                                                        <Copy size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                            getStatusStyles(txn.status)
                                        )}>
                                            {txn.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100/50">
                                            <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1 leading-none">Purpose</p>
                                            <p className="text-[10px] font-black text-green-950 truncate">
                                                {activeTab === 'fees' ? `${txn.period} Levy` : txn.product}
                                            </p>
                                        </div>
                                        <div className="bg-brand-50/30 p-3 rounded-2xl border border-brand-100/30">
                                            <p className="text-[8px] font-black text-brand-700 uppercase tracking-widest mb-1 leading-none">Amount</p>
                                            <p className="text-xs font-black text-green-950">
                                                KES {txn.amount.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button className="flex-1 h-11 bg-gray-50 text-text-secondary rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                                            <FileText size={14} /> Audit Trail
                                        </button>
                                        {txn.status === 'completed' && activeTab === 'reservations' && (
                                            <button className="flex-1 h-11 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                                                <Repeat size={14} /> Refund
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-gray-50/80 px-6 py-3 flex justify-between items-center border-t border-gray-100">
                                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest italic">
                                        Settled {new Date(txn.paid_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <div className="flex items-center gap-1 text-brand-600">
                                        <span className="text-[9px] font-black uppercase tracking-widest">Verify Ledger</span>
                                        <ChevronRight size={14} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* ── Global Fiscal Actions ── */}
            <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-3">
                <button className="w-14 h-14 bg-white text-gray-950 rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all border-4 border-gray-50">
                    <Download size={24} />
                </button>
                <button className="w-14 h-14 bg-brand-600 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all border-4 border-white">
                    <Filter size={24} />
                </button>
            </div>
        </div>
    );
}

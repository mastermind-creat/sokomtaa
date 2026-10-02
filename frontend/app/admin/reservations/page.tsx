'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    ShoppingBag,
    Clock,
    CheckCircle2,
    AlertCircle,
    User,
    Store,
    ArrowRight,
    Package,
    ChevronRight,
    Zap,
    Activity,
    ShieldCheck,
    CreditCard,
    MoreHorizontal,
    RefreshCcw
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminReservationsPage() {
    const { setPageTitle } = useUIStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    React.useEffect(() => {
        setPageTitle('Commercial Ledger');
    }, [setPageTitle]);

    const { data: reservationsRaw, isLoading } = useQuery({
        queryKey: ['admin-reservations', statusFilter],
        queryFn: () => api.get('/admin/reservations', { params: { status: statusFilter } }).then(res => res.data),
    });

    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ['admin-reservations-stats'],
        queryFn: () => api.get('/admin/reservations/stats').then(res => res.data.data),
    });

    const reservations = (reservationsRaw as any)?.data || [];

    const stats = [
        {
            label: 'Active Rev',
            value: `KES ${(Number(statsData?.active_rev || 0) / 1000).toFixed(1)}K`,
            color: 'text-brand-600',
            icon: Activity
        },
        {
            label: 'Pickup Ready',
            value: `${statsData?.pickup_ready || 0} Orders`,
            color: 'text-orange-600',
            icon: Package
        },
        {
            label: 'Integrity',
            value: `${statsData?.integrity || 100}%`,
            color: 'text-blue-600',
            icon: ShieldCheck
        },
    ];

    const [isPropagating, setIsPropagating] = useState(false);
    const handlePropagateReport = async () => {
        setIsPropagating(true);
        try {
            await api.post('/admin/reservations/propagate-report');
            alert('Revenue report propagated successfully to all stakeholders!');
        } catch (error) {
            console.error('Propagation failed', error);
        } finally {
            setIsPropagating(false);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'ready': return 'bg-orange-50 text-orange-700 border-orange-100 shadow-orange-500/10';
            case 'completed': return 'bg-green-50 text-green-700 border-green-100 shadow-green-500/10';
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-100 shadow-amber-500/10';
            case 'paid': return 'bg-blue-50 text-blue-700 border-blue-100 shadow-blue-500/10';
            case 'cancelled':
            case 'expired': return 'bg-red-50 text-red-700 border-red-100 shadow-red-500/10';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    return (
        <div className="pb-40 -mx-4 md:-mx-0 font-sans">
            {/* ── Fulfillment Vitality Matrix ── */}
            <div className="grid grid-cols-3 gap-2 px-4 mb-8">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
                        <div className={cn("mb-2 p-1.5 rounded-lg bg-gray-50", s.color)}>
                            <s.icon size={14} />
                        </div>
                        <span className={cn("text-[8px] font-black uppercase tracking-widest mb-1", s.color)}>{s.label}</span>
                        <div className="text-xs font-black text-green-950 tracking-tight leading-none uppercase">
                            {isLoading ? '...' : s.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Commercial Status Triage ── */}
            <div className="px-4 mb-6">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {['all', 'pending', 'paid', 'ready', 'completed', 'expired'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setStatusFilter(tab)}
                            className={cn(
                                "flex-shrink-0 px-6 h-11 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95",
                                statusFilter === tab
                                    ? 'bg-green-950 text-white shadow-xl shadow-green-950/20'
                                    : 'bg-white text-text-muted border border-gray-100'
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Strategic Search Hub ── */}
            <div className="px-4 mb-10">
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search order code or commercial entity..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-14 pl-14 pr-6 bg-white border border-gray-100 rounded-[2rem] text-sm font-bold shadow-sm outline-none focus:border-brand-300 focus:ring-8 focus:ring-brand-50/50 transition-all placeholder:text-slate-300"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                        <button className="p-2.5 bg-gray-50 text-slate-400 rounded-xl hover:text-green-950 active:scale-90 transition-all">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Transaction diagnostic Hub ── */}
            <div className="space-y-6 px-4">
                {isLoading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-44 bg-gray-50 rounded-[2.5rem] animate-pulse" />)
                ) : (
                    <AnimatePresence mode="popLayout">
                        {reservations.map((res: any) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                key={res.id}
                                className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden group active:scale-[0.98] transition-all"
                            >
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 shadow-inner">
                                                <ShoppingBag size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-mono text-sm font-black text-green-950 tracking-tighter leading-none mb-1">
                                                    #{res.reservation_code}
                                                </h4>
                                                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest italic">Commercial Pulse</p>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border shadow-sm",
                                            getStatusStyles(res.status)
                                        )}>
                                            {res.status}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-5 items-center gap-2 mb-6">
                                        <div className="col-span-2 space-y-1">
                                            <span className="text-[8px] font-black text-text-muted uppercase tracking-widest block">Resident</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                                    <User size={10} />
                                                </div>
                                                <span className="text-xs font-black text-green-950 truncate tracking-tight">{res.resident?.name || res.resident}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-center opacity-20">
                                            <ArrowRight size={14} className="text-green-950" />
                                        </div>
                                        <div className="col-span-2 space-y-1 text-right">
                                            <span className="text-[8px] font-black text-text-muted uppercase tracking-widest block">Trader Entity</span>
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-xs font-black text-green-950 truncate tracking-tight">{res.trader?.business_name || res.trader}</span>
                                                <div className="w-5 h-5 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                                                    <Store size={10} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Commercial Integrity & Maturity ── */}
                                    <div className="bg-gray-50/50 p-5 rounded-3xl border border-gray-100 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm text-brand-600">
                                                    <Package size={14} />
                                                </div>
                                                <div>
                                                    <h5 className="text-[10px] font-black text-green-950 uppercase tracking-tight">{res.product?.name || res.product}</h5>
                                                    <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider italic">Qty: {res.quantity} UNITS</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-black text-green-950 tracking-tight">KES {Number(res.total_amount || res.amount).toLocaleString()}</span>
                                                <div className="flex items-center justify-end gap-1 text-[8px] font-black text-brand-600 uppercase mt-0.5">
                                                    <CreditCard size={8} /> Confirmed
                                                </div>
                                            </div>
                                        </div>

                                        {/* Fulfillment Maturity Bar */}
                                        <div className="space-y-1.5 pt-1">
                                            <div className="flex justify-between text-[8px] font-black text-text-muted uppercase tracking-widest">
                                                <span>Fulfillment Maturity</span>
                                                <span className="text-orange-600">68% Time Expired</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-gray-100 shadow-inner">
                                                <div className="h-full w-[68%] bg-orange-400 rounded-full shadow-lg shadow-orange-500/20" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex bg-white h-14 border-t border-gray-50">
                                    <button className="flex-1 flex items-center justify-center gap-3 bg-green-950 text-white font-black text-[10px] uppercase tracking-widest active:bg-black transition-all">
                                        <Zap size={14} className="text-brand-400" /> Audit Transaction
                                    </button>
                                    <button className="w-14 border-l border-gray-50 flex items-center justify-center text-text-muted hover:text-green-950 active:bg-gray-50 transition-all">
                                        <MoreHorizontal size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* ── Sticky Operational Command Strip ── */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 flex gap-3 z-50 items-center justify-between max-w-7xl mx-auto md:left-auto md:w-[calc(100%-16rem)]">
                <button
                    onClick={handlePropagateReport}
                    disabled={isPropagating}
                    className={cn(
                        "flex-1 h-16 bg-green-950 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 active:scale-[0.98] transition-all shadow-2xl shadow-green-950/40 relative overflow-hidden group",
                        isPropagating && "opacity-80 cursor-wait"
                    )}
                >
                    {isPropagating ? (
                        <>
                            <RefreshCcw className="animate-spin text-brand-400" size={20} />
                            Propagating Intelligence...
                        </>
                    ) : (
                        <>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            Propagate Revenue Report
                            <div className="w-8 h-8 bg-brand-400 rounded-full flex items-center justify-center text-green-950">
                                <ChevronRight size={20} />
                            </div>
                        </>
                    )}
                </button>
                <button className="h-16 w-16 bg-white border-2 border-gray-100 text-green-950 rounded-[2rem] flex items-center justify-center active:scale-90 transition-all shadow-lg hover:border-brand-300">
                    <Filter size={24} />
                </button>
            </div>
        </div>
    );
}

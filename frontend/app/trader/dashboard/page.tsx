'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    TrendingUp, 
    Plus, 
    QrCode,
    Clock,
    Store,
    Package,
    Activity,
    ChevronRight,
    Zap,
    MoreHorizontal,
    Phone,
    CheckCircle2,
    AlertTriangle,
    BarChart3,
    Search,
    Bell,
    Loader2
} from 'lucide-react';
import api from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function TraderDashboard() {
    const { setPageTitle } = useUIStore();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    const [processingId, setProcessingId] = React.useState<number | null>(null);

    React.useEffect(() => {
        setPageTitle('Commercial Cockpit');
    }, [setPageTitle]);

    const handleFulfillment = (id: number) => {
        setProcessingId(id);
        setTimeout(() => setProcessingId(null), 2000);
    };

    const { data: statsRaw, isLoading: statsLoading } = useQuery({
        queryKey: ['trader-stats'],
        queryFn: () => api.get('/trader/stats').catch(() => ({ data: {} })),
    });
    const statsData = (statsRaw as any)?.data || {};

    const { data: recentReservationsRaw, isLoading: resLoading } = useQuery({
        queryKey: ['recent-reservations'],
        queryFn: () => api.get('/trader/reservations/recent').catch(() => ({ data: [] })),
    });
    const reservations = (recentReservationsRaw as any)?.data || [];

    const profitabilityStats = [
        { label: 'Growth', value: statsData?.growth || '+12%', color: 'text-brand-600', icon: TrendingUp },
        { label: 'Demand', value: '84%', color: 'text-blue-600', icon: Activity },
        { label: 'Trust', value: '4.8', color: 'text-amber-600', icon: Zap },
    ];

    const hasOverdueFees = statsData?.has_overdue_fees || false;
    const isPendingVerification = user?.role === 'trader' && !user?.phone_verified;

    return (
        <div className="pb-40 -mx-4 md:-mx-0 font-sans">
            <AnimatePresence>
                {(hasOverdueFees || isPendingVerification) && (
                    <div className="px-4 mb-6 space-y-3">
                        {hasOverdueFees && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-rose-50 border border-rose-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm"
                            >
                                <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white shrink-0">
                                    <AlertTriangle size={20} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-rose-950 font-black text-xs uppercase tracking-tight">Market Fee Overdue</h4>
                                    <p className="text-rose-700 text-[10px] font-bold">Please settle your arrears to avoid penalties.</p>
                                </div>
                                <Link href="/trader/fees" className="px-4 py-2 bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">Pay Now</Link>
                            </motion.div>
                        )}
                        {isPendingVerification && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-amber-50 border border-amber-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm"
                            >
                                <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center text-white shrink-0">
                                    <Clock size={20} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-amber-950 font-black text-xs uppercase tracking-tight">Access Restricted</h4>
                                    <p className="text-amber-700 text-[10px] font-bold">Document verification in progress...</p>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-3 gap-2 px-4 mb-8">
                {profitabilityStats.map((s, i) => (
                    <div key={i} className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
                        <div className={cn("mb-2 p-1.5 rounded-lg bg-gray-50", s.color)}>
                            <s.icon size={14} />
                        </div>
                        <span className={cn("text-[8px] font-black uppercase tracking-widest mb-1", s.color)}>{s.label}</span>
                        <div className="text-xs font-black text-green-950 tracking-tight leading-none uppercase">
                            {statsLoading ? '...' : s.value}
                        </div>
                    </div>
                ))}
            </div>

            <div className="px-4 mb-10">
                <div className="bg-green-950 rounded-[2.5rem] p-6 text-white relative overflow-hidden shadow-2xl shadow-green-900/30">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-400 mb-1">Fiscal Status</p>
                            <h2 className="text-2xl font-black tracking-tight leading-none mb-4 uppercase">
                                KES {Number(statsData?.total_revenue || 12840).toLocaleString()}
                            </h2>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Market Live & Active</span>
                            </div>
                        </div>
                        <Link href="/trader/analytics" className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-brand-400 border border-white/10 active:scale-95 transition-all">
                            <BarChart3 size={24} />
                        </Link>
                    </div>
                </div>
            </div>

            <div className="px-4">
                <div className="flex items-center justify-between mb-6 px-2">
                    <h3 className="text-xs font-black text-green-950 uppercase tracking-[0.15em]">Pending Fulfillment</h3>
                    <Link href="/trader/reservations" className="text-[10px] font-black text-brand-600 uppercase tracking-widest flex items-center gap-1.5">
                        Audit Ledger <ChevronRight size={14} />
                    </Link>
                </div>

                <div className="space-y-4">
                    {resLoading ? (
                        [1,2].map(i => <div key={i} className="h-44 bg-gray-50 rounded-[2.5rem] animate-pulse" />)
                    ) : reservations.length === 0 ? (
                        <div className="py-20 text-center bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-100">
                            <Package size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-xs font-black text-text-muted uppercase tracking-widest">Inventory is stationary.</p>
                        </div>
                    ) : (
                        reservations.map((res: any) => (
                            <div key={res.id} className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden group">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-brand-600 shadow-inner">
                                                <Store size={28} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-widest">Pending</span>
                                                    <span className="text-[8px] font-black text-text-muted uppercase tracking-widest">#{res.reservation_code}</span>
                                                </div>
                                                <h4 className="text-base font-black text-green-950 uppercase tracking-tight truncate max-w-[140px]">
                                                    {res.product?.name || 'Bulk Produce'}
                                                </h4>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-green-950 leading-none mb-1">x{res.quantity}</p>
                                            <p className="text-[10px] font-black text-brand-600 uppercase">KES {Number(res.total_amount).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 mb-6">
                                        <div className="flex justify-between text-[8px] font-black text-text-muted uppercase tracking-widest">
                                            <span>Preparation Velocity</span>
                                            <span className="text-brand-600">Optimal (1h 12m)</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                            <div className="h-full w-[45%] bg-brand-500 rounded-full shadow-lg shadow-brand-500/20" />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button 
                                           onClick={() => handleFulfillment(res.id)}
                                           disabled={processingId === res.id}
                                           className="flex-1 h-14 bg-gray-950 text-white rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-gray-950/20 disabled:opacity-70"
                                        >
                                            {processingId === res.id ? (
                                                <Loader2 size={16} className="animate-spin text-brand-400" />
                                            ) : (
                                                <CheckCircle2 size={16} className="text-brand-400" />
                                            )}
                                            {processingId === res.id ? 'Processing...' : 'Order Ready'}
                                        </button>
                                        <button className="w-14 h-14 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-text-muted active:text-green-950 active:scale-95 transition-all shadow-sm">
                                            <Phone size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 flex gap-3 z-50">
                <Link href="/trader/products/add" className="flex-1 h-16 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-2xl shadow-brand-600/30">
                    <Plus size={20} /> Deploy Inventory
                </Link>
                <button className="h-16 w-16 bg-gray-950 text-white rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-2xl shadow-gray-950/20">
                    <QrCode size={28} />
                </button>
            </div>
        </div>
    );
}

'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    TrendingUp, 
    CreditCard, 
    AlertTriangle, 
    ArrowUpRight, 
    ArrowDownLeft, 
    Search,
    Download,
    Settings,
    MoreHorizontal,
    Bell,
    Wallet,
    Calendar,
    Filter,
    Activity,
    DollarSign,
    ShieldCheck,
    ChevronRight,
    ArrowRightCircle,
    Store
} from 'lucide-react';
import api from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function AdminFeesPage() {
    const { setPageTitle } = useUIStore();

    React.useEffect(() => {
        setPageTitle('Fiscal Intelligence');
    }, [setPageTitle]);

    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'audit' | 'delinquents' | 'rates'>('audit');
    const [searchQuery, setSearchQuery] = useState('');

    const { data: statsDataRaw, isLoading: statsLoading } = useQuery({
        queryKey: ['admin-fee-stats'],
        queryFn: () => api.get('/admin/fees/stats').catch(() => ({ data: {} })),
    });
    const statsData = (statsDataRaw as any)?.data || {};

    const { data: delinquentsRaw, isLoading: delinquentsLoading } = useQuery({
        queryKey: ['admin-delinquents'],
        queryFn: () => api.get('/admin/fees/delinquents').catch(() => ({ data: [] })),
    });
    const delinquents = (delinquentsRaw as any)?.data || [];

    const { data: transactionsDataRaw, isLoading: transactionsLoading } = useQuery({
        queryKey: ['admin-transactions'],
        queryFn: () => api.get('/admin/fees/transactions').catch(() => ({ data: { data: [] } })),
    });
    const transactions = (transactionsDataRaw as any)?.data?.data || [];

    const stats = [
        { label: 'Collected', value: `KES ${Number(statsData?.total_collected || 42500).toLocaleString()}`, color: 'text-brand-600', icon: TrendingUp },
        { label: 'Efficiency', value: `${statsData?.collection_rate || 94}%`, color: 'text-blue-600', icon: ShieldCheck },
        { label: 'Arrears', value: statsData?.delinquent_count || '12', color: 'text-red-600', icon: AlertTriangle },
    ];

    return (
        <div className="pb-40 -mx-4 md:-mx-0 font-sans">
            {/* ── Revenue Vitality Matrix ── */}
            <div className="grid grid-cols-3 gap-2 px-4 mb-8">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
                        <div className={cn("mb-2 p-1.5 rounded-lg bg-gray-50", s.color)}>
                            <s.icon size={14} />
                        </div>
                        <span className={cn("text-[8px] font-black uppercase tracking-widest mb-1", s.color)}>{s.label}</span>
                        <div className="text-[10px] font-black text-green-950 tracking-tight leading-none uppercase">
                            {statsLoading ? '...' : s.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Fiscal Tab Switcher ── */}
            <div className="px-4 mb-6">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {[
                        { id: 'audit', label: 'Fiscal Audit' },
                        { id: 'delinquents', label: 'Debt Triage' },
                        { id: 'rates', label: 'Levy Schema' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex-shrink-0 px-6 h-11 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95",
                                activeTab === tab.id 
                                    ? 'bg-green-950 text-white shadow-xl shadow-green-950/20' 
                                    : 'bg-white text-text-muted border border-gray-100'
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Integrated Search Hub ── */}
            <div className="px-4 mb-10">
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text"
                        placeholder="Search fiscal patterns or entities..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-14 pl-14 pr-6 bg-white border border-gray-100 rounded-[2rem] text-sm font-bold shadow-sm outline-none focus:border-brand-300 focus:ring-8 focus:ring-brand-50/50 transition-all placeholder:text-slate-300"
                    />
                </div>
            </div>

            {/* ── Fiscal diagnostic Content ── */}
            <div className="px-4">
                <AnimatePresence mode="wait">
                    {activeTab === 'audit' && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-4"
                        >
                            {transactionsLoading ? (
                                [1,2,3].map(i => <div key={i} className="h-28 bg-gray-50 rounded-[2.5rem] animate-pulse" />)
                            ) : transactions.length === 0 ? (
                                <div className="py-20 text-center opacity-40">
                                    <Activity size={48} className="mx-auto mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">No commercial activity recorded.</p>
                                </div>
                            ) : (
                                transactions.map((tx: any) => (
                                    <div key={tx.id} className="bg-white p-5 rounded-[2.5rem] border border-gray-50 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                                                tx.type === 'credit' ? 'bg-brand-50 text-brand-600' : 'bg-rose-50 text-rose-600'
                                            )}>
                                                {tx.type === 'credit' ? <ArrowDownLeft size={22} /> : <ArrowUpRight size={22} />}
                                            </div>
                                            <div className="max-w-[160px]">
                                                <h4 className="text-xs font-black text-green-950 uppercase truncate tracking-tight">
                                                    {tx.wallet?.trader?.business_name || 'System Level'}
                                                </h4>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="text-[8px] font-black text-white px-1.5 py-0.5 rounded bg-slate-900 uppercase tracking-widest">{tx.status || 'Verified'}</span>
                                                    <p className="text-[9px] font-bold text-text-muted line-clamp-1 italic">{tx.description || 'Manual Levy Collection'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn(
                                                "text-sm font-black tracking-tight leading-none mb-1",
                                                tx.type === 'credit' ? 'text-brand-600' : 'text-rose-700'
                                            )}>
                                                {tx.type === 'credit' ? '+' : '-'} {Number(tx.amount).toLocaleString()}
                                            </p>
                                            <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em]">KES CURRENCY</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'delinquents' && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-6"
                        >
                            {delinquentsLoading ? (
                                [1,2,3].map(i => <div key={i} className="h-44 bg-gray-50 rounded-[2.5rem] animate-pulse" />)
                            ) : delinquents.length === 0 ? (
                                <div className="py-20 text-center bg-brand-50/30 rounded-[3rem] border border-dashed border-brand-200">
                                    <ShieldCheck className="mx-auto text-brand-400 mb-6" size={48} />
                                    <h3 className="text-lg font-black text-brand-950 uppercase tracking-tight leading-none mb-2">Total Fiscal Integrity</h3>
                                    <p className="text-[10px] font-black text-brand-700 uppercase tracking-widest">All merchants are compliant.</p>
                                </div>
                            ) : (
                                delinquents.map((trader: any) => (
                                    <div key={trader.id} className="bg-white p-8 rounded-[2.5rem] border border-rose-50 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4">
                                            <div className="bg-rose-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse shadow-lg shadow-rose-500/20">
                                                Enforcement Required
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-5 mb-8">
                                            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-[1.5rem] flex items-center justify-center shadow-inner">
                                                <Store size={32} />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black text-green-950 uppercase tracking-tight leading-none mb-1.5">{trader.business_name}</h4>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                                                    <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest">ARREARS: KES {Number(trader.debt || 4500).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Debt Aging Strip */}
                                        <div className="space-y-2 mb-8">
                                            <div className="flex justify-between text-[9px] font-black text-text-muted uppercase tracking-widest">
                                                <span>Debt Maturation</span>
                                                <span className="text-rose-600">42 Days Past Due</span>
                                            </div>
                                            <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                                <div className="h-full w-[85%] bg-rose-500 rounded-full shadow-lg shadow-rose-500/20" />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button className="flex-1 h-14 bg-gray-950 text-white rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-gray-950/20">
                                                <Bell size={16} className="text-brand-400" /> Dispatch SMS Warning
                                            </button>
                                            <button className="w-14 h-14 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-text-muted hover:text-green-950 active:scale-95 transition-all">
                                                <MoreHorizontal size={24} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Sticky Fiscal Command Strip ── */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 flex gap-3 z-50">
                <button className="flex-1 h-14 bg-gray-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-2xl shadow-gray-950/20">
                    Propagate Fiscal Audit <ArrowRightCircle size={18} className="text-brand-400" />
                </button>
                <button className="h-14 w-14 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center active:scale-95 transition-all">
                    <Download size={24} />
                </button>
            </div>
        </div>
    );
}

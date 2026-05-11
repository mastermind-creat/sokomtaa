'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    TrendingUp,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownLeft,
    Search,
    Download,
    MoreHorizontal,
    Bell,
    Activity,
    ShieldCheck,
    ArrowRightCircle,
    Store,
    Settings,
    Edit2,
    Globe,
    Zap
} from 'lucide-react';
import api from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ApiResponse, MarketFee, Market } from '@/types';

export default function AdminFeesPage() {
    const { setPageTitle } = useUIStore();

React.useEffect(() => {
    setPageTitle('Fiscal Intelligence');
}, [setPageTitle]);

const queryClient = useQueryClient();
const [activeTab, setActiveTab] = useState<'audit' | 'delinquents' | 'rates'>('audit');
const [searchQuery, setSearchQuery] = useState('');
const [editingMarket, setEditingMarket] = useState<Market | null>(null);
const [newFeeValue, setNewFeeValue] = useState<string>('');
const [newDailyFee, setNewDailyFee] = useState<string>('');
const [newWeeklyFee, setNewWeeklyFee] = useState<string>('');
const [isMarketFeeEnabled, setIsMarketFeeEnabled] = useState<boolean>(true);

const { data: statsData, isLoading: statsLoading } = useQuery<{ total_collected: number; collection_rate: number; delinquent_count: number }>({
    queryKey: ['admin-fee-stats'],
    queryFn: () => api.get('/admin/fees/stats').then((res: any) => res.data),
});

const { data: delinquents = [], isLoading: delinquentsLoading } = useQuery<MarketFee[]>({
    queryKey: ['admin-delinquents'],
    queryFn: () => api.get('/admin/fees/delinquents').then((res: any) => res.data),
});

const { data: transactions = [], isLoading: transactionsLoading } = useQuery<MarketFee[]>({
    queryKey: ['admin-transactions'],
    queryFn: () => api.get('/admin/fees/transactions').then((res: any) => res.data),
});

React.useEffect(() => {
    if (editingMarket) {
        setNewFeeValue(editingMarket.default_monthly_fee?.toString() || '');
        setNewDailyFee(editingMarket.default_daily_fee?.toString() || '');
        setNewWeeklyFee(editingMarket.default_weekly_fee?.toString() || '');
        setIsMarketFeeEnabled(editingMarket.is_fee_enabled);
    }
}, [editingMarket]);

const { data: markets = [], isLoading: marketsLoading } = useQuery<Market[]>({
    queryKey: ['admin-markets-rates'],
    queryFn: () => api.get('/admin/markets').then((res: any) => res.data),
    enabled: activeTab === 'rates'
});

const updateFeeMutation = useMutation({
    mutationFn: async (data: { marketId: number; fee?: number; daily_fee?: number; weekly_fee?: number; is_fee_enabled?: boolean }) => {
        return api.post('/admin/fees/update-rate', {
            type: 'market',
            target_id: data.marketId,
            monthly_fee: data.fee,
            daily_fee: data.daily_fee,
            weekly_fee: data.weekly_fee,
            is_fee_enabled: data.is_fee_enabled
        });
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-markets-rates'] });
        toast.success('Ada imesasishwa. (Fees updated.)');
        setEditingMarket(null);
    }
});

const propagateFeesMutation = useMutation({
    mutationFn: async () => {
        // We'll iterate through all markets and sync fees
        // Alternatively, create a single backend endpoint for global sync
        return api.post('/admin/stalls/bulk-update-fees', { all: true });
    },
    onSuccess: (res: any) => {
        toast.success(res.data.message || 'Fiscal audit propagated successfully.');
    },
    onError: () => {
        toast.error('Failed to propagate fiscal audit.');
    }
});
const updateGlobalRateMutation = useMutation({
    mutationFn: async (data: { monthly_fee?: number; daily_fee?: number; weekly_fee?: number; is_fee_enabled?: boolean }) => {
        return api.post('/admin/fees/update-global-rate', data);
    },
    onSuccess: (res: any) => {
        toast.success(res.message || 'Global rate updated successfully');
        queryClient.invalidateQueries({ queryKey: ['admin-markets-rates'] });
        queryClient.invalidateQueries({ queryKey: ['admin-fee-stats'] });
    },
    onError: () => {
        toast.error('Failed to update global rate');
    }
});

const [globalRate, setGlobalRate] = useState<string>('');
const [globalDailyRate, setGlobalDailyRate] = useState<string>('');
const [globalWeeklyRate, setGlobalWeeklyRate] = useState<string>('');
const [isGlobalFeeEnabled, setIsGlobalFeeEnabled] = useState<boolean>(true);
const [isUpdatingGlobal, setIsUpdatingGlobal] = useState(false);

const handleUpdateGlobal = () => {
    setIsUpdatingGlobal(true);
    updateGlobalRateMutation.mutate({
        monthly_fee: globalRate ? parseFloat(globalRate) : undefined,
        daily_fee: globalDailyRate ? parseFloat(globalDailyRate) : undefined,
        weekly_fee: globalWeeklyRate ? parseFloat(globalWeeklyRate) : undefined,
        is_fee_enabled: isGlobalFeeEnabled
    }, {
        onSettled: () => setIsUpdatingGlobal(false)
    });
};
const stats = [
    { label: 'Collected', value: `KES ${Number(statsData?.total_collected || 0).toLocaleString()}`, color: 'text-brand-600', icon: TrendingUp },
    { label: 'Efficiency', value: `${statsData?.collection_rate || 0}%`, color: 'text-blue-600', icon: ShieldCheck },
    { label: 'Arrears', value: statsData?.delinquent_count || '0', color: 'text-red-600', icon: AlertTriangle },
];

return (
    <div className="pb-40 -mx-4 md:-mx-0 font-sans">
        {/* ── Fiscal Header & Quick Actions ── */}
        <div className="flex items-center justify-between px-4 mb-8">
            <div>
                <h1 className="text-2xl font-black text-green-950 uppercase tracking-tighter">Fiscal Intel</h1>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">County Revenue Oversight</p>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={() => propagateFeesMutation.mutate()}
                    disabled={propagateFeesMutation.isPending}
                    className="h-10 px-3 bg-green-950 text-white rounded-xl font-black text-[8px] uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-green-950/20 disabled:opacity-50"
                >
                    {propagateFeesMutation.isPending ? 'Syncing...' : 'Propagate Audit'}
                    <ArrowRightCircle size={12} className="text-brand-400" />
                </button>
                <button className="h-10 w-10 bg-white border border-gray-100 text-text-muted rounded-xl flex items-center justify-center active:scale-95 transition-all">
                    <Download size={18} />
                </button>
            </div>
        </div>

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
                            [1, 2, 3].map(i => <div key={i} className="h-28 bg-gray-50 rounded-[2.5rem] animate-pulse" />)
                        ) : transactions.filter((tx: any) =>
                            tx.wallet?.trader?.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            tx.description?.toLowerCase().includes(searchQuery.toLowerCase())
                        ).length === 0 ? (
                            <div className="py-20 text-center opacity-40">
                                <Activity size={48} className="mx-auto mb-4" />
                                <p className="text-xs font-black uppercase tracking-widest">No matching results for "{searchQuery}"</p>
                            </div>
                        ) : (
                            transactions.filter((tx: any) =>
                                tx.wallet?.trader?.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                tx.description?.toLowerCase().includes(searchQuery.toLowerCase())
                            ).map((tx: any) => (
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
                            [1, 2, 3].map(i => <div key={i} className="h-44 bg-gray-50 rounded-[2.5rem] animate-pulse" />)
                        ) : delinquents.filter((trader: any) =>
                            trader.business_name?.toLowerCase().includes(searchQuery.toLowerCase())
                        ).length === 0 ? (
                            <div className="py-20 text-center opacity-40">
                                <ShieldCheck size={48} className="mx-auto mb-4" />
                                <p className="text-xs font-black uppercase tracking-widest">No delinquent matches found.</p>
                            </div>
                        ) : (
                            delinquents.filter((trader: any) =>
                                trader.business_name?.toLowerCase().includes(searchQuery.toLowerCase())
                            ).map((trader: any) => (
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

                {activeTab === 'rates' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-6"
                    >
                        {/* ── Global Control Hub ── */}
                        <div className="bg-gray-950 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Globe size={120} />
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
                                        <Zap size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black uppercase tracking-tight">Global Fiscal Control</h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unified County-Wide Rate Management</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Collected</p>
                                        <p className="text-xl font-black text-brand-400">KES {statsData?.total_collected.toLocaleString() || '0'}</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Efficiency</p>
                                        <p className="text-xl font-black text-blue-400">{statsData?.collection_rate || '0'}%</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-white/5 p-6 rounded-3xl border border-white/10">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Monthly (KES)</label>
                                        <input
                                            type="number"
                                            value={globalRate}
                                            onChange={(e) => setGlobalRate(e.target.value)}
                                            placeholder="Monthly"
                                            className="w-full bg-white/10 border border-white/10 h-14 px-4 rounded-xl font-black text-sm text-white placeholder:text-gray-600 outline-none focus:border-brand-500/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Weekly (KES)</label>
                                        <input
                                            type="number"
                                            value={globalWeeklyRate}
                                            onChange={(e) => setGlobalWeeklyRate(e.target.value)}
                                            placeholder="Weekly"
                                            className="w-full bg-white/10 border border-white/10 h-14 px-4 rounded-xl font-black text-sm text-white placeholder:text-gray-600 outline-none focus:border-brand-500/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Daily (KES)</label>
                                        <input
                                            type="number"
                                            value={globalDailyRate}
                                            onChange={(e) => setGlobalDailyRate(e.target.value)}
                                            placeholder="Daily"
                                            className="w-full bg-white/10 border border-white/10 h-14 px-4 rounded-xl font-black text-sm text-white placeholder:text-gray-600 outline-none focus:border-brand-500/50 transition-all"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Fee Status</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setIsGlobalFeeEnabled(!isGlobalFeeEnabled)}
                                                className={cn(
                                                    "flex-1 h-14 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border",
                                                    isGlobalFeeEnabled ? "bg-brand-500 border-brand-400 text-white" : "bg-white/5 border-white/10 text-gray-500"
                                                )}
                                            >
                                                {isGlobalFeeEnabled ? 'Enabled' : 'Disabled'}
                                            </button>
                                            <button
                                                onClick={handleUpdateGlobal}
                                                disabled={isUpdatingGlobal}
                                                className="w-14 h-14 bg-white text-gray-950 rounded-xl flex items-center justify-center transition-all shadow-xl active:scale-95 disabled:opacity-50"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Markets Rates List ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {marketsLoading ? (
                                Array(4).fill(0).map((_, i) => (
                                    <div key={i} className="h-24 bg-white border border-gray-100 rounded-3xl animate-pulse" />
                                ))
                            ) : (
                                markets.map((market) => (
                                    <div key={market.id} className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm flex items-center justify-between group hover:border-brand-200 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-green-50 text-green-700 rounded-2xl flex items-center justify-center font-black text-sm uppercase">
                                                {market.name.substring(0, 2)}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-green-950 uppercase tracking-tight text-sm">{market.name}</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        market.is_fee_enabled ? "bg-green-500" : "bg-gray-300"
                                                    )} />
                                                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">
                                                        M: {market.default_monthly_fee} • W: {market.default_weekly_fee} • D: {market.default_daily_fee}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setEditingMarket(market)}
                                            className="w-10 h-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-50 hover:text-brand-600"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
                        </AnimatePresence>
                    </div>

            {/* ── Fee Configuration Modal ── */}
                <Dialog open={!!editingMarket} onOpenChange={(open) => !open && setEditingMarket(null)}>
                    <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
                        <div className="bg-brand-600 p-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Settings size={80} />
                            </div>
                            <DialogHeader className="relative z-10">
                                <DialogTitle className="text-2xl font-black uppercase tracking-tighter mb-1">Set Market Fee</DialogTitle>
                                <DialogDescription className="text-white/70 text-[10px] font-black uppercase tracking-widest leading-none">
                                    {editingMarket?.name} • {editingMarket?.county}
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        <div className="p-8 space-y-4 bg-white">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Monthly Rate (KES)</label>
                                    <div className="relative group">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 font-black text-sm">KES</span>
                                        <Input
                                            type="number"
                                            value={newFeeValue}
                                            onChange={(e) => setNewFeeValue(e.target.value)}
                                            placeholder="Monthly"
                                            className="h-14 pl-14 pr-6 bg-gray-50 border-gray-100 rounded-2xl text-md font-black text-green-950 focus:bg-white focus:ring-8 focus:ring-brand-50 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Weekly Rate (KES)</label>
                                    <div className="relative group">
                                        <Input
                                            type="number"
                                            value={newWeeklyFee}
                                            onChange={(e) => setNewWeeklyFee(e.target.value)}
                                            placeholder="Weekly"
                                            className="h-14 px-6 bg-gray-50 border-gray-100 rounded-2xl text-md font-black text-green-950 focus:bg-white focus:ring-8 focus:ring-brand-50 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Daily Rate (KES)</label>
                                    <div className="relative group">
                                        <Input
                                            type="number"
                                            value={newDailyFee}
                                            onChange={(e) => setNewDailyFee(e.target.value)}
                                            placeholder="Daily"
                                            className="h-14 px-6 bg-gray-50 border-gray-100 rounded-2xl text-md font-black text-green-950 focus:bg-white focus:ring-8 focus:ring-brand-50 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Enable Market Fees</span>
                                    <button
                                        onClick={() => setIsMarketFeeEnabled(!isMarketFeeEnabled)}
                                        className={cn(
                                            "w-12 h-6 rounded-full transition-all relative",
                                            isMarketFeeEnabled ? "bg-brand-500" : "bg-gray-200"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                                            isMarketFeeEnabled ? "left-7" : "left-1"
                                        )} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setEditingMarket(null)}
                                    className="flex-1 h-14 rounded-2xl border-gray-100 font-black text-[10px] uppercase tracking-widest active:scale-95"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => {
                                        if (editingMarket) {
                                            updateFeeMutation.mutate({
                                                marketId: editingMarket.id,
                                                fee: newFeeValue ? parseFloat(newFeeValue) : undefined,
                                                daily_fee: newDailyFee ? parseFloat(newDailyFee) : undefined,
                                                weekly_fee: newWeeklyFee ? parseFloat(newWeeklyFee) : undefined,
                                                is_fee_enabled: isMarketFeeEnabled
                                            });
                                        }
                                    }}
                                    disabled={updateFeeMutation.isPending}
                                    className="flex-[2] h-14 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-600/20 active:scale-95"
                                >
                                    {updateFeeMutation.isPending ? 'Updating...' : 'Save Configuration'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

        </div>
        );
}

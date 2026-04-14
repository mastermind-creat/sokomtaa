'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    TrendingUp, 
    Users, 
    CreditCard, 
    AlertTriangle, 
    ArrowUpRight, 
    ArrowDownLeft, 
    Search,
    Filter,
    Download,
    Settings,
    LayoutGrid,
    List,
    MoreHorizontal,
    RefreshCcw,
    Wallet
} from 'lucide-react';
import api from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';
import { useUIStore } from '@/store/uiStore';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    Tabs, 
    TabsContent, 
    TabsList, 
    TabsTrigger 
} from "@/components/ui/tabs";

export default function AdminFeesPage() {
    const { t } = useTranslation();
    const { setPageTitle } = useUIStore();

    React.useEffect(() => {
        setPageTitle('Kituo cha Mapato (Revenue Hub)');
    }, [setPageTitle]);

    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

    // Fetch Stats
    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ['admin-fee-stats'],
        queryFn: () => api.get('/admin/fees/stats').then(res => res.data.data),
    });

    // Fetch Delinquents
    const { data: delinquents, isLoading: delinquentsLoading } = useQuery({
        queryKey: ['admin-delinquents'],
        queryFn: () => api.get('/admin/fees/delinquents').then(res => res.data.data),
    });

    // Fetch Transactions
    const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
        queryKey: ['admin-transactions'],
        queryFn: () => api.get('/admin/fees/transactions').then(res => res.data.data),
    });

    const stats = [
        { label: 'Mapato Yaliyokusanywa', value: `KES ${Number(statsData?.total_collected || 0).toLocaleString()}`, sub: `Lengo: KES ${Number(statsData?.total_target || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-brand-600', bg: 'bg-brand-50' },
        { label: 'Kiwango cha Ukusanyaji', value: `${statsData?.collection_rate || 0}%`, sub: 'Collection Efficiency', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Wafanyabiashara Sugu', value: statsData?.delinquent_count || 0, sub: 'Overdue > 14 Days', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
        { label: 'Jumla ya Salio (Float)', value: `KES ${Number(statsData?.wallet_float || 0).toLocaleString()}`, sub: 'Across All Trader Wallets', icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    return (
        <div className="bg-transparent space-y-8 max-w-7xl mx-auto w-full pb-20 px-4 pt-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-end gap-6">
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest hover:border-brand-300 transition-all">
                        <Download size={16} /> Export CSV
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-green-950 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-green-900/20 active:scale-95 transition-all">
                        <Settings size={16} /> Fee Config
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm"
                    >
                        <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
                            <stat.icon size={24} />
                        </div>
                        <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">{stat.label}</h4>
                        <p className="text-2xl font-black text-green-950 tracking-tight">{statsLoading ? <Skeleton className="h-8 w-24" /> : stat.value}</p>
                        <p className="text-[10px] font-bold text-text-secondary mt-1">{stat.sub}</p>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="transactions" className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <TabsList className="bg-gray-100/50 p-1 rounded-2xl border border-gray-200 w-fit">
                        <TabsTrigger value="transactions" className="rounded-xl px-6 py-2.5 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            Audit Log
                        </TabsTrigger>
                        <TabsTrigger value="delinquents" className="rounded-xl px-6 py-2.5 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            Delinquents
                        </TabsTrigger>
                        <TabsTrigger value="markets" className="rounded-xl px-6 py-2.5 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            Market Rates
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="text"
                                placeholder="Tafuta mfanyabiashara..."
                                className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none w-64"
                            />
                        </div>
                        <button className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-brand-600 transition-all">
                             <Filter size={20} />
                        </button>
                    </div>
                </div>

                <TabsContent value="transactions" className="mt-0">
                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Date / Time</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Trader</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Type</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Description</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">Reference</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {transactionsLoading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i}><td colSpan={6} className="px-6 py-4"><Skeleton className="h-12 w-full rouned-xl" /></td></tr>
                                        ))
                                    ) : transactionsData?.data?.map((tx: any) => (
                                        <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-black text-green-950">{format(new Date(tx.created_at), 'dd MMM yyyy')}</p>
                                                <p className="text-[10px] font-bold text-text-muted mt-0.5">{format(new Date(tx.created_at), 'HH:mm')}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-black text-green-950">{tx.wallet?.trader?.business_name}</p>
                                                <p className="text-[10px] font-bold text-brand-600 mt-0.5">{tx.wallet?.trader?.user?.phone}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${
                                                    tx.type === 'credit' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                                }`}>
                                                    {tx.type === 'credit' ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                                                    <span className="text-[9px] font-black uppercase tracking-wider">{tx.type}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-xs">
                                                <p className="text-xs font-medium text-text-secondary truncate">{tx.description}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest opacity-60">{tx.reference_type}</span>
                                                    <span className="text-[11px] font-black text-green-900 tracking-tight">{tx.reference_id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className={`text-sm font-black tracking-tight ${tx.type === 'credit' ? 'text-green-600' : 'text-red-700'}`}>
                                                    {tx.type === 'credit' ? '+' : '-'} {Number(tx.amount).toLocaleString()}
                                                </p>
                                                <p className="text-[9px] font-bold text-text-muted uppercase">KES</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="delinquents" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {delinquentsLoading ? (
                             Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-64 rounded-[32px]" />
                            ))
                        ) : delinquents?.length > 0 ? (
                            delinquents.map((trader: any) => (
                                <div key={trader.id} className="bg-white p-6 rounded-[32px] border border-red-100 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-3">
                                        <div className="bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-100 italic">
                                            Overdue 14+ Days
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-text-muted group-hover:bg-red-50 group-hover:text-red-500 transition-all">
                                            <AlertTriangle size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-green-950 tracking-tight">{trader.business_name}</h4>
                                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Stall: {trader.stall?.stall_number} • {trader.market?.name}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4 mb-8">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-text-secondary">Deni la Ada (Balance Due)</span>
                                            <span className="font-black text-red-600 tracking-tight text-lg">KES 450</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-red-500 w-[85%]" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-brand-500 transition-all">
                                            <RefreshCcw size={12} /> Notify
                                        </button>
                                        <button className="flex items-center justify-center gap-2 py-3 bg-red-50 text-red-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all">
                                            Revoke Stall
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200 text-center">
                                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-sm font-bold text-text-secondary">Hongera! Hakuna mdeni kwa sasa.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

'use client';

import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, TraderDashboardStats, RevenueTrend } from '@/types';
import { 
    ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
    TrendingUp, Package, DollarSign, 
    RefreshCcw, Download, Target, ChevronRight,
    Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

interface PriceInsight {
    id: number;
    name: string;
    price: string | number;
    market_average: number;
    difference_percent: number;
    sentiment: 'high' | 'low' | 'competitive';
}

export default function TraderAnalyticsPage() {
    const { t } = useTranslation();
    const { setPageTitle } = useUIStore();

    React.useEffect(() => {
        setPageTitle('Commercial IQ');
    }, [setPageTitle]);

    const [isMounted, setIsMounted] = React.useState(false);
    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['trader-stats'],
        queryFn: async () => (await api.get<never, ApiResponse<TraderDashboardStats>>('/trader/analytics/stats')).data
    });

    const { data: revenueData, isLoading: revenueLoading } = useQuery({
        queryKey: ['trader-revenue'],
        queryFn: async () => (await api.get<never, ApiResponse<RevenueTrend[]>>('/trader/analytics/revenue')).data
    });

    const { data: priceInsights, isLoading: pricingLoading } = useQuery({
        queryKey: ['trader-price-insights'],
        queryFn: async () => (await api.get<never, ApiResponse<{ market_id: number; insights: PriceInsight[] }>>('/trader/analytics/price-insights')).data
    });

    const matrixStats = [
        { label: 'Sales (24h)', value: `KES ${stats?.total_revenue?.toLocaleString() || '0'}`, color: 'text-brand-600', icon: DollarSign },
        { label: 'Orders', value: stats?.completed_reservations || '0', color: 'text-blue-600', icon: Package },
        { label: 'Pulse', value: '4.8 ★', color: 'text-amber-600', icon: Star },
    ];

    return (
        <div className="pb-32 -mx-4 md:-mx-0 font-sans">
            {/* ── Commercial Vitality Matrix (3-col) ── */}
            <div className="grid grid-cols-3 gap-2 px-4 mb-6">
                {matrixStats.map((s, i) => (
                    <div key={i} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                        <span className={cn("text-[8px] font-black uppercase tracking-widest mb-1", s.color)}>{s.label}</span>
                        <div className="text-xs font-black text-green-950 tracking-tight leading-none truncate w-full">
                            {statsLoading ? '...' : s.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── High-Intensity Revenue Visualizers ── */}
            <div className="px-4 space-y-6">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-950 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                        <TrendingUp size={120} className="text-white" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-black text-white tracking-tight uppercase">Liquidity Stream</h3>
                                <p className="text-brand-400 text-[10px] font-black uppercase tracking-widest mt-1">30-Day Revenue Flow</p>
                            </div>
                            <button className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/10 active:scale-90 transition-all">
                                <RefreshCcw size={16} />
                            </button>
                        </div>

                        <div className="h-[200px] w-full mb-8">
                            {revenueLoading || !isMounted ? (
                                <div className="h-full w-full bg-white/5 rounded-3xl animate-pulse" />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueData}>
                                        <defs>
                                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#F5A623" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="#F5A623" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <Area type="monotone" dataKey="total" stroke="#F5A623" strokeWidth={4} fillOpacity={1} fill="url(#revenueGradient)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[9px] font-black text-brand-400 uppercase tracking-widest mb-1">Total Payouts</p>
                                <p className="text-2xl font-black text-white leading-none">KES 24.5k</p>
                            </div>
                            <button className="h-10 px-6 bg-brand-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl shadow-brand-900/40 active:scale-95 transition-all">
                                View Payouts
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* ── Pricing Strategy Matrix ── */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-black text-green-950 uppercase tracking-[0.2em] pl-2 border-l-4 border-brand-600">Pricing Strategy</h3>
                        <span className="text-[8px] font-black text-brand-600 uppercase tracking-widest bg-brand-50 px-2 py-1 rounded-lg">Market Sync Active</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {pricingLoading ? (
                            [1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-50 rounded-3xl animate-pulse" />)
                        ) : priceInsights?.insights?.map((insight: PriceInsight) => (
                            <motion.div 
                                key={insight.id}
                                className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                        insight.sentiment === 'high' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                                    )}>
                                        <Target size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-green-950 uppercase tracking-tight mb-1">{insight.name}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest italic">
                                                KES {insight.price} vs {insight.market_average} avg
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={cn(
                                        "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg mb-1",
                                        insight.difference_percent > 0 ? 'bg-rose-50 text-rose-600' : 'bg-brand-50 text-brand-600'
                                    )}>
                                        {insight.difference_percent > 0 ? '+' : ''}{insight.difference_percent}%
                                    </div>
                                    <ChevronRight size={16} className="text-gray-300 ml-auto" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Global Commercial Actions ── */}
            <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-3">
                <button className="w-14 h-14 bg-gray-950 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all border-4 border-white">
                    <Download size={24} />
                </button>
            </div>
        </div>
    );
}

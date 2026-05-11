'use client';

import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, TraderDashboardStats, RevenueTrend, RevenueTrendsResponse } from '@/types';
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
        setPageTitle('Commercial Intelligence');
    }, [setPageTitle]);

    const [isMounted, setIsMounted] = React.useState(false);
    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['trader-stats'],
        queryFn: async () => (await api.get<never, ApiResponse<TraderDashboardStats>>('/trader/analytics/stats')).data
    });

    const { data: revenueResponse, isLoading: revenueLoading } = useQuery({
        queryKey: ['trader-revenue'],
        queryFn: async () => (await api.get<never, ApiResponse<RevenueTrendsResponse>>('/trader/analytics/revenue')).data
    });

    const { data: priceInsights, isLoading: pricingLoading } = useQuery({
        queryKey: ['trader-price-insights'],
        queryFn: async () => (await api.get<never, ApiResponse<{ market_id: number; insights: PriceInsight[] }>>('/trader/analytics/price-insights')).data
    });

    const revenueData = revenueResponse?.trends || [];
    const revenueSummary = revenueResponse?.summary;

    const matrixStats = [
        { 
            label: 'Total Revenue', 
            value: `KES ${stats?.total_revenue?.toLocaleString() || '0'}`, 
            growth: stats?.growth || '+0%',
            icon: DollarSign,
            color: 'bg-emerald-50 text-emerald-600'
        },
        { 
            label: 'Orders', 
            value: stats?.completed_reservations || '0', 
            growth: stats?.growth || '+0%', // Fallback to revenue growth for now
            icon: Package,
            color: 'bg-blue-50 text-blue-600'
        },
        { 
            label: 'Profile Pulse', 
            value: stats?.profile_views || '0', 
            growth: '+0%', // Static for now until backend tracks historical views
            icon: Target,
            color: 'bg-purple-50 text-purple-600'
        },
    ];

    return (
        <div className="pb-32 px-4 space-y-10 max-w-5xl mx-auto pt-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black text-green-950 tracking-tight uppercase">Commercial IQ</h1>
                    <p className="text-text-secondary font-medium text-sm">Real-time performance metrics & market insights.</p>
                </div>
                <button className="p-3 bg-white border border-gray-100 rounded-2xl text-text-secondary hover:text-green-950 shadow-sm active:scale-95 transition-all">
                    <Download size={20} />
                </button>
            </div>

            {/* ── High-Level Performance Matrix ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {matrixStats.map((s, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-4 group hover:shadow-xl hover:shadow-gray-200/40 transition-all"
                    >
                        <div className="flex items-center justify-between">
                            <div className={cn("p-3 rounded-2xl", s.color)}>
                                <s.icon size={24} />
                            </div>
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                {s.growth}
                            </span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">{s.label}</p>
                            <p className="text-2xl font-black text-green-950 tracking-tight">
                                {statsLoading ? '...' : s.value}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ── Revenue Stream Visualization ── */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-950 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
            >
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-12 opacity-5">
                    <TrendingUp size={240} className="text-white" />
                </div>
                
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                                <h3 className="text-lg font-black text-white tracking-[0.1em] uppercase">Liquidity Stream</h3>
                            </div>
                            <p className="text-brand-400 text-[10px] font-black uppercase tracking-widest pl-4">30-Day Automated Revenue Analysis</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
                                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Avg Daily:</span>
                                <span className="text-[10px] font-black text-white ml-2 uppercase tracking-widest">KES {revenueSummary?.average_daily ? Math.round(revenueSummary.average_daily).toLocaleString() : '0'}</span>
                            </div>
                            <button className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/10 active:scale-90 transition-all hover:bg-white/20">
                                <RefreshCcw size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="h-[280px] w-full mb-10 -mx-4 md:mx-0">
                        {revenueLoading || !isMounted ? (
                            <div className="h-full w-full bg-white/5 rounded-[2rem] animate-pulse" />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData}>
                                    <defs>
                                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#F5A623" stopOpacity={0.5}/>
                                            <stop offset="95%" stopColor="#F5A623" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <Area 
                                        type="monotone" 
                                        dataKey="total" 
                                        stroke="#F5A623" 
                                        strokeWidth={6} 
                                        fillOpacity={1} 
                                        fill="url(#revenueGradient)" 
                                        animationDuration={2000}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-10 border-t border-white/10">
                        <div className="flex items-center gap-6">
                            <div>
                                <p className="text-[9px] font-black text-brand-400 uppercase tracking-widest mb-1">Highest Peak</p>
                                <p className="text-2xl font-black text-white leading-none">KES {revenueSummary?.peak_revenue?.toLocaleString() || '0'}</p>
                            </div>
                            <div className="w-px h-10 bg-white/10 hidden md:block" />
                            <div>
                                <p className="text-[9px] font-black text-brand-400 uppercase tracking-widest mb-1">Period Total</p>
                                <p className="text-2xl font-black text-emerald-400 leading-none">KES {revenueSummary?.total_period?.toLocaleString() || '0'}</p>
                            </div>
                        </div>
                        <button className="w-full md:w-auto h-14 px-8 bg-brand-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-brand-900/40 active:scale-95 transition-all hover:bg-brand-700">
                            Detailed Ledger
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* ── Pricing Intelligence ── */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                            <Target size={20} />
                        </div>
                        <h3 className="text-xl font-black text-green-950 uppercase tracking-tight">Market Intelligence</h3>
                    </div>
                    <span className="text-[10px] font-black text-brand-600 uppercase tracking-[0.15em] bg-brand-50 px-3 py-1.5 rounded-full border border-brand-100">
                        Real-time Benchmarking
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pricingLoading ? (
                        [1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-white border border-gray-100 rounded-[2.5rem] animate-pulse" />)
                    ) : priceInsights?.insights?.map((insight: PriceInsight, i: number) => (
                        <motion.div 
                            key={insight.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-xl hover:shadow-gray-200/40 transition-all group"
                        >
                            <div className="flex items-center gap-5">
                                <div className={cn(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110",
                                    insight.sentiment === 'high' ? 'bg-rose-50 text-rose-600' : 'bg-brand-50 text-brand-600'
                                )}>
                                    <Star size={24} className={insight.sentiment === 'high' ? 'text-rose-600' : 'text-brand-600'} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-green-950 uppercase tracking-tight mb-1">{insight.name}</h4>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest italic">
                                            KES {insight.price} <span className="mx-1">/</span> {insight.market_average} avg
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className={cn(
                                    "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl",
                                    insight.difference_percent > 0 
                                        ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                )}>
                                    {insight.difference_percent > 0 ? '+' : ''}{insight.difference_percent}%
                                </div>
                                <span className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em]">
                                    {insight.sentiment === 'high' ? 'Pricing High' : 'Highly Competitive'}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

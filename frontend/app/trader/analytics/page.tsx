'use client';

import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, TraderDashboardStats, RevenueTrend } from '@/types';
import BottomNav from '@/components/shared/BottomNav';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
    BarChart, Bar, Cell
} from 'recharts';
import { 
    TrendingUp, TrendingDown, Users, Package, DollarSign, 
    ArrowUpRight, AlertCircle, Info, Loader2, ChevronRight,
    BarChart3, Target, CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useUIStore } from '@/store/uiStore';

interface RevenuePoint {
    date: string;
    total: number;
}

interface PriceInsight {
    id: number;
    name: string;
    price: string | number;
    market_average: number;
    difference_percent: number;
    sentiment: 'high' | 'low' | 'competitive';
}

export default function TraderAnalyticsPage() {
    const { t, locale } = useTranslation();
    const { setPageTitle } = useUIStore();

    React.useEffect(() => {
        setPageTitle('Analytics & Growth');
    }, [setPageTitle]);

    // Fetch Analytics Data
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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="flex-1 pb-10 min-h-screen bg-transparent px-4 pt-6">
            {/* Main Stats Area */}
            <motion.div 
                className="space-y-8 max-w-[1400px] mx-auto"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Metrics Grid */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <motion.div variants={itemVariants} className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <DollarSign size={64} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{t('trader.revenue')}</p>
                        <h2 className="text-3xl font-black text-green-950 tracking-tighter">
                            {statsLoading ? <Loader2 className="animate-spin" size={20} /> : `KES ${stats?.total_revenue?.toLocaleString() || '0'}`}
                        </h2>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-brand-600 uppercase">
                            <TrendingUp size={14} /> +12.5% vs last month
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Users size={64} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{t('trader.views')}</p>
                        <h2 className="text-3xl font-black text-green-950 tracking-tighter">
                            {statsLoading ? <Loader2 className="animate-spin" size={20} /> : stats?.profile_views || '0'}
                        </h2>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-brand-600 uppercase">
                            <Users size={14} /> Profile Visits
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Bookings</p>
                        <h2 className="text-3xl font-black text-green-950 tracking-tighter">
                            {statsLoading ? <Loader2 className="animate-spin" size={20} /> : stats?.completed_reservations || '0'}
                        </h2>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase">
                            <CheckCircle2 size={14} /> Completed Orders
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-brand-600 rounded-[32px] p-6 shadow-xl shadow-brand-500/20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-brand-100 uppercase tracking-[0.2em] mb-2">Market Rank</p>
                            <h2 className="text-3xl font-black text-white tracking-tighter">#4</h2>
                            <p className="mt-4 text-[10px] font-black text-brand-200 uppercase tracking-widest">In Machakos Market</p>
                        </div>
                    </motion.div>
                </section>

                {/* Main Charts Area */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Revenue Trend */}
                    <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-black text-green-950 text-xs uppercase tracking-[0.2em] border-l-4 border-brand-600 pl-4">30-Day Revenue Trend</h3>
                            <div className="px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-inner">
                                Last 30 Days
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            {revenueLoading ? (
                                <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-3xl animate-pulse">
                                    <Loader2 className="animate-spin text-brand-200" />
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueData}>
                                        <defs>
                                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#1B6B3A" stopOpacity={0.2}/>
                                                <stop offset="95%" stopColor="#1B6B3A" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                                        <XAxis dataKey="date" hide />
                                        <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" tickFormatter={(v) => `KES ${v}`} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }}
                                            formatter={(v: unknown) => [`KES ${Number(v || 0).toLocaleString()}`, 'Revenue']}
                                        />
                                        <Area type="monotone" dataKey="total" stroke="#1B6B3A" strokeWidth={4} fillOpacity={1} fill="url(#revenueGradient)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </motion.div>

                    {/* Price Insights List */}
                    <motion.div variants={itemVariants} className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm flex flex-col">
                        <h3 className="font-black text-green-950 text-xs uppercase tracking-[0.2em] border-l-4 border-amber-500 pl-4 mb-8">{t('trader.price_insights')}</h3>
                        
                        <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] pr-2 scrollbar-hide">
                            {pricingLoading ? (
                                [1,2,3].map(i => <div key={i} className="h-20 bg-gray-50 rounded-[24px] animate-pulse" />)
                            ) : priceInsights?.insights?.map((insight: PriceInsight) => (
                                <div key={insight.id} className="p-5 rounded-[24px] bg-gray-50 border border-transparent hover:border-brand-100 transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-black text-green-950 text-sm tracking-tight">{insight.name}</span>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                                            insight.sentiment === 'high' ? 'bg-red-50 text-red-600' : 
                                            insight.sentiment === 'low' ? 'bg-blue-50 text-blue-600' : 
                                            'bg-brand-50 text-brand-600'
                                        }`}>
                                            {insight.sentiment}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            KES {insight.price} <span className="opacity-30 mx-1">•</span> {insight.market_average} avg
                                        </span>
                                        <span className={`text-[10px] font-black ${insight.difference_percent > 0 ? 'text-red-600' : 'text-brand-600'}`}>
                                            {insight.difference_percent > 0 ? '+' : ''}{insight.difference_percent}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-50 flex items-start gap-3">
                            <Info size={16} className="text-slate-400 mt-0.5" />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-relaxed">
                                Comparison is based on Machakos Market averages.
                            </p>
                        </div>
                    </motion.div>
                </section>
            </motion.div>
        </div>
    );

}

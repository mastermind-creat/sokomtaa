'use client';

import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import BottomNav from '@/components/shared/BottomNav';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
    BarChart, Bar, Cell
} from 'recharts';
import { 
    TrendingUp, TrendingDown, Users, Package, DollarSign, 
    ArrowUpRight, AlertCircle, Info, Loader2, ChevronRight,
    Search, BarChart3, Target
} from 'lucide-react';
import { motion } from 'framer-motion';

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

    // Fetch Analytics Data
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['trader-stats'],
        queryFn: async () => (await api.get('/trader/analytics/stats')).data.data
    });

    const { data: revenueData, isLoading: revenueLoading } = useQuery({
        queryKey: ['trader-revenue'],
        queryFn: async () => (await api.get('/trader/analytics/revenue')).data.data
    });

    const { data: priceInsights, isLoading: pricingLoading } = useQuery({
        queryKey: ['trader-price-insights'],
        queryFn: async () => (await api.get('/trader/analytics/price-insights')).data.data
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
        <div className="flex-1 pb-24 lg:pb-10 min-h-screen bg-surface-base">
            {/* Header Area */}
            <header className="px-6 pt-10 pb-6 lg:bg-white lg:border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-green-950 flex items-center gap-2">
                        <BarChart3 className="text-brand-600" size={28} />
                        {t('trader.view_analytics')}
                    </h1>
                    <p className="text-sm text-text-secondary font-medium mt-1">
                        {t('trader.market_comparison')} (Market ID: {priceInsights?.market_id || '...'})
                    </p>
                </div>
                
                <div className="hidden lg:flex items-center gap-4">
                    <div className="px-4 py-2 bg-brand-50 rounded-full border border-brand-100">
                        <span className="text-xs font-bold text-brand-700 uppercase tracking-widest flex items-center gap-2">
                            <Target size={14} /> LIVE ANALYTICS
                        </span>
                    </div>
                </div>
            </header>

            <motion.div 
                className="p-6 md:p-8 space-y-8 max-w-[1400px] mx-auto"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Metrics Grid */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <motion.div variants={itemVariants} className="card p-6 bg-white border-none shadow-float relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <DollarSign size={64} />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('trader.revenue')}</p>
                        <h2 className="text-3xl font-black text-green-950">
                            {statsLoading ? <Loader2 className="animate-spin" size={20} /> : `KES ${stats?.total_revenue?.toLocaleString() || '0'}`}
                        </h2>
                        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-success">
                            <TrendingUp size={14} /> +12.5% vs last month
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="card p-6 bg-white border-none shadow-float relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Users size={64} />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('trader.views')}</p>
                        <h2 className="text-3xl font-black text-green-950">
                            {statsLoading ? <Loader2 className="animate-spin" size={20} /> : stats?.profile_views || '0'}
                        </h2>
                        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-brand-600">
                            <Users size={14} /> Real-time active users
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="card p-6 bg-white border-none shadow-float relative overflow-hidden group">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Bookings</p>
                        <h2 className="text-3xl font-black text-green-950">
                            {statsLoading ? <Loader2 className="animate-spin" size={20} /> : stats?.completed_reservations || '0'}
                        </h2>
                        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-amber-600">
                            <Info size={14} /> Conversion Rate: 4.2%
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="card p-6 bg-green-900 border-none shadow-float relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 to-transparent opacity-50" />
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2 text-white">Market Rank</p>
                            <h2 className="text-3xl font-black text-white">#4</h2>
                            <p className="mt-4 text-xs font-medium text-white/80">In Machakos Market</p>
                        </div>
                    </motion.div>
                </section>

                {/* Main Charts Area */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Revenue Trend */}
                    <motion.div variants={itemVariants} className="lg:col-span-2 card p-8 bg-white border-none shadow-float">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-black text-green-950 text-sm uppercase tracking-widest border-l-4 border-brand-600 pl-4">30-Day Revenue Trend</h3>
                            <select 
                                aria-label="Select Analytics Range"
                                className="text-xs font-bold border-none bg-slate-50 rounded-lg p-2 outline-none"
                            >
                                <option>Last 30 Days</option>
                                <option>Last 7 Days</option>
                            </select>
                        </div>
                        <div className="h-[300px] w-full">
                            {revenueLoading ? (
                                <div className="h-full w-full flex items-center justify-center bg-slate-50 rounded-2xl animate-pulse">
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
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="date" hide />
                                        <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `KES ${v}`} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                                            formatter={(v: unknown) => [`KES ${Number(v || 0).toLocaleString()}`, 'Revenue']}
                                        />
                                        <Area type="monotone" dataKey="total" stroke="#1B6B3A" strokeWidth={4} fillOpacity={1} fill="url(#revenueGradient)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </motion.div>

                    {/* Price Insights List */}
                    <motion.div variants={itemVariants} className="card p-8 bg-white border-none shadow-float h-full flex flex-col">
                        <h3 className="font-black text-green-950 text-sm uppercase tracking-widest border-l-4 border-accent pl-4 mb-8">{t('trader.price_insights')}</h3>
                        
                        <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin">
                            {pricingLoading ? (
                                [1,2,3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />)
                            ) : priceInsights?.insights?.map((insight: PriceInsight) => (
                                <div key={insight.id} className="p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-brand-100 transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-green-900 text-sm">{insight.name}</span>
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                                            insight.sentiment === 'high' ? 'bg-error-bg text-error-dark' : 
                                            insight.sentiment === 'low' ? 'bg-blue-50 text-blue-600' : 
                                            'bg-green-100 text-green-700'
                                        }`}>
                                            {insight.sentiment}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-500">
                                            KES {insight.price} <span className="opacity-50">vs</span> {insight.market_average} avg
                                        </span>
                                        <span className={`text-xs font-black ${insight.difference_percent > 0 ? 'text-error-dark' : 'text-success'}`}>
                                            {insight.difference_percent > 0 ? '+' : ''}{insight.difference_percent}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                Prices are compared against the average for the same category in your current market.
                            </p>
                        </div>
                    </motion.div>
                </section>
            </motion.div>

            <BottomNav />
        </div>
    );
}

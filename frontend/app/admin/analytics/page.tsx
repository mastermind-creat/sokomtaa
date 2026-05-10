'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
    LineChart, Line, BarChart, Bar, AreaChart, Area, 
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Download, 
    Clock, 
    TrendingUp, 
    ChevronRight,
    Target,
    Zap,
    Scale,
    PieChart as PieIcon
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

const COLORS = ['#1B6B3A', '#F5A623', '#2563EB', '#D97706', '#16A34A', '#6B7280'];

export default function AdminAnalyticsPage() {
    const { setPageTitle } = useUIStore();
    const [period, setPeriod] = useState('month');

    React.useEffect(() => {
        setPageTitle('Economic Insights');
    }, [setPageTitle]);

    const { data: analyticsDataRaw, isLoading } = useQuery({
        queryKey: ['admin-analytics', period],
        queryFn: () => api.get('/admin/analytics', { params: { period } }),
    });

    const analytics = (analyticsDataRaw as any)?.data || {
        levy_collection: [],
        reservation_volume: [],
        category_demand: [],
        peak_hours: [],
        occupancy_rate: 0
    };

    // Dynamically calculate summary stats
    const totalVolume = analytics.levy_collection?.reduce((sum: number, item: any) => sum + Number(item.amount), 0) || 0;
    const formatVolume = (val: number) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toString();
    
    let peakHour = '--';
    if (analytics.peak_hours && analytics.peak_hours.length > 0) {
        const topHour = [...analytics.peak_hours].sort((a: any, b: any) => b.count - a.count)[0];
        peakHour = topHour.hour;
    }

    const stats = [
        { label: 'Volume (KES)', value: formatVolume(totalVolume), color: 'text-brand-600', icon: TrendingUp },
        { label: 'Occupancy', value: `${analytics.occupancy_rate || 0}%`, color: 'text-blue-600', icon: Target },
        { label: 'Peak Hour', value: peakHour, color: 'text-orange-600', icon: Clock },
    ];

    if (isLoading) return <div className="p-10 text-center opacity-30 font-black uppercase tracking-widest text-[10px]">Loading Economic Matrix...</div>;

    return (
        <div className="pb-32 -mx-4 md:-mx-0">
            {/* ── Macro-Economic Matrix ── */}
            <div className="grid grid-cols-3 gap-2 px-4 mb-6">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
                        <span className={cn("text-[8px] font-black uppercase tracking-widest mb-1", s.color)}>{s.label}</span>
                        <div className="text-xl font-black text-green-950 tracking-tight">{s.value}</div>
                    </div>
                ))}
            </div>

            {/* ── Context Controls ── */}
            <div className="px-4 mb-8 flex gap-2">
                <div className="flex-1 bg-white border border-gray-100 rounded-2xl h-12 px-4 flex items-center justify-between shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Analysis Window</span>
                    <select 
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="bg-transparent text-[10px] font-black uppercase tracking-widest text-brand-600 outline-none"
                    >
                        <option value="today">Today</option>
                        <option value="week">Week</option>
                        <option value="month">Month</option>
                    </select>
                </div>
                <button className="w-12 h-12 bg-gray-950 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
                    <Download size={18} />
                </button>
            </div>

            <div className="space-y-6 px-4">
                {/* ── Revenue Velocity Chart ── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] border border-gray-50 shadow-brand-sm overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">
                                <Scale size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-green-950 uppercase tracking-tight">Revenue Velocity</h3>
                                <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Market Levy Collection Trends</p>
                            </div>
                        </div>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analytics.levy_collection}>
                                    <defs>
                                        <linearGradient id="colorLevy" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1B6B3A" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#1B6B3A" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" hide />
                                    <YAxis hide />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: '900' }}
                                    />
                                    <Area type="monotone" dataKey="amount" stroke="#1B6B3A" strokeWidth={3} fillOpacity={1} fill="url(#colorLevy)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </motion.div>

                {/* ── Category Demand Hub ── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                <PieIcon size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-green-950 uppercase tracking-tight">Category Distribution</h3>
                                <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Trade Volume by Sector</p>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            {analytics.category_demand?.map((item: any, i: number) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-text-secondary">{item.name}</span>
                                        <span className="text-green-950">{item.value} units</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full rounded-full transition-all duration-1000" 
                                            style={{ 
                                                width: `${(item.value / 450) * 100}%`,
                                                backgroundColor: COLORS[i % COLORS.length]
                                            }} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* ── Traffic Intensity Card ── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                                <Zap size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-green-950 uppercase tracking-tight">Traffic Intensity</h3>
                                <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Peak Operational Hours</p>
                            </div>
                        </div>
                        <div className="h-40 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.peak_hours}>
                                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '900', fill: '#9CA3AF' }} />
                                    <Tooltip 
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                                    />
                                    <Bar dataKey="count" fill="#F5A623" radius={[8, 8, 8, 8]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </motion.div>

                {/* ── Actionable Insight Hub ── */}
                <div className="pt-4 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-4">Operational Intelligence</h4>
                    <div className="bg-gray-950 rounded-[2.5rem] p-6 text-white relative overflow-hidden group">
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h5 className="text-base font-black tracking-tight mb-1">Infrastructure Optimization</h5>
                                <p className="text-xs text-white/60 font-medium leading-relaxed max-w-[240px]">Block B has reached 98% occupancy. Evaluate expansion in North Sector.</p>
                            </div>
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center active:bg-white/20 transition-all">
                                <ChevronRight size={20} />
                            </div>
                        </div>
                        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-brand-500 rounded-full blur-[60px] opacity-20 transition-all group-hover:scale-150" />
                    </div>
                </div>
            </div>
        </div>
    );
}

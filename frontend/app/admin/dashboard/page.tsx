'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { StatCard } from '@/components/admin/StatCard';
import { 
    Users, 
    Home, 
    AlertCircle, 
    TrendingUp, 
    ArrowRight, 
    CheckCircle2, 
    Clock, 
    ShieldAlert,
    BarChart3
} from 'lucide-react';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { motion } from 'framer-motion';
import { ApiResponse } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

import DashboardLayout from '@/components/shared/DashboardLayout';

interface DashboardStats {
    revenue: {
        total: number;
        target: number;
        percentage: number;
    };
    traders: {
        total: number;
        growth: number;
    };
    stalls: {
        total: number;
        occupied: number;
        occupancy_rate: number;
    };
    complaints: {
        pending: number;
        urgent: number;
    };
}

interface RevenueTrend {
    total: number;
    month: string;
}

export default function AdminDashboard() {
    const { t } = useTranslation();

    // Fetch stats
    const { data: statsRes, isLoading: statsLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const res = await api.get<never, ApiResponse<DashboardStats>>('/admin/stats');
            return res.data;
        }
    });

    // Fetch trends
    const { data: trendsRes, isLoading: trendsLoading } = useQuery({
        queryKey: ['admin-trends'],
        queryFn: async () => {
            const res = await api.get<never, ApiResponse<RevenueTrend[]>>('/admin/trends');
            return res.data;
        }
    });

    if (statsLoading || trendsLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
                    <p className="text-text-secondary font-black uppercase tracking-widest text-xs">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    const stats = statsRes;
    const trends = trendsRes;

    return (
        <DashboardLayout title={t('admin.dashboard_title')}>
            <div className="p-6 lg:p-10 space-y-10">
                {/* Actions Bar (formerly in header) */}
                <div className="flex justify-end gap-3">
                    <button className="h-12 px-6 bg-white border border-gray-200 text-green-950 font-black text-sm rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                        {t('admin.export_report')}
                    </button>
                    <button className="h-12 px-6 bg-brand-600 text-white font-black text-sm rounded-xl hover:bg-brand-700 transition-all shadow-md active:scale-95">
                        {t('admin.broadcast_notice')}
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <StatCard 
                        title={`${t('trader.revenue')} (KES)`}
                        value={stats?.revenue.total.toLocaleString() || '0'}
                        icon={TrendingUp}
                        color="bg-brand-600"
                        trend={{ value: stats?.revenue.percentage || 0, isPositive: true, label: t('admin.revenue_daily') }}
                        description={t('admin.revenue_daily')}
                    />
                    <StatCard 
                        title={t('common.traders')}
                        value={stats?.traders.total || '0'}
                        icon={Users}
                        color="bg-amber-500"
                        trend={{ value: stats?.traders.growth || 0, isPositive: true, label: 'this month' }}
                        description={t('common.verification')}
                    />
                    <StatCard 
                        title={t('common.stalls')}
                        value={`${stats?.stalls.occupancy_rate || 0}%`}
                        icon={Home}
                        color="bg-blue-600"
                        description={`${stats?.stalls.occupied} / ${stats?.stalls.total} ${t('common.stalls')} active`}
                    />
                    <StatCard 
                        title={t('common.complaints')}
                        value={stats?.complaints.pending || '0'}
                        icon={AlertCircle}
                        color="bg-red-600"
                        trend={{ value: stats?.complaints.urgent || 0, isPositive: false, label: 'high priority' }}
                        description={t('admin.priority_subtitle')}
                    />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Revenue Chart */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="xl:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-green-950 tracking-tight">{t('admin.revenue_trends')}</h3>
                                <p className="text-text-secondary text-sm">{t('admin.revenue_subtitle')}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-brand-600" />
                                    <span className="text-xs font-bold text-text-muted uppercase">{t('admin.revenue_actual')}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trends}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1B6B3A" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#1B6B3A" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                    <XAxis 
                                        dataKey="month" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600 }}
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600 }}
                                        tickFormatter={(val) => `KES ${val / 1000}k`}
                                    />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        labelStyle={{ fontWeight: 'black', color: '#1B6B3A' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="total" 
                                        stroke="#1B6B3A" 
                                        strokeWidth={4}
                                        fillOpacity={1} 
                                        fill="url(#colorRevenue)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Task List / Alerts */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-950 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <ShieldAlert size={120} />
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-xl font-black tracking-tight mb-2">Priority Actions</h3>
                            <p className="text-green-200 text-sm mb-8 font-medium">Items requiring your immediate attention.</p>

                            <div className="space-y-4">
                                {[
                                    { title: 'Trader Verification', count: 4, icon: CheckCircle2, sub: 'New permit applications' },
                                    { title: 'Pending Complaints', count: stats?.complaints.pending || 0, icon: Clock, sub: 'Needs resolution' },
                                    { title: 'Stall Allocation', count: 2, icon: Home, sub: 'Waiting list approval' },
                                ].map((item, i) => (
                                    <button key={i} className="w-full bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between group transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                                <item.icon size={20} className="text-amber-400" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-black text-sm">{item.title}</p>
                                                <p className="text-[10px] text-green-200 font-bold uppercase tracking-widest">{item.sub}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="bg-amber-400 text-green-950 font-black text-xs px-2 py-1 rounded-lg">
                                                {item.count}
                                            </span>
                                            <ArrowRight size={16} className="text-white opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <button className="w-full mt-8 bg-amber-400 hover:bg-amber-500 text-green-950 font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all">
                                View All Tasks
                                <BarChart3 size={18} />
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </DashboardLayout>

    );
}

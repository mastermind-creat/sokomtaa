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
    BarChart3,
    Activity,
    Map as MapIcon,
    Filter
} from 'lucide-react';
import { 
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';
import { motion } from 'framer-motion';
import { ApiResponse } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import RecentActivityFeed from '@/components/admin/RecentActivityFeed';
import dynamic from 'next/dynamic';

// Dynamic import for Leaflet map to avoid SSR issues
const StallMapPreview = dynamic(() => import('@/components/admin/StallMapPreview'), { 
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-gray-50 animate-pulse rounded-3xl flex items-center justify-center font-black uppercase text-text-muted tracking-widest text-xs">Loading Market Map...</div>
});

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
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const res = await api.get<never, ApiResponse<DashboardStats>>('/admin/stats');
            return res.data;
        }
    });

    // Fetch trends
    const { data: trends, isLoading: trendsLoading } = useQuery({
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

    return (
        <DashboardLayout title={t('admin.dashboard_title')}>
            <div className="space-y-8 lg:space-y-12">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-black text-green-950 tracking-tight">{t('admin.live_analytics')}</h1>
                        <p className="text-text-secondary text-sm font-medium">{t('admin.subtitle')}</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button className="flex-1 sm:flex-none h-12 px-6 bg-white border border-gray-100 text-green-950 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-2">
                            <Activity size={16} />
                            {t('admin.export_report')}
                        </button>
                        <button className="flex-1 sm:flex-none h-12 px-6 bg-brand-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-900/10 active:scale-95 flex items-center justify-center gap-2">
                            <Activity size={16} className="animate-pulse" />
                            {t('admin.broadcast_notice')}
                        </button>
                    </div>
                </div>

                {/* 1. TOP: 4-Stat Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                    <StatCard 
                        title={`Market Fees (County Levy)`}
                        value={`KES ${stats?.revenue.total.toLocaleString()}`}
                        icon={TrendingUp}
                        color="bg-brand-600"
                        trend={{ value: stats?.revenue.percentage || 0, isPositive: true, label: "VS Target" }}
                        description={t('admin.revenue_subtitle')}
                    />
                    <StatCard 
                        title={t('common.traders')}
                        value={stats?.traders.total || '0'}
                        icon={Users}
                        color="bg-amber-500"
                        trend={{ value: stats?.traders.growth || 0, isPositive: true, label: 'New this month' }}
                        description="Verified & Active"
                    />
                    <StatCard 
                        title="Stall Occupancy"
                        value={`${stats?.stalls.occupancy_rate || 0}%`}
                        icon={Home}
                        color="bg-blue-600"
                        description={`${stats?.stalls.occupied} / ${stats?.stalls.total} units filled`}
                    />
                    <StatCard 
                        title="Pending Orders"
                        value="142" // Mock today's orders
                        icon={Activity}
                        color="bg-brand-950"
                        trend={{ value: 8, isPositive: true, label: 'Today' }}
                        description="Market-wide reservations"
                    />
                </div>

                {/* 2. MIDDLE: Trends + Activity Split */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
                    {/* Trends Chart */}
                    <div className="xl:col-span-2 bg-white rounded-[2.5rem] p-6 lg:p-10 shadow-sm border border-gray-50">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-green-950 tracking-tight">{t('admin.revenue_trends')}</h3>
                                <p className="text-text-secondary text-sm font-medium">Monthly collection across all markets.</p>
                            </div>
                            <select 
                                aria-label="Filter revenue trends by date range"
                                title="Filter revenue trends by date range"
                                className="h-10 pl-4 pr-10 bg-gray-50 border-none rounded-xl text-xs font-bold text-text-secondary outline-none appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
                            >
                                <option>Last 6 Months</option>
                                <option>Last Year</option>
                            </select>
                        </div>
                        
                        <div className="h-[300px] lg:h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trends}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1B6B3A" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#1B6B3A" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FAFAFA" />
                                    <XAxis 
                                        dataKey="month" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }}
                                        dy={15}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }}
                                        tickFormatter={(val) => `KES ${val / 1000}k`}
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            borderRadius: '24px', 
                                            border: 'none', 
                                            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                                            padding: '16px' 
                                        }}
                                        labelStyle={{ fontWeight: '900', color: '#1B6B3A', marginBottom: '8px' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="total" 
                                        stroke="#1B6B3A" 
                                        strokeWidth={4}
                                        fillOpacity={1} 
                                        fill="url(#colorRevenue)" 
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Activity Feed */}
                    <div className="h-full">
                        <RecentActivityFeed />
                    </div>
                </div>

                {/* 3. BOTTOM: Stall Map Preview */}
                <div className="bg-white rounded-[2.5rem] p-6 lg:p-10 shadow-sm border border-gray-50 mt-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <MapIcon className="text-brand-600" size={20} />
                                <h3 className="text-xl font-black text-green-950 tracking-tight">Interactive Market Map</h3>
                            </div>
                            <p className="text-text-secondary text-sm font-medium">Visual stall availability and trader directory.</p>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button className="flex-1 sm:flex-none h-11 px-5 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-text-secondary transition-all">
                                <Filter size={16} /> Filter Stalls
                            </button>
                            <button className="flex-1 sm:flex-none h-11 px-5 bg-brand-50 hover:bg-brand-100 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-brand-700 transition-all">
                                View Full Map <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="relative rounded-[2rem] overflow-hidden border border-gray-100 shadow-inner">
                        <StallMapPreview />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

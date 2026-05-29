'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { StatCard } from '@/components/admin/StatCard';
import Link from 'next/link';
import {
    Users,
    Home,
    TrendingUp,
    ArrowRight,
    Activity,
    Map as MapIcon,
    Filter,
    ShieldCheck,
    Coins
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
import { useUIStore } from '@/store/uiStore';
import RecentActivityFeed from '@/components/admin/RecentActivityFeed';
import dynamic from 'next/dynamic';

// Dynamic import for Leaflet map to avoid SSR issues
const StallMapPreview = dynamic(() => import('../../../components/admin/StallMapPreview'), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-gray-50 animate-pulse rounded-3xl flex items-center justify-center font-black uppercase text-text-muted tracking-widest text-xs">Loading Market Map...</div>
});

const MetricChart = ({ data, dataKey, title, color }: { data: any, dataKey: string, title: string, color: string }) => (
    <div className="flex flex-col h-[220px] bg-gray-50/50 rounded-2xl p-4 border border-gray-100/50">
        <h4 className="text-sm font-black text-gray-700 mb-4 tracking-tight">{title}</h4>
        <div className="flex-1 w-full overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                    <defs>
                        <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FAFAFA" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }} dy={10} />
                    <Tooltip
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        labelStyle={{ fontWeight: '900', color: '#1A1A1A', marginBottom: '4px' }}
                        formatter={(value: any) => [`KES ${Number(value || 0).toLocaleString()}`, title]}
                    />
                    <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} fillOpacity={1} fill={`url(#color-${dataKey})`} animationDuration={1500} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    </div>
);

interface DashboardStats {
    revenue: {
        total: number;
        target: number;
        percentage: number;
        service_fees_total: number;
        service_fees_month: number;
    };
    traders: {
        total: number;
        pending: number;
        new_this_month: number;
    };
    delivery?: {
        pending: number;
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
    month: string;
    market_fees: number;
    service_fees: number;
    delivery_fees: number;
    total: number;
}

export default function AdminDashboard() {
    const { t } = useTranslation();
    const { setPageTitle } = useUIStore();

    React.useEffect(() => {
        setPageTitle(t('admin.dashboard_title') || 'Admin Overview');
    }, [setPageTitle, t]);

    const [isMounted, setIsMounted] = React.useState(false);
    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    // Fetch stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const res = await api.get<never, ApiResponse<DashboardStats>>('/admin/stats');
            return res.data;
        }
    });

    const pendingTradersCount = stats?.traders?.pending || 0;
    const pendingRidersCount = stats?.delivery?.pending || 0;
    const totalPendingKyc = pendingTradersCount + pendingRidersCount;
    const kycHref = pendingTradersCount === 0 && pendingRidersCount > 0 ? '/admin/users' : '/admin/traders';

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
        <div className="space-y-8 lg:space-y-12 pb-10 px-4 pt-6">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
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

                {/* 1. TOP: High-Density Metrics Row */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2 md:gap-6">
                    <StatCard
                        title={`Market Fees`}
                        value={`KES ${stats?.revenue?.total !== undefined ? (stats.revenue.total >= 1000 ? (stats.revenue.total / 1000).toFixed(1) + 'k' : stats.revenue.total) : '0'}`}
                        icon={TrendingUp}
                        color="bg-brand-600"
                        variant="compact"
                        trend={{ value: stats?.revenue.percentage || 0, isPositive: true, label: "VS Target" }}
                        description="Stall Collection"
                    />
                    <StatCard
                        title={`Platform Revenue`}
                        value={`KES ${stats?.revenue?.service_fees_total !== undefined ? (stats.revenue.service_fees_total >= 1000 ? (stats.revenue.service_fees_total / 1000).toFixed(1) + 'k' : stats.revenue.service_fees_total) : '0'}`}
                        icon={Coins}
                        color="bg-blue-600"
                        variant="compact"
                        trend={{ value: stats?.revenue.service_fees_month || 0, isPositive: true, label: 'This Month' }}
                        description="Resident Service Fees"
                    />
                    <StatCard
                        title={t('common.traders')}
                        value={stats?.traders.total || '0'}
                        icon={Users}
                        color="bg-amber-500"
                        variant="compact"
                        trend={{ value: stats?.traders.new_this_month || 0, isPositive: true, label: 'New this month' }}
                        description="Verified & Active"
                    />
                    <StatCard
                        title="Occupancy"
                        value={`${stats?.stalls.occupancy_rate || 0}%`}
                        icon={Home}
                        color="bg-indigo-600"
                        variant="compact"
                        description={`${stats?.stalls.occupied} / ${stats?.stalls.total} units filled`}
                    />
                    <div className="hidden xl:block">
                        <Link href={kycHref}>
                            <StatCard
                                title="Pending KYC"
                                value={totalPendingKyc.toString()}
                                icon={ShieldCheck}
                                color="bg-rose-600"
                                variant="compact"
                                trend={{ value: totalPendingKyc, isPositive: true, label: 'Awaiting Review' }}
                                description={`${pendingTradersCount} Traders • ${pendingRidersCount} Riders`}
                            />
                        </Link>
                    </div>
                </div>

                {/* 2. MIDDLE: Trends + Activity Split */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
                    {/* Trends Chart */}
                    <div className="xl:col-span-2 bg-white rounded-[2.5rem] p-6 lg:p-10 shadow-sm border border-gray-50">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                            <div>
                                <h3 className="text-xl font-black text-green-950 tracking-tight">{t('admin.revenue_trends')}</h3>
                                <p className="text-text-secondary text-sm font-medium">Distinct revenue streams across the platform.</p>
                            </div>
                            <select className="h-10 pl-4 pr-10 bg-gray-50 border-none rounded-xl text-xs font-bold text-text-secondary outline-none appearance-none cursor-pointer hover:bg-gray-100 transition-colors">
                                <option>Last 6 Months</option>
                                <option>Last Year</option>
                            </select>
                        </div>

                        <div className="w-full">
                            {isMounted ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                                    <MetricChart data={trends} dataKey="total" title="Gross Transaction Value (GTV)" color="#8B5CF6" />
                                    <MetricChart data={trends} dataKey="market_fees" title="Market Fees (County)" color="#1B6B3A" />
                                    <MetricChart data={trends} dataKey="service_fees" title="Platform Service Fees" color="#2563EB" />
                                    <MetricChart data={trends} dataKey="delivery_fees" title="Delivery Revenue (Riders)" color="#F5A623" />
                                </div>
                            ) : (
                                <div className="w-full h-[400px] bg-gray-50 rounded-3xl animate-pulse" />
                            )}
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
    );
}

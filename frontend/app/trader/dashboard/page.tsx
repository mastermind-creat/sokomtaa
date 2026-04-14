'use client';

import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { 
    Store, 
    Plus, 
    Package, 
    TrendingUp, 
    CheckCircle, 
    Clock, 
    AlertCircle,
    Loader2,
    DollarSign,
    ShoppingCart,
    ArrowUpRight,
    Search,
    ChevronRight,
    MapPin,
    AlertTriangle,
    BadgeCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, TraderDashboardStats, RevenueTrend } from '@/types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useTranslation } from '@/hooks/useTranslation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import PriorityOrderList from '../../../components/trader/PriorityOrderList';
import { motion, AnimatePresence } from 'framer-motion';

export default function TraderDashboard() {
    const { user } = useAuthStore();
    const router = useRouter();
    const { t } = useTranslation();

    // Fetch Analytics Stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['trader-stats'],
        queryFn: async () => {
            const res = await api.get<never, ApiResponse<TraderDashboardStats>>('/analytics/stats');
            return res.data.data;
        }
    });

    // Fetch Revenue Trends
    const { data: revenueData, isLoading: revenueLoading } = useQuery({
        queryKey: ['trader-revenue'],
        queryFn: async () => {
            const res = await api.get<never, ApiResponse<RevenueTrend[]>>('/analytics/revenue');
            return res.data.data;
        }
    });

    // Mock check for overdue fees (Real logic would come from backend)
    const hasOverdueFees = true; 
    const isPendingVerification = user?.role === 'trader' && !user?.phone_verified;

    return (
        <DashboardLayout title={t('trader.dashboard_title')}>
            <div className="space-y-6 lg:space-y-10 pb-10">
                
                {/* 1. TOP: Status Banners */}
                <AnimatePresence>
                    {(hasOverdueFees || isPendingVerification) && (
                        <div className="space-y-3">
                            {hasOverdueFees && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-amber-50 border border-amber-100 rounded-[2rem] p-5 lg:p-6 flex items-center gap-5 shadow-sm"
                                >
                                    <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-200">
                                        <AlertTriangle size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-amber-900 font-black text-sm lg:text-base uppercase tracking-tight">Market Fee Overdue</h4>
                                        <p className="text-amber-700 text-xs lg:text-sm font-medium">Your monthly stall fee for April is 5 days overdue. Please pay to avoid penalties.</p>
                                    </div>
                                    <button className="h-10 px-6 bg-amber-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-black transition-all active:scale-95 whitespace-nowrap">
                                        Pay Now
                                    </button>
                                </motion.div>
                            )}

                            {isPendingVerification && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-brand-50 border border-brand-100 rounded-[2rem] p-5 lg:p-6 flex items-center gap-5 shadow-sm"
                                >
                                    <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-brand-200">
                                        <Clock size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-brand-900 font-black text-sm lg:text-base uppercase tracking-tight">Verification Pending</h4>
                                        <p className="text-brand-700 text-xs lg:text-sm font-medium">County officials are reviewing your permit documents. This usually takes 24-48h.</p>
                                    </div>
                                    <button className="h-10 px-6 bg-brand-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-black transition-all active:scale-95 whitespace-nowrap">
                                        Check Status
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    )}
                </AnimatePresence>

                {/* 2. MIDDLE: Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50 relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-50 rounded-full group-hover:scale-125 transition-transform duration-700 blur-2xl opacity-50" />
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4">Gross Sales</p>
                        <div className="flex items-baseline gap-2 mb-2">
                            <h2 className="text-3xl font-black text-green-950">
                                {statsLoading ? '---' : `KES ${stats?.total_revenue?.toLocaleString()}`}
                            </h2>
                            <span className="text-xs font-bold text-brand-600 flex items-center gap-0.5">
                                <ArrowUpRight size={14} /> +12.5%
                            </span>
                        </div>
                        <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">This Month</p>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50 relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-50 rounded-full group-hover:scale-125 transition-transform duration-700 blur-2xl opacity-50" />
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4">Total Orders</p>
                        <div className="flex items-baseline gap-2 mb-2">
                            <h2 className="text-3xl font-black text-green-950">
                                {statsLoading ? '---' : stats?.completed_reservations}
                            </h2>
                            <span className="text-xs font-bold text-amber-600 flex items-center gap-0.5">
                                <ArrowUpRight size={14} /> +8.0%
                            </span>
                        </div>
                        <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">Confirmed</p>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50 relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full group-hover:scale-125 transition-transform duration-700 blur-2xl opacity-50" />
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4">Store Views</p>
                        <div className="flex items-baseline gap-2 mb-2">
                            <h2 className="text-3xl font-black text-green-950">
                                2,408
                            </h2>
                            <span className="text-xs font-bold text-blue-600 flex items-center gap-0.5">
                                <ArrowUpRight size={14} /> +5.2%
                            </span>
                        </div>
                        <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">Last 30 Days</p>
                    </div>
                </div>

                {/* 3. BOTTOM: Split Layout */}
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                    {/* Priority Orders (3 columns) */}
                    <div className="xl:col-span-3">
                        <PriorityOrderList />
                    </div>

                    {/* Sales Performance (2 columns) */}
                    <div className="xl:col-span-2 space-y-8">
                        {/* Summary Chart Card */}
                        <div className="bg-green-950 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden min-h-[400px]">
                            <div className="absolute top-0 right-0 p-10 opacity-10">
                                <TrendingUp size={160} className="text-white" />
                            </div>
                            
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tight">Sales Performance</h3>
                                        <p className="text-green-300 text-xs font-bold uppercase tracking-widest mt-1">Growth Index</p>
                                    </div>
                                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/10 group cursor-pointer hover:bg-white/20 transition-all">
                                        <Plus size={20} />
                                    </div>
                                </div>

                                <div className="flex-1 mt-auto">
                                    <div className="h-[200px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={revenueData}>
                                                <defs>
                                                    <linearGradient id="colorWhite" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#F5A623" stopOpacity={0.8}/>
                                                        <stop offset="95%" stopColor="#F5A623" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <Area 
                                                    type="monotone" 
                                                    dataKey="total" 
                                                    stroke="#F5A623" 
                                                    strokeWidth={3}
                                                    fillOpacity={1} 
                                                    fill="url(#colorWhite)" 
                                                    animationDuration={2000}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="mt-8 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-white font-black text-2xl">KES 14.2k</p>
                                            <p className="text-green-300 text-[10px] font-black uppercase tracking-[0.2em]">Peak Daily Sales</p>
                                        </div>
                                        <button className="h-12 px-6 bg-white text-green-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:bg-amber-400 transition-all active:scale-95">
                                            Full Report
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Action Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => router.push('/trader/products/add')} className="h-40 bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-50 flex flex-col justify-between group hover:border-brand-600 transition-all active:scale-95">
                                <div className="w-12 h-12 bg-brand-50 text-brand-700 rounded-2xl flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-all">
                                    <Plus size={24} />
                                </div>
                                <span className="font-black text-green-950 text-xs uppercase tracking-widest">{t('trader.new_product')}</span>
                            </button>
                            <button onClick={() => router.push('/trader/products')} className="h-40 bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-50 flex flex-col justify-between group hover:border-amber-500 transition-all active:scale-95">
                                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all">
                                    <Package size={24} />
                                </div>
                                <span className="font-black text-green-950 text-xs uppercase tracking-widest">{t('trader.manage_products')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

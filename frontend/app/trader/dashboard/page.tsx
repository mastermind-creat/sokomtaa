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
    ShoppingCart
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, TraderDashboardStats, RevenueTrend, AnalyticsProduct } from '@/types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useTranslation } from '@/hooks/useTranslation';
import DashboardLayout from '@/components/shared/DashboardLayout';

export default function TraderDashboard() {
    const { user } = useAuthStore();
    const router = useRouter();
    const { t } = useTranslation();

    // Fetch Analytics Stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['trader-stats'],
        queryFn: async () => {
            const res = await api.get<ApiResponse<TraderDashboardStats>>('/analytics/stats');
            return res.data.data;
        }
    });

    // Fetch Revenue Trends
    const { data: revenueData, isLoading: revenueLoading } = useQuery({
        queryKey: ['trader-revenue'],
        queryFn: async () => {
            const res = await api.get<ApiResponse<RevenueTrend[]>>('/analytics/revenue');
            return res.data.data;
        }
    });

    // Fetch Top Products
    const { data: topProducts, isLoading: topProductsLoading } = useQuery({
        queryKey: ['trader-top-products'],
        queryFn: async () => {
            const res = await api.get<ApiResponse<AnalyticsProduct[]>>('/analytics/top-products');
            return res.data.data;
        }
    });

    return (
        <DashboardLayout title={t('trader.dashboard_title')}>
            <div className="flex flex-col min-h-screen bg-[#FAFAF8] p-6 lg:p-10 space-y-10">
                {/* Trader Welcome Card (Relocated from header) */}
                <div className="card bg-[#1B6B3A] text-white p-6 flex items-center gap-6 shadow-2xl relative overflow-hidden rounded-[32px]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-20" />
                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-[#1B6B3A] shadow-xl shrink-0">
                        <Store size={32} />
                    </div>
                    <div>
                        <h3 className="font-black text-2xl leading-none mb-2">{user?.name}</h3>
                        <div className="flex items-center gap-2">
                            {user?.phone_verified ? (
                                <span className="flex items-center gap-1 text-[10px] bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full font-black uppercase tracking-widest border border-white/20">
                                    <CheckCircle size={10} /> {t('trader.verified')}
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-[10px] bg-amber-400 text-green-950 px-3 py-1.5 rounded-full font-black uppercase tracking-widest shadow-lg">
                                    <Clock size={10} /> {t('trader.pending')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <section className="grid grid-cols-2 gap-6">
                    <button 
                        onClick={() => router.push('/trader/products/add')}
                        className="card p-6 flex flex-col items-center justify-center gap-4 bg-white hover:border-[#1B6B3A] transition-all shadow-xl active:scale-95 group border-transparent h-44 rounded-[32px]"
                    >
                        <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-all duration-300">
                            <Plus size={32} />
                        </div>
                        <span className="font-black text-sm text-green-950">{t('trader.new_product')}</span>
                    </button>
                    <button 
                        onClick={() => router.push('/trader/products')}
                        className="card p-6 flex flex-col items-center justify-center gap-4 bg-white hover:border-amber-500 transition-all shadow-xl active:scale-95 group border-transparent h-44 rounded-[32px]"
                    >
                        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                            <Package size={32} />
                        </div>
                        <span className="font-black text-sm text-green-950">{t('trader.manage_products')}</span>
                    </button>
                </section>

                {/* Key Metrics */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card p-6 border-none bg-white shadow-lg overflow-hidden relative group rounded-[32px]">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <DollarSign size={64} />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2">{t('trader.revenue')}</p>
                        <h2 className="text-3xl font-black text-green-950">
                            {statsLoading ? <Loader2 className="animate-spin text-slate-200" size={24} /> : `KES ${stats?.total_revenue?.toLocaleString()}`}
                        </h2>
                        <div className="mt-4 flex items-center gap-2">
                             <div className="flex items-center gap-1 text-[10px] bg-green-50 text-green-600 font-black px-2 py-1 rounded-lg">
                                <TrendingUp size={12} /> +12%
                             </div>
                             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('admin.revenue_daily')}</span>
                        </div>
                    </div>
                    <div className="card p-6 border-none bg-white shadow-lg overflow-hidden relative group rounded-[32px]">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <ShoppingCart size={64} />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2">{t('trader.completed_sales')}</p>
                        <h2 className="text-3xl font-black text-green-950">
                            {statsLoading ? <Loader2 className="animate-spin text-slate-200" size={24} /> : stats?.completed_reservations}
                        </h2>
                        <div className="mt-4">
                             <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">
                                {t('trader.completed_sales')}
                             </span>
                        </div>
                    </div>
                </section>

                {/* Revenue Chart and Top Products */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Revenue Chart */}
                    <section className="xl:col-span-2">
                        <div className="card p-8 bg-white border-none shadow-xl rounded-[32px] h-full">
                            <h3 className="font-black text-green-950 text-sm uppercase tracking-widest mb-8 border-l-4 border-brand-600 pl-4">{t('trader.revenue_trend')}</h3>
                            <div className="h-[300px] w-full">
                                {revenueLoading ? (
                                    <div className="h-full w-full flex items-center justify-center bg-slate-50 rounded-2xl">
                                        <Loader2 className="animate-spin text-brand-200" />
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={revenueData}>
                                            <defs>
                                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#1B6B3A" stopOpacity={0.1}/>
                                                    <stop offset="95%" stopColor="#1B6B3A" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDF2F7" />
                                            <XAxis dataKey="date" hide />
                                            <YAxis hide />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#fff', borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                                                labelStyle={{ display: 'none' }}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="total" 
                                                stroke="#1B6B3A" 
                                                strokeWidth={4}
                                                fillOpacity={1} 
                                                fill="url(#colorTotal)" 
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Top Products */}
                    <section>
                        <div className="card p-8 bg-white border-none shadow-xl rounded-[32px] h-full">
                            <h3 className="font-black text-green-950 text-sm uppercase tracking-widest mb-8 border-l-4 border-amber-500 pl-4">{t('trader.top_products')}</h3>
                            <div className="space-y-4">
                                {topProductsLoading ? (
                                    [1,2,3].map(i => <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse" />)
                                ) : topProducts?.map((product: AnalyticsProduct) => (
                                    <div key={product.id} className="flex items-center justify-between group p-3 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-slate-100 rounded-2xl overflow-hidden shadow-inner shrink-0 leading-none">
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <Package size={24} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-green-900 leading-tight truncate">{product.name}</h4>
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{product.total_reservations} Res</p>
                                            </div>
                                        </div>
                                        <div className="text-right ml-2">
                                            <p className="font-black text-[#1B6B3A] text-sm whitespace-nowrap">KES {parseFloat(product.price).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>

                {/* Alerts & Stock */}
                {((stats?.low_stock_items ?? 0) > 0 || (stats?.out_of_stock_items ?? 0) > 0) && (
                    <section className="bg-red-50 border border-red-100 rounded-[32px] p-6 flex gap-6 mt-6">
                        <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-200 shrink-0">
                            <AlertCircle size={28} />
                        </div>
                        <div>
                            <h4 className="font-black text-red-600 text-sm uppercase tracking-widest mb-1">{t('trader.stock_alert')}</h4>
                            <p className="text-slate-600 text-sm leading-snug">
                                Una bidhaa <strong>{stats?.out_of_stock_items ?? 0}</strong> zilizoisha na <strong>{stats?.low_stock_items ?? 0}</strong> zenye akiba ndogo.
                            </p>
                        </div>
                    </section>
                )}
            </div>
        </DashboardLayout>

    );
}

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
    ArrowRight,
    Loader2,
    DollarSign,
    ShoppingCart
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse } from '@/types';
import BottomNav from '@/components/shared/BottomNav';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function TraderDashboard() {
    const { user } = useAuthStore();
    const router = useRouter();

    // Fetch Analytics Stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['trader-stats'],
        queryFn: async () => {
            const res = await api.get<ApiResponse<any>>('/analytics/stats');
            return res.data.data;
        }
    });

    // Fetch Revenue Trends
    const { data: revenueData, isLoading: revenueLoading } = useQuery({
        queryKey: ['trader-revenue'],
        queryFn: async () => {
            const res = await api.get<ApiResponse<any>>('/analytics/revenue');
            return res.data.data;
        }
    });

    // Fetch Top Products
    const { data: topProducts, isLoading: topProductsLoading } = useQuery({
        queryKey: ['trader-top-products'],
        queryFn: async () => {
            const res = await api.get<ApiResponse<any>>('/analytics/top-products');
            return res.data.data;
        }
    });

    return (
        <div className="flex flex-col min-h-screen bg-[#FAFAF8] pb-32">
            {/* Header / Brand */}
            <header className="p-6 pt-10 bg-[#1B6B3A] text-white rounded-b-[40px] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Dawati la Biashara</h1>
                        <p className="opacity-70 text-sm font-medium">Trader Intelligence Dashboard</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                        <Store size={24} />
                    </div>
                </div>

                <div className="card bg-white/10 backdrop-blur-2xl border-white/20 p-5 flex items-center gap-5 relative z-10 shadow-inner">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#1B6B3A] shadow-xl">
                        <Store size={28} />
                    </div>
                    <div className="text-white">
                        <h3 className="font-bold text-xl leading-tight">{user?.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            {user?.phone_verified ? (
                                <span className="flex items-center gap-1 text-[10px] bg-[#2D9653] px-2.5 py-1 rounded-full font-black uppercase tracking-widest shadow-lg">
                                    <CheckCircle size={10} /> Verified
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-[10px] bg-[#F5A623] px-2.5 py-1 rounded-full font-black uppercase tracking-widest shadow-lg">
                                    <Clock size={10} /> Pending
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Quick Actions */}
            <section className="px-6 -mt-8 grid grid-cols-2 gap-4 relative z-20">
                <button 
                    onClick={() => router.push('/trader/products/add')}
                    className="card p-5 flex flex-col items-center justify-center gap-4 bg-white hover:border-[#1B6B3A] transition-all shadow-xl active:scale-95 group border-transparent"
                >
                    <div className="w-14 h-14 bg-[#1B6B3A] rounded-2xl flex items-center justify-center text-white group-hover:shadow-[0_0_20px_rgba(27,107,58,0.3)] transition-all">
                        <Plus size={28} />
                    </div>
                    <span className="font-extrabold text-sm text-green-950">Bidhaa Mpya</span>
                </button>
                <button 
                    onClick={() => router.push('/trader/products')}
                    className="card p-5 flex flex-col items-center justify-center gap-4 bg-white hover:border-[#F5A623] transition-all shadow-xl active:scale-95 group border-transparent"
                >
                    <div className="w-14 h-14 bg-[#F5A623] rounded-2xl flex items-center justify-center text-white group-hover:shadow-[0_0_20px_rgba(245,166,35,0.3)] transition-all">
                        <Package size={28} />
                    </div>
                    <span className="font-extrabold text-sm text-green-950">Dhibiti Bidhaa</span>
                </button>
            </section>

            {/* Key Metrics */}
            <section className="p-6 grid grid-cols-2 gap-4">
                <div className="card p-5 border-none bg-white shadow-lg overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign size={40} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Jumla ya Mapato</p>
                    <h2 className="text-2xl font-black text-green-950">
                        {statsLoading ? <Loader2 className="animate-spin text-slate-200" size={24} /> : `KES ${stats?.total_revenue?.toLocaleString()}`}
                    </h2>
                    <p className="text-[10px] text-[#2D9653] font-bold mt-1 flex items-center gap-1">
                        <TrendingUp size={10} /> Total Revenue
                    </p>
                </div>
                <div className="card p-5 border-none bg-white shadow-lg overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShoppingCart size={40} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Zimekamika</p>
                    <h2 className="text-2xl font-black text-green-950">
                        {statsLoading ? <Loader2 className="animate-spin text-slate-200" size={24} /> : stats?.completed_reservations}
                    </h2>
                    <p className="text-[10px] text-[#2563EB] font-bold mt-1">Completed Sales</p>
                </div>
            </section>

            {/* Revenue Chart */}
            <section className="px-6 mb-6">
                <div className="card p-6 bg-white border-none shadow-xl">
                    <h3 className="font-black text-green-950 text-sm uppercase tracking-widest mb-6 border-l-4 border-[#1B6B3A] pl-3">Mwelekeo wa Mapato (Revenue Trend)</h3>
                    <div className="h-[200px] w-full">
                        {revenueLoading ? (
                            <div className="h-full w-full flex items-center justify-center bg-slate-50 rounded-xl">
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
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis 
                                        dataKey="date" 
                                        hide
                                    />
                                    <YAxis hide />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        labelStyle={{ display: 'none' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="total" 
                                        stroke="#1B6B3A" 
                                        strokeWidth={3}
                                        fillOpacity={1} 
                                        fill="url(#colorTotal)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </section>

            {/* Alerts & Stock */}
            {(stats?.low_stock_items > 0 || stats?.out_of_stock_items > 0) && (
                <section className="px-6 mb-6">
                    <div className="bg-[#DC2626]/5 border border-[#DC2626]/10 rounded-3xl p-5 flex gap-4">
                        <div className="w-12 h-12 bg-[#DC2626] rounded-2xl flex items-center justify-center text-white shadow-lg">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-[#DC2626] text-sm uppercase tracking-wider">Tahadhari ya Akiba (Stock Alert)</h4>
                            <p className="text-slate-600 text-xs leading-snug mt-1">
                                Una bidhaa <strong>{stats?.out_of_stock_items}</strong> zilizoisha na <strong>{stats?.low_stock_items}</strong> zenye akiba ndogo.
                                <br />(You have {stats?.out_of_stock_items} out-of-stock and {stats?.low_stock_items} low-stock items.)
                            </p>
                        </div>
                    </div>
                </section>
            )}

            {/* Top Products list */}
            <section className="px-6 mb-8">
                <h3 className="text-lg font-black text-green-950 mb-4 px-1">Bidhaa Zinazovuma (Top Selling)</h3>
                <div className="space-y-3">
                    {topProductsLoading ? (
                        [1,2].map(i => <div key={i} className="h-20 bg-slate-100 rounded-3xl animate-pulse" />)
                    ) : topProducts?.map((product: any) => (
                        <div key={product.id} className="card p-4 flex items-center justify-between hover:border-[#1B6B3A] transition-all group bg-white border-transparent shadow-md">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-slate-100 rounded-2xl overflow-hidden shadow-inner">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <Package size={24} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-green-900 leading-tight">{product.name}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{product.total_reservations} bookings</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-[#1B6B3A] whitespace-nowrap">KES {parseFloat(product.price).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <BottomNav />
        </div>
    );
}

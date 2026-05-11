'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

import { 
    Ticket, 
    Bell, 
    ShoppingBag, 
    MapPin, 
    ArrowRight, 
    TrendingUp, 
    Star,
    MessageSquare,
    Clock,
    Sparkles,
    ChevronRight,
    Map as MapIcon,
    Flame,
    Heart,
    History,
    CheckCircle2,
    Calendar,
    Wallet,
    ArrowUpRight,
    Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiResponse, Market, Notice } from '@/types';
import Image from 'next/image';

interface Reservation {
    id: number;
    reservation_code: string;
    status: 'pending' | 'paid' | 'ready' | 'completed' | 'cancelled' | 'expired';
    total_amount: string;
    product: {
        name: string;
        image_url: string | null;
    };
    trader: {
        business_name: string;
    };
    created_at: string;
}

interface DashboardStats {
    active_reservations: number;
    completed_reservations: number;
    total_spent: number;
    watchlist_count: number;
    points: number;
}

export default function ResidentDashboard() {
    const { user } = useAuthStore();
    const router = useRouter();
    const { t } = useTranslation();

    const { data: resData, isLoading: resLoading } = useQuery<ApiResponse<Reservation[]>>({
        queryKey: ['my-reservations-dashboard'],
        queryFn: () => api.get('/reservations').then(res => res.data),
    });

    // Fetch Stats
    const { data: statsData } = useQuery<ApiResponse<DashboardStats>>({
        queryKey: ['resident-dashboard-stats'],
        queryFn: () => api.get('/resident/dashboard/stats').then(res => res.data),
    });

    const reservations = resData?.data || [];
    const stats = statsData?.data;
    
    const activeOrders = reservations.filter(r => ['pending', 'paid', 'ready'].includes(r.status));
    const completedOrders = reservations.filter(r => ['completed'].includes(r.status));

    return (
        <div className="space-y-10 pb-32">
            
            {/* 1. Dashboard Header & Greeting */}
            <section className="relative">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="bg-brand-100 text-brand-700 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-brand-200">
                                My Dashboard
                            </span>
                            <div className="flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-amber-100">
                                <Sparkles size={12} className="text-amber-500 animate-pulse" /> Resident
                            </div>
                        </div>
                        <h1 className="text-4xl lg:text-6xl font-black text-green-950 tracking-tight leading-tight">
                            Welcome Back, <br />
                            <span className="text-brand-600 font-serif italic">{user?.name?.split(' ')[0]}!</span>
                        </h1>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                        <div className="bg-green-950 rounded-[2rem] p-6 text-white shadow-xl min-w-[200px] flex-1 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Wallet size={64} />
                            </div>
                            <p className="text-green-300 text-[10px] font-black uppercase tracking-widest mb-1">Total Spent</p>
                            <h3 className="text-2xl font-black font-mono">KES {(stats?.total_spent || 0).toLocaleString()}</h3>
                            <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-brand-400">
                                <ArrowUpRight size={14} /> View Expenses
                            </div>
                        </div>
                        <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm min-w-[180px] flex-1 group">
                            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 mb-3 group-hover:scale-110 transition-transform">
                                <Star size={20} fill="currentColor" />
                            </div>
                            <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-1">Loyalty Points</p>
                            <h3 className="text-2xl font-black text-green-950">{stats?.points?.toLocaleString() || '0'}</h3>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Reservations & History Tabs/Split */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">
                
                {/* ACTIVE RESERVATIONS (Main Column) */}
                <div className="xl:col-span-8 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-200">
                                <Ticket size={20} />
                            </div>
                            <h3 className="text-2xl font-black text-green-950 tracking-tight">Active Reservations</h3>
                        </div>
                        <button onClick={() => router.push('/reservations')} className="text-[10px] font-black text-brand-600 uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all px-4 py-2 bg-brand-50 rounded-full">
                            Manage All <ChevronRight size={14} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {resLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-4">
                                <Loader2 className="animate-spin text-brand-600" size={40} />
                                <p className="text-[10px] font-black text-brand-700 uppercase tracking-widest animate-pulse">Syncing orders...</p>
                            </div>
                        ) : activeOrders.length === 0 ? (
                            <div className="bg-white border-2 border-dashed border-gray-200 rounded-[3rem] p-16 text-center group cursor-pointer hover:border-brand-300 transition-colors" onClick={() => router.push('/')}>
                                <div className="w-20 h-20 bg-neutral-50 text-neutral-300 rounded-[2.5rem] flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                                    <ShoppingBag size={48} />
                                </div>
                                <h4 className="text-xl font-black text-green-950 mb-2">No Active Reservations</h4>
                                <p className="text-text-secondary text-sm font-medium mb-8 max-w-xs mx-auto">Your fresh picks are waiting! Start exploring your neighborhood market today.</p>
                                <button className="h-14 px-10 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-900/10 active:scale-95 transition-all">
                                    Shop Markets
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                                {activeOrders.map((order, index) => (
                                    <motion.div 
                                        key={order.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="group bg-white rounded-2xl p-3 md:p-5 shadow-sm border border-gray-50 hover:shadow-xl hover:shadow-gray-200/50 transition-all cursor-pointer flex flex-col items-start gap-3 relative overflow-hidden"
                                        onClick={() => router.push('/reservations')}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                                                <Clock size={18} />
                                            </div>
                                            <div className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider border ${
                                                order.status === 'ready' ? 'bg-brand-50 text-brand-700 border-brand-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                                            }`}>
                                                {order.status === 'ready' ? 'Ready for Pickup' : order.status}
                                            </div>
                                            <span className="text-[10px] font-mono font-black text-text-muted">#{order.reservation_code}</span>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="w-16 h-16 bg-neutral-50 rounded-2xl overflow-hidden shrink-0 border border-gray-100">
                                                {order.product.image_url ? (
                                                    <img src={order.product.image_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-200"><ShoppingBag size={24} /></div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-lg font-black text-green-950 truncate group-hover:text-brand-700 transition-colors uppercase leading-tight">
                                                    {order.product.name}
                                                </h4>
                                                <p className="text-xs text-text-secondary font-bold flex items-center gap-1 mt-1">
                                                    <MapPin size={12} className="text-amber-500" /> {order.trader.business_name}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-dashed border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-text-muted">
                                                <Clock size={14} />
                                                <span className="text-[10px] font-black uppercase">{new Date(order.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-base font-black text-green-950">KES {Number(order.total_amount).toLocaleString()}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* HISTORY & ACTIVITY (Side Column) */}
                <div className="xl:col-span-4 space-y-8">
                    <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-brand-sm border border-gray-50 flex flex-col gap-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-green-950 tracking-tight flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                                    <History size={20} />
                                </div>
                                Recent History
                            </h3>
                        </div>

                        <div className="space-y-6">
                            {completedOrders.length > 0 ? (
                                completedOrders.slice(0, 3).map((order) => (
                                    <div key={order.id} className="flex gap-4 group cursor-pointer" onClick={() => router.push('/reservations')}>
                                        <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center text-text-muted shrink-0 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-green-950 truncate">{order.product.name}</p>
                                            <p className="text-xs text-text-secondary font-medium">Completed on {new Date(order.created_at).toLocaleDateString()}</p>
                                            <span className="text-[9px] font-black text-brand-600 uppercase tracking-widest">KES {Number(order.total_amount).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-6 text-center space-y-3 border-2 border-dashed border-gray-50 rounded-[2rem]">
                                    <Clock className="mx-auto text-neutral-200" size={32} />
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">No history yet</p>
                                </div>
                            )}
                        </div>

                        <button onClick={() => router.push('/reservations')} className="w-full h-14 bg-neutral-50 text-green-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-100 transition-all">
                            View All History
                        </button>
                    </div>

                    {/* Quick Support Card */}
                    <div className="bg-brand-600 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                            <MessageSquare size={120} className="text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-white tracking-tight mb-2">Need Support?</h3>
                        <p className="text-brand-100 text-xs font-medium mb-8 leading-relaxed">Our neighborhood support team is ready to help you with any issues.</p>
                        <button className="h-12 px-6 bg-white text-brand-700 rounded-2xl font-black text-[10px] uppercase tracking-widest group-hover:bg-amber-400 group-hover:text-amber-950 transition-all flex items-center gap-2">
                            Contact Admin
                        </button>
                    </div>
                </div>
            </div>

            {/* 3. DISCOVERY SECTION */}
            <section className="pt-10">
                <div className="flex items-center justify-between mb-8 px-2">
                    <div>
                        <h2 className="text-3xl font-black text-green-950 tracking-tight">Discover Markets</h2>
                        <p className="text-text-secondary text-sm font-medium mt-1">Explore local traders in your area.</p>
                    </div>
                    <button onClick={() => router.push('/')} className="h-12 px-6 bg-white border border-gray-100 text-green-950 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-neutral-50 transition-all shadow-sm">
                        Browse All
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-brand-sm group hover:shadow-2xl transition-all cursor-pointer flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                            <MapIcon size={32} />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-green-950 uppercase">Market Map</h4>
                            <p className="text-xs text-text-muted font-bold">Find stalls visually</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-brand-sm group hover:shadow-2xl transition-all cursor-pointer flex items-center gap-6" onClick={() => router.push('/search')}>
                        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                            <Flame size={32} />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-green-950 uppercase">Hot Deals</h4>
                            <p className="text-xs text-text-muted font-bold">Trending today</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-brand-sm group hover:shadow-2xl transition-all cursor-pointer flex items-center gap-6">
                        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
                            <Heart size={32} fill="currentColor" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-green-950 uppercase">Favorites</h4>
                            <p className="text-xs text-text-muted font-bold">Saved traders</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

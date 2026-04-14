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
    Heart
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiResponse, Market, Notice } from '@/types';

interface Reservation {
    id: number;
    reservation_code: string;
    status: 'pending' | 'paid' | 'ready' | 'completed' | 'cancelled';
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

export default function ResidentDashboard() {
    const { user } = useAuthStore();
    const router = useRouter();
    const { t } = useTranslation();

    // Fetch Reservations to aggregate stats
    const { data: resData, isLoading: resLoading } = useQuery<ApiResponse<{data: Reservation[]}>>({
        queryKey: ['my-reservations-dashboard'],
        queryFn: () => api.get('/reservations'),
    });

    const reservations = resData?.data?.data || [];
    const activeOrders = reservations.filter(r => ['pending', 'paid', 'ready'].includes(r.status));
    
    // Loyalty Balance (Mocked for now)
    const loyaltyPoints = 1420;

    return (
        <>
            <div className="space-y-10 pb-20">
                
                {/* 1. HERO: Greeting & Loyalty Status */}
                <section className="relative group">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="bg-brand-100 text-brand-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-brand-200">
                                    {t('nav.dawati')}
                                </span>
                                <span className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-amber-200">
                                    <Sparkles size={12} className="text-amber-600 animate-pulse" /> Premium Member
                                </span>
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-black text-green-950 tracking-tight leading-[1.1] mb-2">
                                Good Morning, <br className="lg:hidden" />
                                <span className="text-brand-600">{user?.name?.split(' ')[0]}!</span>
                            </h1>
                            <p className="text-text-secondary text-sm lg:text-base font-medium">Hapa ni muhtasari wa soko lako na matukio ya leo.</p>
                        </div>

                        {/* Loyalty Card */}
                        <div className="bg-green-950 rounded-[2.5rem] p-6 lg:p-8 shadow-2xl relative overflow-hidden flex items-center gap-6 min-w-[320px]">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Star size={100} className="text-white" />
                            </div>
                            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-amber-400 border border-white/10 shrink-0">
                                <Star size={32} fill="currentColor" />
                            </div>
                            <div>
                                <p className="text-green-300 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Loyalty Points</p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-3xl font-black text-white">{loyaltyPoints.toLocaleString()}</h3>
                                    <span className="text-xs font-bold text-amber-400 flex items-center gap-0.5">
                                        <TrendingUp size={14} /> +45
                                    </span>
                                </div>
                                <button className="mt-3 text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2 hover:text-amber-400 transition-colors">
                                    Redeem Rewards <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. MIDDLE: Order Status & Discovery Split */}
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 lg:gap-10">
                    
                    {/* Active Reservations (3 cols) */}
                    <div className="xl:col-span-3 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xl font-black text-green-950 tracking-tight">Active Reservations</h3>
                            <button onClick={() => router.push('/reservations')} className="text-xs font-black text-brand-600 uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                                View History <ChevronRight size={14} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {resLoading ? (
                                Array(2).fill(0).map((_, i) => (
                                    <div key={i} className="h-28 bg-gray-50 animate-pulse rounded-[2rem]" />
                                ))
                            ) : activeOrders.length === 0 ? (
                                <div className="bg-white border-2 border-dashed border-gray-100 rounded-[2.5rem] p-12 text-center flex flex-col items-center">
                                    <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-[2rem] flex items-center justify-center mb-4 transition-transform hover:rotate-12">
                                        <ShoppingBag size={40} />
                                    </div>
                                    <h4 className="font-black text-green-950">Hakuna order imesalia</h4>
                                    <p className="text-text-secondary text-xs mt-2 mb-6">Explore your local market and reserve fresh produce today.</p>
                                    <button onClick={() => router.push('/')} className="h-12 px-8 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-900/10 active:scale-95 transition-all">
                                        Start Shopping
                                    </button>
                                </div>
                            ) : (
                                activeOrders.map((order, index) => (
                                    <motion.div 
                                        key={order.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => router.push(`/reservations`)}
                                        className="group bg-white rounded-[2.5rem] p-5 shadow-sm border border-gray-50 hover:shadow-xl hover:shadow-gray-200/50 transition-all cursor-pointer flex items-center gap-5"
                                    >
                                        <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden shadow-inner shrink-0 group-hover:scale-105 transition-transform border border-gray-100">
                                            {order.product.image_url ? (
                                                <img src={order.product.image_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-200"><ShoppingBag size={32} /></div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                                    order.status === 'ready' ? 'bg-brand-600 text-white' : 
                                                    order.status === 'paid' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-text-muted'
                                                }`}>
                                                    {order.status === 'ready' ? 'Ready for Pickup' : order.status}
                                                </span>
                                                <span className="text-[10px] font-bold text-text-muted">#{order.reservation_code}</span>
                                            </div>
                                            <h4 className="text-lg font-black text-green-950 truncate group-hover:text-brand-700 transition-colors uppercase">
                                                {order.product.name}
                                            </h4>
                                            <p className="text-xs text-text-secondary font-bold flex items-center gap-1">
                                                <MapPin size={12} className="text-amber-500" /> {order.trader.business_name}
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                                            <ArrowRight size={20} />
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Discovery & Actions (2 cols) */}
                    <div className="xl:col-span-2 space-y-8">
                        {/* Help Center CTA */}
                        <div className="bg-brand-600 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                <MessageSquare size={140} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tight mb-2">Need Help?</h3>
                            <p className="text-brand-100 text-sm font-medium mb-8 leading-relaxed">Facing issues with a payment or a trader? Our support team is here for you 24/7.</p>
                            <button className="h-12 px-8 bg-white text-brand-700 rounded-2xl font-black text-xs uppercase tracking-widest group-hover:bg-amber-400 group-hover:text-amber-950 transition-all flex items-center gap-2">
                                <MessageSquare size={16} /> Contact Support
                            </button>
                        </div>

                        {/* Recent Reviews Summary */}
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black text-green-950 tracking-tight">Recent Activity</h3>
                                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                                    <Clock size={20} />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 shrink-0">
                                        <Heart size={18} fill="currentColor" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-green-950">Review Left for Mama Mboga</p>
                                        <p className="text-xs text-text-secondary font-medium">"Fresh produce as always, thank you!"</p>
                                        <span className="text-[10px] font-bold text-text-muted uppercase mt-1 inline-block tracking-widest">2 DAYS AGO</span>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                                        <MapPin size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-green-950">Followed Gikomba Market</p>
                                        <p className="text-xs text-text-secondary font-medium">Get notifications for new traders here.</p>
                                        <span className="text-[10px] font-bold text-text-muted uppercase mt-1 inline-block tracking-widest">5 DAYS AGO</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. BOTTOM: Discovery row */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl lg:text-2xl text-green-950 font-black tracking-tight">Recommended for You</h2>
                            <p className="text-text-secondary text-xs lg:text-sm font-medium mt-1">Personalized picks based on your recent activity.</p>
                        </div>
                        <button onClick={() => router.push('/')} className="h-10 px-6 bg-white border border-gray-200 text-green-950 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-all">
                            View More
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="group h-44 bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-50 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between">
                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-text-muted group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                                    <Flame size={24} />
                                </div>
                                <div>
                                    <h4 className="text-base font-black text-green-950 group-hover:text-brand-700 transition-colors uppercase">Featured Item</h4>
                                    <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mt-1">Coming Soon</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}

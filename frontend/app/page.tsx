'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
    Search, 
    MapPin, 
    LayoutDashboard, 
    Loader2, 
    Sparkles, 
    ArrowRight,
    ShoppingBag,
    Star,
    ChevronRight,
    Map as MapIcon,
    Flame
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { ApiResponse } from '@/types';
import DashboardLayout from '@/components/shared/DashboardLayout';
import RecommendationSection from '@/components/resident/RecommendationSection';
import CategoryFilter from '@/components/resident/CategoryFilter';
import { motion, AnimatePresence } from 'framer-motion';

interface Market {
    id: number;
    name: string;
    location: string;
    traders_count: number;
    image_url?: string;
}

interface ActiveReservation {
    id: number;
    product_name: string;
    status: string;
    pickup_deadline: string;
}

export default function HomePage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const { t } = useTranslation();

    // Fetch Markets
    const { data: marketData, isLoading: marketsLoading } = useQuery<ApiResponse<Market[]>>({
        queryKey: ['markets'],
        queryFn: () => api.get('/markets'),
    });

    // Mock Active Reservation check
    const { data: activeResData } = useQuery({
        queryKey: ['active-reservation'],
        queryFn: async () => {
             // In real app: api.get('/reservations?status=paid,ready&limit=1')
             return { data: null }; 
        },
        enabled: !!user
    });

    const markets = marketData?.data || [];
    const activeRes = activeResData?.data;

    return (
        <DashboardLayout title={t('home.greeting')}>
            <div className="space-y-8 lg:space-y-12 pb-20">
                
                {/* 1. TOP: Active Reservation Banner (Conditional) */}
                <AnimatePresence>
                    {user && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-amber-50 border border-amber-100 rounded-[2rem] p-5 lg:p-6 flex items-center justify-between shadow-sm group cursor-pointer hover:bg-brand-50 hover:border-brand-100 transition-all"
                            onClick={() => router.push('/reservations')}
                        >
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-[#F5A623] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200 shrink-0 group-hover:bg-brand-600 transition-colors">
                                    <ShoppingBag size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest group-hover:text-brand-600 transition-colors">Order Ready for Pickup</p>
                                    <h4 className="text-green-950 font-black text-sm lg:text-base tracking-tight">Sukuma Wiki (1 Bunch)</h4>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="hidden sm:inline-block text-[10px] font-black text-text-muted uppercase tracking-widest">
                                    Expires in 2h
                                </span>
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-amber-600 group-hover:text-brand-600 shadow-sm border border-gray-100 group-hover:border-brand-200 transition-all">
                                    <ArrowRight size={20} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 2. HERO: Welcome & Search */}
                <section className="relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="bg-brand-100 text-brand-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-brand-200">
                                {user ? t('nav.discover') : 'Karibu Soko Mtaa'}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-amber-200">
                                <Flame size={12} className="text-amber-600" /> Trending
                            </span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-green-950 tracking-tight leading-[1.1] mb-6">
                            {t('home.greeting')}, <br className="lg:hidden" />
                            <span className="text-brand-600">{user?.name?.split(' ')[0] || t('home.guest')}!</span>
                        </h1>

                        <div className="relative max-w-2xl group cursor-pointer" onClick={() => router.push('/search')}>
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-hover:text-brand-600 transition-colors" size={24} />
                            <input 
                                className="w-full h-20 pl-16 pr-6 bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 cursor-pointer pointer-events-none placeholder:text-text-muted text-green-950 font-medium text-lg focus:border-brand-300 transition-all outline-none" 
                                placeholder={t('common.search_placeholder')} 
                                readOnly
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 h-12 px-6 bg-brand-600 text-white rounded-2xl flex items-center justify-center font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-900/10 active:scale-95 transition-all">
                                Tafuta
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. CATEGORIES: Clean Grid/Row */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl lg:text-2xl text-green-950 font-black tracking-tight">{t('home.categories_title')}</h2>
                        <button onClick={() => router.push('/categories')} className="text-xs font-black text-brand-600 uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                            View All <ChevronRight size={14} />
                        </button>
                    </div>
                    <CategoryFilter 
                        selectedCategoryId={null} 
                        onSelectCategory={(id) => {
                            if(id) router.push(`/search?category=${encodeURIComponent(id)}`);
                            else router.push('/search');
                        }} 
                    />
                </section>

                {/* 4. RECOMMENDATIONS: Top Rated Row */}
                <section className="bg-white rounded-[3rem] p-7 lg:p-10 shadow-sm border border-gray-50">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl lg:text-2xl text-green-950 font-black tracking-tight">Top Rated Near You</h3>
                            <p className="text-text-secondary text-xs lg:text-sm font-medium mt-1">Traders with the best reviews this week.</p>
                        </div>
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-100 shadow-sm">
                            <Star size={14} fill="currentColor" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Premium</span>
                        </div>
                    </div>
                    <RecommendationSection />
                </section>

                {/* 5. MARKETS: Discover Local Markets */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl lg:text-2xl text-green-950 font-black tracking-tight">{t('home.markets_title')}</h2>
                            <p className="text-text-secondary text-xs lg:text-sm font-medium mt-1">Discover markets in your neighborhood.</p>
                        </div>
                        <button onClick={() => router.push('/market/map')} className="h-10 px-5 bg-brand-50 text-brand-700 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-brand-100 transition-all border border-brand-100">
                            <MapIcon size={14} /> Open Map
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {marketsLoading && Array(3).fill(0).map((_, i) => (
                            <div key={i} className="h-40 bg-gray-50 animate-pulse rounded-[2.5rem]" />
                        ))}
                        
                        {markets.map((market, index) => (
                            <motion.div 
                                key={market.id} 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => router.push(`/market/${market.id}`)}
                                className="group bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-50 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-all shadow-inner">
                                        <MapPin size={24} />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg uppercase whitespace-nowrap border border-brand-100">
                                            {market.traders_count} Live
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-green-950 group-hover:text-brand-700 transition-colors">{market.name}</h3>
                                    <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                        <MapPin size={10} className="text-amber-500" />
                                        {market.location}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}

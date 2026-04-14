'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
    Search, 
    MapPin, 
    Loader2, 
    Sparkles, 
    ArrowRight,
    ShoppingBag,
    Star,
    ChevronRight,
    Map as MapIcon,
    Flame,
    Zap,
    TrendingUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { ApiResponse } from '@/types';

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

export default function HomePage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const { t } = useTranslation();

    // Fetch Markets
    const { data: marketData, isLoading: marketsLoading } = useQuery<ApiResponse<Market[]>>({
        queryKey: ['markets'],
        queryFn: () => api.get('/markets'),
    });

    const markets = marketData?.data || [];

    // Helper for localized greeting time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return language === 'sw' ? 'Habari za asubuhi' : 'Good Morning';
        if (hour < 16) return language === 'sw' ? 'Habari za mchana' : 'Good Afternoon';
        return language === 'sw' ? 'Habari za jioni' : 'Good Evening';
    };

    const language = user?.preferred_language || 'sw';

    return (
        <>
            <div className="space-y-10 lg:space-y-16 pb-20">
                
                {/* 1. TOP: Dynamic Contextual Alert */}
                <AnimatePresence mode="wait">
                    {user && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.02 }}
                            className="relative overflow-hidden group"
                            onClick={() => router.push('/reservations')}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-[2.5rem] opacity-20 group-hover:opacity-30 transition-opacity" />
                            <div className="relative bg-white/40 backdrop-blur-xl border border-amber-100 rounded-[2.5rem] p-6 flex items-center justify-between shadow-brand-sm group-hover:shadow-brand-lg transition-all">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-[#F5A623] text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-amber-200 shrink-0 group-hover:rotate-12 transition-transform">
                                        <Zap size={28} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                                            Active Reservation
                                        </p>
                                        <h4 className="text-green-950 font-black text-base lg:text-lg tracking-tight">Oda ipo tayari Pickup!</h4>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Expires in</p>
                                        <p className="text-sm font-black text-green-950">1h 45m</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md border border-amber-400">
                                        <ArrowRight size={24} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 2. HERO: Interactive Title & High-Gloss Search */}
                <section className="relative">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <span className="bg-brand-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-lg shadow-brand-100">
                                {language === 'sw' ? 'GUDUA SOKO' : 'EXPLORE MARKET'}
                            </span>
                            <span className="flex items-center gap-1.5 text-[9px] bg-amber-50 text-amber-700 font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-amber-100">
                                <Sparkles size={12} className="text-amber-500" /> New Traders
                            </span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-green-950 tracking-tighter leading-[0.9] mb-8">
                            {user ? t('home.greeting') : 'Karibu'}, <br />
                            <span className="text-brand-600 inline-flex items-center gap-4">
                                {user?.name?.split(' ')[0] || t('home.guest')}
                                <motion.span 
                                    animate={{ rotate: [0, 20, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="origin-bottom-right"
                                >
                                    👋
                                </motion.span>
                            </span>
                        </h1>

                        <div className="relative max-w-2xl group" onClick={() => router.push('/search')}>
                            <div className="absolute -inset-1 bg-gradient-to-r from-brand-400 to-amber-400 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                            <div className="relative h-20 bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 p-2 flex items-center gap-2 cursor-pointer transition-all hover:border-brand-300">
                                <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-all">
                                    <Search size={28} />
                                </div>
                                <div className="flex-1 px-2">
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Unatafuta nini Leo?</p>
                                    <p className="text-lg font-bold text-green-950/40">{t('common.search_placeholder')}</p>
                                </div>
                                <div className="h-16 px-8 bg-green-950 text-white rounded-2xl flex items-center justify-center font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-green-900/20 active:scale-95 transition-all">
                                    TAFUTA
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* 3. CATEGORIES: Staggered Entrance */}
                <section>
                    <div className="flex items-center justify-between mb-8 px-2">
                        <h2 className="text-2xl lg:text-3xl text-green-950 font-black tracking-tighter">{t('home.categories_title')}</h2>
                        <button onClick={() => router.push('/categories')} className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-brand-600 shadow-sm active:scale-90 transition-all">
                            <ArrowRight size={24} />
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

                {/* 4. RECOMMENDATIONS: Premium Glass Card */}
                <section className="relative group">
                    <div className="absolute inset-0 bg-brand-50 rounded-[4rem] group-hover:rotate-1 transition-transform" />
                    <div className="relative bg-white rounded-[4rem] p-8 lg:p-14 shadow-lg border border-gray-50 flex flex-col gap-8">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-2xl lg:text-4xl text-green-950 font-black tracking-tighter">Boresha ununuzi wako</h3>
                                <p className="text-text-secondary text-sm lg:text-lg font-medium opacity-80">Wafanyibiashara walio idhinishwa na Soko Mtaa.</p>
                            </div>
                            <div className="flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-2xl border border-amber-200 shadow-sm">
                                <TrendingUp size={18} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Hot Picks</span>
                            </div>
                        </div>
                        <RecommendationSection />
                    </div>
                </section>

                {/* 5. MARKETS: Discover Local Markets with Hover Effects */}
                <section>
                    <div className="flex items-center justify-between mb-10 px-2 text-center sm:text-left">
                        <div>
                            <h2 className="text-2xl lg:text-4xl text-green-950 font-black tracking-tighter">{t('home.markets_title')}</h2>
                            <p className="text-text-secondary text-sm lg:text-lg font-medium mt-1">Gundua masoko yaliyo karibu nawe.</p>
                        </div>
                        <button onClick={() => router.push('/market/map')} className="hidden sm:flex h-14 px-8 bg-brand-50 text-brand-700 rounded-2xl items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-600 hover:text-white transition-all border border-brand-100 shadow-sm">
                            <MapIcon size={18} /> MAP VIEW
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {marketsLoading && Array(3).fill(0).map((_, i) => (
                            <div key={i} className="h-48 bg-gray-50 animate-pulse rounded-[3rem]" />
                        ))}
                        
                        {markets.map((market, index) => (
                            <motion.div 
                                key={market.id} 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => router.push(`/market/${market.id}`)}
                                className="group relative bg-white rounded-[3rem] p-8 shadow-sm border border-gray-50 hover:shadow-2xl hover:shadow-brand-100/50 transition-all cursor-pointer overflow-hidden flex flex-col gap-6"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 opacity-50" />
                                
                                <div className="flex items-start justify-between">
                                    <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-all shadow-inner">
                                        <MapPin size={32} />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-brand-600 bg-brand-50 px-3 py-1.5 rounded-xl uppercase border border-brand-100">
                                            {market.traders_count} Traders
                                        </p>
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-black text-green-950 group-hover:text-brand-700 transition-colors leading-tight mb-1">{market.name}</h3>
                                    <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                        <MapPin size={12} className="text-amber-500" />
                                        {market.location}
                                    </p>
                                </div>
                                <div className="pt-4 flex items-center gap-2 text-brand-600 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                    View Schematic Map <ChevronRight size={14} />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}

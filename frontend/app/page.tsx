'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Search, MapPin, LayoutDashboard, Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { ApiResponse } from '@/types';
import BottomNav from '@/components/shared/BottomNav';
import NotificationBell from '@/components/shared/NotificationBell';
import NoticeFeed from '@/components/shared/NoticeFeed';
import RecommendationSection from '@/components/resident/RecommendationSection';
import CategoryFilter from '@/components/resident/CategoryFilter';

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

    return (
        <div className="flex flex-col min-h-screen bg-surface-base w-full flex-1 lg:flex-row relative">
            <div className="flex-1 w-full max-w-full lg:max-h-screen lg:overflow-y-auto no-scrollbar">
            {/* Top Bar */}
            <header className="p-4 flex items-center justify-between sticky top-0 bg-surface-base/80 backdrop-blur-md z-20 border-b border-border-default h-18">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white font-black shadow-brand-md">SM</div>
                    <span className="font-display font-black text-xl text-green-950 tracking-tighter">Soko Mtaa</span>
                </div>
                <div className="flex items-center gap-2">
                    {!user ? (
                        <div className="flex items-center gap-3 mr-1">
                            <button onClick={() => router.push('/login')} className="text-xs font-bold text-brand-700 hover:text-brand-800 transition-colors">
                                {t('home.sign_in')}
                            </button>
                            <button onClick={() => router.push('/register')} className="h-9 px-4 bg-brand-600 text-white rounded-xl text-xs font-black shadow-brand-sm active:scale-95 transition-all">
                                {t('home.sign_up')}
                            </button>
                        </div>
                    ) : (
                        <>
                            {user.role === 'trader' && (
                                <button 
                                    onClick={() => router.push('/dashboard')}
                                    className="p-2 h-11 px-4 flex items-center gap-2 rounded-xl bg-brand-50 text-brand-700 font-bold text-xs border border-brand-100 active:scale-95 transition-all"
                                >
                                    <LayoutDashboard size={18} /> Dash
                                </button>
                            )}
                            <NotificationBell />
                        </>
                    )}
                </div>
            </header>

            {/* Hero / Greeting */}
            <section className="p-6 pt-10 animate-fade-up">
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                        {user ? user.role : t('common.register')}
                    </span>
                    {user?.role === 'trader' && (
                        <span className="flex items-center gap-1 text-[10px] bg-brand-100 text-brand-700 font-black uppercase tracking-widest px-2 py-0.5 rounded-full animate-pulse-brand">
                             <Sparkles size={10} /> Live
                        </span>
                    )}
                </div>
                <h1 className="text-4xl mb-1 text-green-950 tracking-tight font-black">{t('home.greeting')}, {user?.name || t('home.guest')}!</h1>
                <p className="text-text-secondary text-base leading-snug">{t('home.subtitle')}</p>
            </section>

            {/* Search Bar - Stickyish */}
            <div className="px-6 mb-8 sticky top-16 z-10 py-2 bg-surface-base/80 backdrop-blur-sm">
                <div className="relative group cursor-pointer" onClick={() => router.push('/search')}>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-500 transition-colors" size={20} />
                    <input 
                        className="w-full h-[56px] pl-12 pr-4 bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-none cursor-pointer pointer-events-none placeholder:text-[#9CA3AF] text-[#1C1C1C]" 
                        placeholder={t('common.search_placeholder')} 
                        readOnly
                    />
                </div>
            </div>

            {/* Categories */}
            <section className="mb-10">
                <div className="flex items-center justify-between mb-5 px-6">
                    <h2 className="text-xl text-green-900 font-black">{t('home.categories_title')}</h2>
                </div>
                <div className="pb-4">
                    <CategoryFilter 
                        selectedCategoryId={null} 
                        onSelectCategory={(id) => {
                            if(id) router.push(`/search?category=${encodeURIComponent(id)}`);
                            else router.push('/search');
                        }} 
                    />
                </div>
            </section>

            {/* AI Recommendations */}
            <RecommendationSection />

            {/* Community Notices */}
            <NoticeFeed marketId={1} /> 

            {/* Featured Markets */}
            <section className="px-6 pb-28">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl text-green-900 font-black">{t('home.markets_title')}</h2>
                </div>
                <div className="space-y-4">
                    {marketsLoading && Array(2).fill(0).map((_, i) => (
                        <div key={i} className="h-28 bg-neutral-100 animate-pulse rounded-3xl" />
                    ))}
                    
                    {markets.map((market) => (
                        <div 
                            key={market.id} 
                            onClick={() => router.push(`/market/${market.id}`)}
                            className="card p-4 flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer hover:shadow-brand-md group"
                        >
                            <div className="w-20 h-20 grow-0 shrink-0 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 shadow-inner group-hover:bg-brand-100 transition-colors">
                                <MapPin size={32} />
                            </div>
                            <div className="overflow-hidden">
                                <h3 className="text-lg font-black text-green-900 group-hover:text-brand-600 transition-colors truncate">{market.name}</h3>
                                <p className="text-xs text-text-secondary flex items-center gap-1 font-bold">
                                    <MapPin size={12} className="text-amber-500" />
                                    {market.location}
                                </p>
                                <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full inline-block border border-brand-100">
                                    {market.traders_count} {t('home.traders_online')}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            
            </div>
            <BottomNav />
        </div>
    );
}

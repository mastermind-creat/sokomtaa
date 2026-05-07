'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { 
    ChevronLeft, 
    MapPin, 
    Store, 
    Tag, 
    Loader2, 
    ArrowRight,
    Search
} from 'lucide-react';
import { ApiResponse } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

interface MarketCategory {
    id: number;
    name: string;
}

interface MarketTrader {
    id: number;
    business_name: string;
    stall?: { stall_number: string };
}

interface Market {
    id: number;
    name: string;
    county: string;
    estate: string;
    traders_count: number;
}

export default function MarketDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { t } = useTranslation();
    const [selectedCategory, setSelectedCategory] = React.useState<number | null>(null);

    const { data: detailData, isLoading } = useQuery<ApiResponse<{
        market: Market;
        traders: { data: MarketTrader[] };
        categories: MarketCategory[];
    }>>({
        queryKey: ['market', id],
        queryFn: () => api.get(`/markets/${id}`),
    });

    const market = detailData?.data?.market;
    const traders = detailData?.data?.traders?.data || [];
    const categories = detailData?.data?.categories || [];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-brand-600" size={40} />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-surface-base w-full flex-1 pb-32">
            {/* Header */}
            <header className="relative h-64 w-full bg-green-900 overflow-hidden">
                <div className="absolute inset-0 bg-noise opacity-20 z-0"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                
                <button 
                    onClick={() => router.back()}
                    className="absolute top-12 left-6 w-11 h-11 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white z-20 border border-white/20 active:scale-90 transition-all"
                    aria-label="Rudi nyuma (Back)"
                    title="Rudi nyuma"
                >
                    <ChevronLeft size={24} />
                </button>

                <div className="absolute bottom-6 left-6 right-6 z-20">
                    <span className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 inline-block shadow-sm">
                        Soko la Jumuiya
                    </span>
                    <h1 className="text-3xl font-black text-white tracking-tight leading-tight">{market?.name}</h1>
                    <div className="flex items-center gap-1 text-white/80 text-sm mt-1">
                        <MapPin size={14} />
                        <span>{market?.county}, {market?.estate}</span>
                    </div>
                </div>
            </header>

            {/* Quick Stats / Info */}
            <section className="p-6 -mt-4 relative z-20">
                <div className="card bg-white p-4 flex justify-around shadow-brand-lg">
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Traders</p>
                        <p className="text-xl font-black text-green-950">{market?.traders_count}</p>
                    </div>
                    <div className="w-[1px] bg-border-default"></div>
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Status</p>
                        <p className="text-xl font-black text-brand-600">Open</p>
                    </div>
                </div>
            </section>

            {/* In-Market Search */}
            <div className="px-6 mb-8">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input 
                        className="input pl-12 h-14 !rounded-2xl border-neutral-200" 
                        placeholder="Tafuta mfanyabiashara hapa..." 
                    />
                </div>
            </div>

            {/* Categories */}
            <section className="px-6 mb-10">
                <h3 className="text-lg font-black text-green-950 mb-4 tracking-tight">Vyakula na Bidhaa / Items</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar">
                    <button 
                        onClick={() => setSelectedCategory(null)}
                        className={`flex items-center gap-2 px-4 h-11 rounded-2xl border-2 transition-all font-bold text-xs shrink-0 ${
                            selectedCategory === null ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-neutral-200 text-text-secondary bg-white'
                        }`}
                    >
                        Zote (All)
                    </button>
                    {categories.map((cat: MarketCategory) => (
                        <button 
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex items-center gap-2 px-4 h-11 rounded-2xl border-2 transition-all font-bold text-xs shrink-0 ${
                                selectedCategory === cat.id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-neutral-200 text-text-secondary bg-white'
                            }`}
                        >
                            <Tag size={14} />
                            {cat.name}
                        </button>
                    ))}
                </div>
            </section>

            {/* Trader Directory */}
            <section className="px-6 space-y-4">
                <h3 className="text-lg font-black text-green-950 mb-4 tracking-tight">Wafanyabiashara / Traders</h3>
                {traders.map((trader: MarketTrader) => (
                    <div 
                        key={trader.id}
                        onClick={() => router.push(`/trader/${trader.id}`)}
                        className="card p-4 flex gap-4 hover:border-brand-500 transition-all cursor-pointer group active:scale-[0.98]"
                    >
                        <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center grow-0 shrink-0 text-brand-600 shadow-inner">
                            <Store size={28} />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex items-center justify-between">
                                <h4 className="font-black text-green-950 truncate pr-2">{trader.business_name}</h4>
                                <ArrowRight size={18} className="text-text-muted group-hover:text-brand-600 transition-colors" />
                            </div>
                            <p className="text-xs text-text-muted font-bold mt-1 uppercase tracking-tight flex items-center gap-1">
                                <MapPin size={10} className="text-amber-500" />
                                Stall {trader.stall?.stall_number || 'N/A'}
                            </p>
                        </div>
                    </div>
                ))}
            </section>

        </div>
    );
}

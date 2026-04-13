"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse } from '@/types';
import { Star, MapPin, Store } from 'lucide-react';
import Link from 'next/link';

interface Market {
    id: number;
    name: string;
    location: string;
}

interface Trader {
    id: number;
    business_name: string;
    business_name_sw: string | null;
    avatar_url: string | null;
    average_rating: string | number;
    total_reviews: number;
    market: Market;
}

interface Product {
    id: number;
    name: string;
    price: string | number;
    unit: string;
    image_url: string | null;
    trader: Trader;
}

interface RecommendationsData {
    popular_products: Product[];
    top_traders: Trader[];
}

export default function RecommendationSection() {
    const { data: recommendationsData, isLoading } = useQuery<ApiResponse<RecommendationsData>>({
        queryKey: ['recommendations'],
        queryFn: () => api.get('/recommendations'),
    });

    const products = recommendationsData?.data?.popular_products || [];
    const traders = recommendationsData?.data?.top_traders || [];

    if (isLoading) {
        return (
            <div className="px-6 py-4 space-y-8 animate-pulse">
                <div>
                    <div className="h-6 w-48 bg-neutral-200 rounded-md mb-4"></div>
                    <div className="flex gap-4 overflow-x-hidden">
                        {[1, 2].map(n => (
                            <div key={n} className="min-w-[240px] h-[300px] bg-neutral-200 rounded-3xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (products.length === 0 && traders.length === 0) {
        return null; // Empty state managed handled by default UI usually
    }

    return (
        <div className="space-y-10 py-6">
            {/* Popular Products Carousel */}
            {products.length > 0 && (
                <div className="px-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-black text-green-950">Pendekezo Lako</h2>
                        <Link href="/search" className="text-sm font-bold text-brand-600">Onesha Zote</Link>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6 snap-x snap-mandatory">
                        {products.map(product => (
                            <Link key={product.id} href={`/resident/market/${product.trader.market.id}/trader/${product.trader.id}`} className="min-w-[260px] max-w-[260px] snap-center rounded-3xl bg-surface-card border border-border-default overflow-hidden shadow-brand-sm group active:scale-[0.98] transition-all">
                                <div className="h-44 bg-neutral-100 relative overflow-hidden">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-300">
                                            <Store size={48} />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold font-mono text-green-950 shadow-sm">
                                        KES {parseFloat(product.price as string).toLocaleString()} <span className="text-text-muted">/ {product.unit}</span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-text-primary text-lg truncate mb-1">{product.name}</h3>
                                    <div className="flex items-center gap-1.5 text-text-secondary text-sm mb-3">
                                        <Store size={14} className="text-brand-500" />
                                        <span className="truncate">{product.trader.business_name_sw || product.trader.business_name}</span>
                                    </div>
                                    <button className="btn btn-primary w-full h-10 rounded-xl text-sm font-bold shadow-sm">
                                        Tazama
                                    </button>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Top Traders Highlights */}
            {traders.length > 0 && (
                <div className="px-6">
                    <h2 className="text-xl font-black text-green-950 mb-4">Wafanyabiashara Bora</h2>
                    <div className="grid gap-4">
                        {traders.map(trader => (
                            <Link key={trader.id} href={`/resident/market/${trader.market.id}/trader/${trader.id}`} className="flex items-center gap-4 bg-surface-card p-4 rounded-3xl border border-border-default shadow-sm active:scale-[0.98] transition-all group">
                                <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center shrink-0 overflow-hidden">
                                    {trader.avatar_url ? (
                                        <img src={trader.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <Store size={24} className="text-brand-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-text-primary text-base truncate group-hover:text-brand-700 transition-colors">
                                        {trader.business_name_sw || trader.business_name}
                                    </h3>
                                    <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
                                        <span className="flex items-center gap-1">
                                            <Star size={12} className="text-amber-500 fill-amber-500" />
                                            <span className="font-bold text-text-primary">{trader.average_rating}</span> 
                                            ({trader.total_reviews})
                                        </span>
                                        <span className="flex items-center gap-1 truncate">
                                            <MapPin size={12} />
                                            <span className="truncate">{trader.market.name}</span>
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

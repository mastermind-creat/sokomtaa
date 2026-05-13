"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse } from '@/types';
import { Star, MapPin, Store } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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
    boosted_products: Product[];
    popular_products: Product[];
    top_traders: Trader[];
}

import { useLocationStore } from '@/store/locationStore';

export default function RecommendationSection() {
    const { coords } = useLocationStore();

    const { data: recommendationsData, isLoading } = useQuery<ApiResponse<RecommendationsData>>({
        queryKey: ['recommendations', coords?.lat, coords?.lng],
        queryFn: () => {
            const params = coords ? `?lat=${coords.lat}&lng=${coords.lng}` : '';
            return api.get(`/recommendations${params}`);
        },
    });

    // Handle both wrapped and unwrapped data formats with proper typing
    const data = recommendationsData?.data || (recommendationsData as unknown as RecommendationsData);
    const boosted = data?.boosted_products || [];
    const products = data?.popular_products || [];
    const traders = data?.top_traders || [];

    if (isLoading) {
        return (
            <div className="px-6 py-4 space-y-8 animate-pulse">
                <div>
                    <div className="h-6 w-48 bg-neutral-200 rounded-md mb-4"></div>
                    <div className="flex gap-4 overflow-x-hidden">
                        {[1, 2].map((n: number) => (
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
            {/* Boosted Products (Micro-Ads) */}
            {boosted.length > 0 && (
                <div className="px-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-black text-green-950">Sponsored Picks</h2>
                            <span className="text-[8px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 uppercase tracking-widest">Ad</span>
                        </div>
                    </div>
                    <div className="flex gap-3 md:gap-6 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6 snap-x snap-mandatory">
                        {boosted.map(product => (
                            <Link key={product.id} href={`/resident/market/${product.trader.market.id}/trader/${product.trader.id}`} className="min-w-[180px] md:min-w-[260px] snap-center rounded-2xl md:rounded-3xl bg-white border border-amber-200 overflow-hidden shadow-brand-sm group active:scale-[0.98] transition-all flex flex-col relative">
                                <div className="absolute top-2 right-2 md:top-3 md:right-3 z-10">
                                    <div className="bg-amber-500 text-white p-1 md:p-2 rounded-lg shadow-lg">
                                        <Star size={12} className="fill-white" />
                                    </div>
                                </div>
                                <div className="h-32 md:h-44 bg-neutral-100 relative overflow-hidden">
                                    {product.image_url ? (
                                        <Image 
                                            src={product.image_url} 
                                            alt={product.name} 
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500" 
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-300">
                                            <Store size={32} />
                                        </div>
                                    )}
                                    <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-white/90 backdrop-blur-sm px-2 md:px-3 py-0.5 md:py-1 rounded-lg md:rounded-full text-[8px] md:text-xs font-black font-mono text-green-950 shadow-sm">
                                        KES {Math.round(parseFloat(product.price as string))}
                                    </div>
                                </div>
                                <div className="p-3 md:p-4 flex-1 flex flex-col bg-amber-50/30">
                                    <h3 className="font-black text-green-950 text-xs md:text-lg truncate mb-1 uppercase">{product.name}</h3>
                                    <div className="flex items-center gap-1.5 text-text-secondary text-[8px] md:text-sm mb-3">
                                        <Store size={12} className="text-amber-600" />
                                        <span className="truncate font-bold">{product.trader.business_name}</span>
                                    </div>
                                    <button className="mt-auto w-full h-8 md:h-10 bg-amber-500 text-white rounded-lg md:rounded-xl text-[8px] md:text-sm font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-md shadow-amber-200">
                                        Grab Now
                                    </button>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
            {/* Popular Products Carousel */}
            {products.length > 0 && (
                <div className="px-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-black text-green-950">Recommended</h2>
                        <Link href="/resident/search" className="text-xs font-black uppercase tracking-widest text-brand-600">View All</Link>
                    </div>
                    <div className="flex gap-3 md:gap-6 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6 snap-x snap-mandatory">
                        {products.map(product => (
                            <Link key={product.id} href={`/resident/market/${product.trader.market.id}/trader/${product.trader.id}`} className="min-w-[180px] md:min-w-[260px] snap-center rounded-2xl md:rounded-3xl bg-white border border-gray-100 overflow-hidden shadow-brand-sm group active:scale-[0.98] transition-all flex flex-col">
                                <div className="h-32 md:h-44 bg-neutral-100 relative overflow-hidden">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-300">
                                            <Store size={32} />
                                        </div>
                                    )}
                                    <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-white/90 backdrop-blur-sm px-2 md:px-3 py-0.5 md:py-1 rounded-lg md:rounded-full text-[8px] md:text-xs font-black font-mono text-green-950 shadow-sm">
                                        KES {Math.round(parseFloat(product.price as string))}
                                    </div>
                                </div>
                                <div className="p-3 md:p-4 flex-1 flex flex-col">
                                    <h3 className="font-black text-green-950 text-xs md:text-lg truncate mb-1 uppercase">{product.name}</h3>
                                    <div className="flex items-center gap-1.5 text-text-secondary text-[8px] md:text-sm mb-3">
                                        <Store size={12} className="text-brand-500" />
                                        <span className="truncate">{product.trader.business_name}</span>
                                    </div>
                                    <button className="mt-auto w-full h-8 md:h-10 bg-brand-50 text-brand-700 rounded-lg md:rounded-xl text-[8px] md:text-sm font-black uppercase tracking-widest hover:bg-brand-600 hover:text-white transition-all">
                                        View Item
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
                    <h2 className="text-xl font-black text-green-950 mb-4">Top Traders</h2>
                    <div className="grid grid-cols-2 md:grid-cols-1 gap-3 md:gap-4">
                        {traders.map(trader => (
                            <Link key={trader.id} href={`/resident/market/${trader.market.id}/trader/${trader.id}`} className="flex flex-col md:flex-row items-center md:items-center gap-3 bg-white p-3 md:p-4 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm active:scale-[0.98] transition-all group">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-brand-50 flex items-center justify-center shrink-0 overflow-hidden shadow-inner relative">
                                    {trader.avatar_url ? (
                                        <Image 
                                            src={trader.avatar_url} 
                                            alt={trader.business_name} 
                                            fill
                                            className="object-cover" 
                                        />
                                    ) : (
                                        <Store size={20} className="text-brand-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 text-center md:text-left">
                                    <h3 className="font-black text-green-950 text-xs md:text-base truncate group-hover:text-brand-700 transition-colors uppercase">
                                        {trader.business_name}
                                    </h3>
                                    <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3 text-[8px] md:text-xs text-text-secondary mt-1">
                                        <span className="flex items-center gap-1">
                                            <Star size={10} className="text-amber-500 fill-amber-500" />
                                            <span className="font-black text-green-950">{trader.average_rating}</span> 
                                        </span>
                                        <span className="hidden md:block w-1 h-1 rounded-full bg-gray-300" />
                                        <span className="flex items-center gap-1 truncate opacity-70">
                                            <MapPin size={10} />
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

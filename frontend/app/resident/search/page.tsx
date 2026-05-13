"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse } from '@/types';
import { ChevronLeft, Search, Frown, Loader2, Store, MapPin, Package } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '@/hooks/useTranslation';
import { useLocationStore } from '@/store/locationStore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SearchResult {
    id: number;
    search_type: 'product' | 'trader' | 'market';
    name?: string;
    name_sw?: string;
    business_name?: string;
    business_name_sw?: string;
    price?: number;
    unit?: string;
    image_url?: string;
    avatar_url?: string;
    trader?: { id: number; market_id: number; business_name?: string; business_name_sw?: string; avatar_url?: string };
    market?: { id: number; name: string; location?: string };
    location?: string;
    distance_km?: number;
}

interface SearchResponse {
    results: SearchResult[];
    total: number;
    breakdown: {
        products: number;
        traders: number;
        markets: number;
    };
}

function SearchPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { t, locale } = useTranslation();
    const query = searchParams.get('q') || '';
    const categoryId = searchParams.get('category') || '';
    
    const { coords } = useLocationStore();
    
    const [inputValue, setInputValue] = useState(query);

    const { data: searchData, isLoading, isError } = useQuery<ApiResponse<SearchResponse>>({
        queryKey: ['search', query, categoryId, coords?.lat, coords?.lng],
        queryFn: () => {
            let url = `/search?q=${encodeURIComponent(query)}&category=${categoryId}`;
            if (coords) {
                url += `&lat=${coords.lat}&lng=${coords.lng}`;
            }
            return api.get(url);
        },
        enabled: query.length >= 2 || categoryId.length > 0,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim().length >= 2 || categoryId) {
            router.push(`/resident/search?q=${encodeURIComponent(inputValue)}${categoryId ? `&category=${categoryId}` : ''}`);
        }
    };

    const results = searchData?.data?.results || [];

    // State for comparison view
    const [selectedGroup, setSelectedGroup] = useState<any>(null);

    // Group products by name for price comparison
    const processedResults = React.useMemo(() => {
        const productGroups: Record<string, any[]> = {};
        const nonProducts: any[] = [];

        results.forEach((res: any) => {
            if (res.search_type === 'product') {
                const key = (res.name || res.name_sw || '').toLowerCase().trim();
                if (!productGroups[key]) productGroups[key] = [];
                productGroups[key].push(res);
            } else {
                nonProducts.push(res);
            }
        });

        const final: any[] = [];
        
        // Process product groups
        Object.entries(productGroups).forEach(([name, group]) => {
            if (group.length > 1) {
                // Find min and max price
                const prices = group.map(p => Number(p.price));
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                
                // Sort group by price
                const sortedGroup = [...group].sort((a, b) => Number(a.price) - Number(b.price));
                
                // The "Main" card for this group
                const bestDeal = sortedGroup[0];
                final.push({
                    ...bestDeal,
                    is_grouped: true,
                    min_price: minPrice,
                    max_price: maxPrice,
                    sellers_count: group.length,
                    all_sellers: sortedGroup
                });
            } else {
                final.push(group[0]);
            }
        });

        // Add non-products and sort everything by distance or score
        return [...final, ...nonProducts].sort((a, b) => {
            if (a.is_boosted && !b.is_boosted) return -1;
            if (!a.is_boosted && b.is_boosted) return 1;
            return 0;
        });
    }, [results]);

    return (
        <div className="flex flex-col min-h-screen bg-surface-base pb-32">
            {/* Search Header */}
            <header className="p-6 pt-12 sticky top-0 bg-surface-base/80 backdrop-blur-md z-10 border-b border-border-default">
                <div className="flex gap-3">
                    <button 
                        onClick={() => router.back()} 
                        className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white border border-border-default active:scale-90 transition-all shrink-0"
                        aria-label={t('common.back')}
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <form onSubmit={handleSearch} className="relative flex-1">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search size={20} className="text-brand-500" />
                        </div>
                        <input 
                            type="text" 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="w-full h-14 pl-12 pr-4 bg-white rounded-2xl border-2 border-transparent shadow-brand-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 focus:outline-none transition-all placeholder:text-text-muted text-text-primary text-base font-medium"
                            placeholder={t('common.search_placeholder')}
                            autoFocus
                        />
                        {categoryId && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1 bg-brand-50 border border-brand-100 rounded-lg animate-fade-in">
                                <span className="text-[10px] font-black text-brand-700 uppercase tracking-tighter">Category Selected</span>
                                <button 
                                    type="button"
                                    onClick={() => router.push(`/resident/search?q=${encodeURIComponent(query)}`)}
                                    className="p-1 hover:bg-brand-200 rounded-full transition-colors"
                                >
                                    <span className="text-brand-700 font-bold">×</span>
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </header>

            {/* Results Body */}
            <main className="p-6 animate-fade-up">
                {(query.length < 2 && !categoryId) ? (
                    <div className="flex flex-col items-center justify-center py-20 text-text-muted text-center">
                        <Search size={48} className="mb-4 opacity-20" />
                        <p className="font-medium">
                            {categoryId ? 'Loading category items...' : (t('search.min_chars') || 'Type 2 or more characters to search.')}
                        </p>
                    </div>
                ) : isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-brand-600">
                        <Loader2 size={40} className="animate-spin mb-4" />
                        <p className="font-bold">{t('common.loading')}</p>
                    </div>
                ) : isError ? (
                    <div className="flex flex-col items-center justify-center py-20 text-color-error text-center">
                        <Frown size={48} className="mb-4 opacity-50" />
                        <p className="font-bold mb-1">{t('common.error')}</p>
                    </div>
                ) : processedResults.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Frown size={48} className="mb-4 text-neutral-300" />
                        <p className="font-bold text-text-primary mb-1">
                            {categoryId 
                                ? 'No items found in this category.' 
                                : t('search.no_results').replace('{query}', query)}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
                                {t('search.results_count').replace('{total}', searchData?.data.total.toString() || '0')}
                            </h2>
                            {results.some((r: any) => r.search_type === 'product') && (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-white rounded-lg border border-amber-400 shadow-sm shadow-amber-200 animate-pulse">
                                    <Package size={12} className="fill-white" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Market Comparison Active</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {processedResults.map((result: any) => (
                                <div 
                                    key={`${result.search_type}-${result.id}`} 
                                    className={cn(
                                        "flex flex-col bg-white rounded-[2.5rem] border shadow-sm transition-all group overflow-hidden relative",
                                        result.is_grouped ? "border-amber-400 ring-4 ring-amber-500/10 shadow-xl shadow-amber-900/5" : "border-border-default"
                                    )}
                                >
                                    <div className={`aspect-square w-full flex items-center justify-center shrink-0 overflow-hidden relative ${result.search_type === 'market' ? 'bg-amber-50 text-amber-600' : 'bg-brand-50 text-brand-500'}`}>
                                        {(result.image_url || result.avatar_url) ? (
                                            <Image 
                                                src={(result.image_url || result.avatar_url)!} 
                                                alt="" 
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500" 
                                            />
                                        ) : (
                                            result.search_type === 'product' ? <Package size={32} className="opacity-20" /> :
                                            result.search_type === 'trader' ? <Store size={32} className="opacity-20" /> :
                                            <MapPin size={32} className="opacity-20" />
                                        )}
                                        
                                        <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
                                            <span className={cn(
                                                "text-[8px] uppercase font-black tracking-widest px-2.5 py-1.5 rounded-xl backdrop-blur-md border shadow-sm",
                                                result.is_grouped ? "bg-amber-500 text-white border-amber-400 animate-bounce-subtle" : (
                                                    result.search_type === 'product' ? 'bg-white/90 text-green-700 border-green-100' :
                                                    result.search_type === 'trader' ? 'bg-white/90 text-blue-700 border-blue-100' :
                                                    'bg-white/90 text-amber-700 border-amber-100'
                                                )
                                            )}>
                                                {result.is_grouped ? '✨ Smart Deal' : t(`common.${result.search_type}`)}
                                            </span>
                                            {result.is_grouped && (
                                                <span className="text-[7px] uppercase font-black tracking-widest px-2 py-1 rounded-lg bg-amber-950 text-white border border-amber-800 shadow-lg">
                                                    Save KES {result.max_price - result.min_price}
                                                </span>
                                            )}
                                        </div>

                                        {/* Closed Status Overlay */}
                                        {!result.is_grouped && (
                                            <div className="absolute top-3 right-3">
                                                {((result.search_type === 'product' && !result.trader?.is_currently_open) || (result.search_type === 'trader' && !result.is_currently_open)) && (
                                                    <span className="text-[7px] font-black bg-neutral-800/80 backdrop-blur-sm text-white px-2 py-1 rounded-lg uppercase tracking-tighter shadow-sm">Closed</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="p-4 flex-1 flex flex-col">
                                        <h3 className="font-bold text-green-950 text-sm line-clamp-2 mb-1 group-hover:text-brand-700 transition-colors uppercase">
                                            {result.search_type === 'product' ? (locale === 'sw' ? (result.name_sw || result.name) : result.name) :
                                             result.search_type === 'trader' ? (locale === 'sw' ? (result.business_name_sw || result.business_name) : result.business_name) :
                                             result.name}
                                        </h3>
                                        
                                        <div className="mt-auto pt-2 space-y-3">
                                            {result.search_type === 'product' && (
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-baseline justify-between">
                                                        <div className="flex items-baseline gap-1">
                                                            <span className={cn(
                                                                "text-sm font-black font-mono",
                                                                result.is_grouped ? "text-amber-600" : "text-brand-600"
                                                            )}>KES {result.price}</span>
                                                            <span className="text-[10px] text-text-muted lowercase font-bold">/{result.unit}</span>
                                                        </div>
                                                        {result.is_grouped && (
                                                            <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                                                                {result.sellers_count} Options
                                                            </span>
                                                        )}
                                                    </div>
                                                    {result.is_grouped && (
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 w-full" />
                                                            </div>
                                                            <p className="text-[7px] font-black text-amber-700 uppercase tracking-widest whitespace-nowrap">
                                                                Best vs Peak
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {result.is_grouped ? (
                                                <button 
                                                    onClick={() => setSelectedGroup(result)}
                                                    className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-200 active:scale-95 transition-all flex items-center justify-center gap-2 group/btn"
                                                >
                                                    <Package size={14} className="group-hover/btn:rotate-12 transition-transform" />
                                                    Compare All Prices
                                                </button>
                                            ) : (
                                                <Link 
                                                    href={
                                                        result.search_type === 'product' ? `/trader/${result.trader?.id}` :
                                                        result.search_type === 'trader' ? `/trader/${result.id}` :
                                                        `/market/${result.id}`
                                                    }
                                                    className="w-full h-10 bg-brand-50 text-brand-700 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center hover:bg-brand-600 hover:text-white transition-all shadow-sm"
                                                >
                                                    View Details
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Comparison Bottom Sheet */}
            <AnimatePresence>
                {selectedGroup && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedGroup(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        />
                        <motion.div 
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[3rem] z-[101] max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
                        >
                            <div className="p-6 pb-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="px-2 py-0.5 bg-amber-500 text-white text-[8px] font-black uppercase rounded shadow-sm">Live</div>
                                        <p className="text-[10px] font-black text-brand-600 uppercase tracking-[0.2em]">Market Price Leaderboard</p>
                                    </div>
                                    <h2 className="text-xl font-black text-green-950 uppercase leading-tight">{selectedGroup.name}</h2>
                                </div>
                                <button 
                                    onClick={() => setSelectedGroup(null)}
                                    className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-green-950 font-bold hover:bg-gray-100 transition-colors"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="bg-brand-50/50 p-6 flex items-center justify-between border-b border-brand-100">
                                <div>
                                    <p className="text-[9px] font-black text-brand-700 uppercase tracking-widest mb-1">Market Leader</p>
                                    <p className="text-sm font-black text-green-950">
                                        Save up to <span className="text-brand-600 font-mono">KES {selectedGroup.max_price - selectedGroup.min_price}</span> today
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Price Range</p>
                                    <p className="text-sm font-black text-green-950 font-mono">
                                        {selectedGroup.min_price} - {selectedGroup.max_price}
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                                {selectedGroup.all_sellers.map((seller: any, idx: number) => (
                                    <Link 
                                        key={seller.id} 
                                        href={`/trader/${seller.trader.id}`}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-[0.98] relative overflow-hidden",
                                            idx === 0 
                                                ? "bg-white border-brand-500 ring-2 ring-brand-50 shadow-brand-sm" 
                                                : "bg-white border-gray-100 hover:border-brand-200"
                                        )}
                                    >
                                        {idx === 0 && (
                                            <div className="absolute top-0 right-0">
                                                <div className="bg-brand-600 text-white text-[7px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-tighter shadow-sm">
                                                    Best Deal
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="w-14 h-14 rounded-xl bg-gray-50 relative overflow-hidden shrink-0 border border-gray-100">
                                            {seller.trader.avatar_url ? (
                                                <Image src={seller.trader.avatar_url} alt="" fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <Store size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-green-950 text-sm truncate uppercase mb-1">{seller.trader.business_name}</h4>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted">
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={10} className="text-amber-500" />
                                                    {seller.market?.name || 'Local Market'}
                                                </span>
                                                {seller.distance_km !== undefined && (
                                                    <span className="w-1 h-1 rounded-full bg-gray-200" />
                                                )}
                                                {seller.distance_km !== undefined && (
                                                    <span className="text-brand-600">{seller.distance_km} km</span>
                                                )}
                                                {(!seller.trader?.is_currently_open) && (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-gray-200" />
                                                        <span className="text-red-500 font-black">CLOSED</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex flex-col items-end">
                                                <p className={cn(
                                                    "text-lg font-black font-mono leading-none mb-0.5",
                                                    idx === 0 ? "text-brand-600" : "text-green-950"
                                                )}>
                                                    KES {seller.price}
                                                </p>
                                                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest leading-none">per {seller.unit}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-100">
                                <p className="text-[10px] text-center font-bold text-text-muted uppercase tracking-widest">
                                    Prices verified by Soko Mtaa traders.
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen bg-surface-base">
                <Loader2 size={40} className="animate-spin text-brand-500 mb-4" />
                <p className="font-bold text-brand-600">Inapakia...</p>
            </div>
        }>
            <SearchPageContent />
        </Suspense>
    );
}

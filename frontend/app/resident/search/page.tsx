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
    
    const [inputValue, setInputValue] = useState(query);

    const { data: searchData, isLoading, isError } = useQuery<ApiResponse<SearchResponse>>({
        queryKey: ['search', query, categoryId],
        queryFn: () => api.get(`/search?q=${encodeURIComponent(query)}&category=${categoryId}`),
        enabled: query.length >= 2 || categoryId.length > 0,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim().length >= 2 || categoryId) {
            router.push(`/resident/search?q=${encodeURIComponent(inputValue)}${categoryId ? `&category=${categoryId}` : ''}`);
        }
    };

    const results = searchData?.data?.results || [];

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
                ) : results.length === 0 ? (
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
                        <h2 className="text-sm font-bold text-text-secondary mb-2 uppercase tracking-wider">
                            {t('search.results_count').replace('{total}', searchData?.data.total.toString() || '0')}
                        </h2>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {results.map((result) => (
                                <Link 
                                    key={`${result.search_type}-${result.id}`} 
                                    href={
                                        result.search_type === 'product' ? `/trader/${result.trader?.id}` :
                                        result.search_type === 'trader' ? `/trader/${result.id}` :
                                        `/market/${result.id}`
                                    }
                                    className="flex flex-col bg-white rounded-3xl border border-border-default shadow-sm active:scale-[0.98] transition-all group overflow-hidden"
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
                                        
                                        <div className="absolute top-3 left-3">
                                            <span className={`text-[8px] uppercase font-black tracking-widest px-2 py-1 rounded-lg backdrop-blur-md border ${
                                                result.search_type === 'product' ? 'bg-green-500/10 text-green-700 border-green-200' :
                                                result.search_type === 'trader' ? 'bg-blue-500/10 text-blue-700 border-blue-200' :
                                                'bg-amber-500/10 text-amber-700 border-amber-200'
                                            }`}>
                                                {t(`common.${result.search_type}`)}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 flex-1 flex flex-col">
                                        <h3 className="font-bold text-green-950 text-sm line-clamp-2 mb-1 group-hover:text-brand-700 transition-colors">
                                            {result.search_type === 'product' ? (locale === 'sw' ? (result.name_sw || result.name) : result.name) :
                                             result.search_type === 'trader' ? (locale === 'sw' ? (result.business_name_sw || result.business_name) : result.business_name) :
                                             result.name}
                                        </h3>
                                        
                                        <div className="mt-auto pt-2">
                                            {result.search_type === 'product' && (
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-xs font-black text-brand-600 font-mono">KES {result.price}</span>
                                                    <span className="text-[10px] text-text-muted lowercase font-bold">/{result.unit}</span>
                                                </div>
                                            )}
                                            {result.search_type === 'trader' && (
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary">
                                                    <MapPin size={10} className="text-amber-500" />
                                                    <span className="truncate">{result.market?.name}</span>
                                                </div>
                                            )}
                                            {result.search_type === 'market' && (
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary">
                                                    <MapPin size={10} className="text-amber-500" />
                                                    <span className="truncate">{result.location}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </main>
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

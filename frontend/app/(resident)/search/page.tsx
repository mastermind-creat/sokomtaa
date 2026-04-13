"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse } from '@/types';
import { ChevronLeft, Search, Frown, Loader2, Store, MapPin, Package } from 'lucide-react';
import Link from 'next/link';

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
    const query = searchParams.get('q') || '';
    
    const [inputValue, setInputValue] = useState(query);

    const { data: searchData, isLoading, isError } = useQuery<ApiResponse<SearchResponse>>({
        queryKey: ['search', query],
        queryFn: () => api.get(`/search?q=${encodeURIComponent(query)}`),
        enabled: query.length >= 2,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim().length >= 2) {
            router.push(`/resident/search?q=${encodeURIComponent(inputValue)}`);
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
                        aria-label="Rudi nyuma (Back)"
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
                            placeholder="Tafuta..."
                            autoFocus
                        />
                    </form>
                </div>
            </header>

            {/* Results Body */}
            <main className="p-6 animate-fade-up">
                {query.length < 2 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-text-muted text-center">
                        <Search size={48} className="mb-4 opacity-20" />
                        <p className="font-medium">Andika herufi 2 au zaidi kuanza utafutaji.</p>
                        <p className="text-sm mt-1">(Type 2 or more characters to search)</p>
                    </div>
                ) : isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-brand-600">
                        <Loader2 size={40} className="animate-spin mb-4" />
                        <p className="font-bold">Inatafuta...</p>
                    </div>
                ) : isError ? (
                    <div className="flex flex-col items-center justify-center py-20 text-color-error text-center">
                        <Frown size={48} className="mb-4 opacity-50" />
                        <p className="font-bold mb-1">Samahani, kuna tatizo.</p>
                        <p className="text-sm text-text-secondary">Jaribu tena baadae.</p>
                    </div>
                ) : results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Frown size={48} className="mb-4 text-neutral-300" />
                        <p className="font-bold text-text-primary mb-1">Hatujapata matokeo ya &quot;{query}&quot;</p>
                        <p className="text-sm text-text-secondary">Jaribu kutumia maneno mengine.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h2 className="text-sm font-bold text-text-secondary mb-2 uppercase tracking-wider">
                            Matokeo ({searchData?.data.total})
                        </h2>
                        
                        <div className="grid gap-4">
                            {results.map((result) => (
                                <Link 
                                    key={`${result.search_type}-${result.id}`} 
                                    href={
                                        result.search_type === 'product' ? `/resident/market/${result.trader?.market_id}/trader/${result.trader?.id}` :
                                        result.search_type === 'trader' ? `/resident/market/${result.market?.id}/trader/${result.id}` :
                                        `/resident/market/${result.id}`
                                    }
                                    className="flex items-center gap-4 bg-surface-card p-4 rounded-3xl border border-border-default shadow-sm active:scale-[0.98] transition-all group"
                                >
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden ${result.search_type === 'market' ? 'bg-amber-100 text-amber-600' : 'bg-brand-50 text-brand-500'}`}>
                                        {(result.image_url || result.avatar_url) ? (
                                            <img src={(result.image_url || result.avatar_url)!} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            result.search_type === 'product' ? <Package size={24} /> :
                                            result.search_type === 'trader' ? <Store size={24} /> :
                                            <MapPin size={24} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-md ${
                                                result.search_type === 'product' ? 'bg-green-100 text-green-700' :
                                                result.search_type === 'trader' ? 'bg-blue-100 text-blue-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                                {result.search_type}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-text-primary text-base truncate group-hover:text-brand-700 transition-colors">
                                            {result.search_type === 'product' ? (result.name_sw || result.name) :
                                             result.search_type === 'trader' ? (result.business_name_sw || result.business_name) :
                                             result.name}
                                        </h3>
                                        <div className="text-xs text-text-secondary mt-1 truncate">
                                            {result.search_type === 'product' && `KES ${result.price} / ${result.unit}`}
                                            {result.search_type === 'trader' && result.market?.name}
                                            {result.search_type === 'market' && result.location}
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

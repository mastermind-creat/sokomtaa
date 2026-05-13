"use client";

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocationStore } from '@/store/locationStore';

export default function SearchBar() {
    const [query, setQuery] = useState('');
    const router = useRouter();

    const { coords } = useLocationStore();

    // Debounce the search submission
    useEffect(() => {
        const handler = setTimeout(() => {
            if (query.trim().length > 1) {
                let url = `/resident/search?q=${encodeURIComponent(query)}`;
                if (coords) {
                    url += `&lat=${coords.lat}&lng=${coords.lng}`;
                }
                router.push(url);
            } else if (query.length === 0) {
                // If cleared on the search page, might want to route back or clear results.
                // For now, we leave it.
            }
        }, 600); // 600ms debounce

        return () => {
            clearTimeout(handler);
        };
    }, [query, router]);

    return (
        <div className="relative w-full max-w-md mx-auto z-20 group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search size={20} className="text-brand-500 group-focus-within:text-brand-600 transition-colors" />
            </div>
            <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-12 bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 focus:outline-none transition-all placeholder:text-[#9CA3AF] text-[#1C1C1C] text-lg"
                placeholder="Tafuta bidhaa, wafanyabiashara..."
            />
            {query && (
                <button 
                    onClick={() => setQuery('')}
                    className="absolute inset-y-0 right-4 flex items-center text-text-muted hover:text-text-primary transition-colors"
                    aria-label="Futa (Clear search)"
                    title="Futa utafutaji"
                >
                    <X size={20} />
                </button>
            )}
        </div>
    );
}

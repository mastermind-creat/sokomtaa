'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, Market, Region } from '@/types';
import { 
    Search, 
    MapPin, 
    Filter, 
    ArrowRight, 
    Store, 
    Navigation, 
    Loader2, 
    ChevronLeft,
    Globe,
    Map as MapIcon,
    List
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import dynamic from 'next/dynamic';

const DiscoveryMap = dynamic(() => import('@/components/map/DiscoveryMap'), { 
    ssr: false, 
    loading: () => (
        <div className="w-full h-[calc(100vh-200px)] bg-gray-50 flex items-center justify-center rounded-[2.5rem] animate-pulse">
            <Loader2 className="w-10 h-10 animate-spin text-brand-300" />
        </div>
    )
});

export default function ExploreMarketsPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

    // Fetch Regions
    const { data: regionsData } = useQuery<ApiResponse<Region[]>>({
        queryKey: ['regions'],
        queryFn: () => api.get('/regions'),
    });
    const regions = regionsData?.data || [];

    // Fetch Markets
    const { data: marketsData, isLoading } = useQuery<ApiResponse<Market[]>>({
        queryKey: ['markets', searchQuery, selectedRegionId],
        queryFn: () => {
            const params = new URLSearchParams();
            if (searchQuery) params.append('q', searchQuery);
            if (selectedRegionId) params.append('region_id', selectedRegionId.toString());
            return api.get(`/markets?${params.toString()}`);
        },
    });
    const markets = marketsData?.data || [];

    return (
        <div className="min-h-screen bg-[#FAFAF8] pb-32 lg:pb-12">
            {/* Header / Search Area */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4 lg:py-6">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.back()}
                            className="w-10 h-10 lg:w-12 lg:h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-green-950 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl lg:text-2xl font-black text-green-950 tracking-tight uppercase leading-none">Explore Markets</h1>
                            <p className="text-[10px] lg:text-xs font-bold text-brand-600 uppercase tracking-widest mt-1">Discover your local neighborhood market</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 lg:w-[400px]">
                        <div className="relative flex-1 group">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-600 transition-colors" />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name..."
                                className="w-full h-12 lg:h-14 pl-12 pr-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
                            />
                        </div>
                        
                        {/* View Mode Toggle */}
                        <div className="flex bg-gray-100 p-1 rounded-2xl h-12 lg:h-14">
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    "flex items-center justify-center w-12 lg:w-14 rounded-xl transition-all",
                                    viewMode === 'list' ? "bg-white text-green-950 shadow-sm" : "text-gray-400 hover:text-green-950"
                                )}
                            >
                                <List size={20} />
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={cn(
                                    "flex items-center justify-center w-12 lg:w-14 rounded-xl transition-all",
                                    viewMode === 'map' ? "bg-brand-600 text-white shadow-sm" : "text-gray-400 hover:text-green-950"
                                )}
                            >
                                <MapIcon size={20} />
                            </button>
                        </div>

                        <button 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={cn(
                                "w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center transition-all border shadow-sm shrink-0",
                                isFilterOpen || selectedRegionId
                                    ? "bg-brand-600 text-white border-brand-600"
                                    : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"
                            )}
                        >
                            <Filter size={20} />
                        </button>
                    </div>
                </div>

                {/* Region Filter Ribbon */}
                <AnimatePresence>
                    {(isFilterOpen || selectedRegionId) && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="max-w-7xl mx-auto pt-4 pb-2">
                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                                    <button 
                                        onClick={() => setSelectedRegionId(null)}
                                        className={cn(
                                            "flex-shrink-0 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                            selectedRegionId === null
                                                ? "bg-brand-600 text-white border-brand-600 shadow-brand-200"
                                                : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"
                                        )}
                                    >
                                        All Regions
                                    </button>
                                    {regions.map((region) => (
                                        <button 
                                            key={region.id}
                                            onClick={() => setSelectedRegionId(region.id)}
                                            className={cn(
                                                "flex-shrink-0 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                                selectedRegionId === region.id
                                                    ? "bg-brand-600 text-white border-brand-600 shadow-brand-200"
                                                    : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"
                                            )}
                                        >
                                            {region.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Main Content */}
            {viewMode === 'map' ? (
                <div className="w-full px-4 lg:px-6 py-4">
                    <DiscoveryMap />
                </div>
            ) : (
                <main className="max-w-7xl mx-auto px-6 py-8">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-brand-600">
                            <Loader2 size={48} className="animate-spin mb-4" />
                            <p className="font-black uppercase tracking-widest text-xs">Finding Markets...</p>
                        </div>
                    ) : markets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                <MapPin size={40} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-black text-green-950 uppercase">No Markets Found</h3>
                                <p className="text-sm font-medium text-text-muted">Try adjusting your search or region filters.</p>
                            </div>
                            <button 
                                onClick={() => {setSearchQuery(''); setSelectedRegionId(null);}}
                                className="px-8 py-3 bg-brand-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-200 active:scale-95 transition-all"
                            >
                                Reset Filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {markets.map((market, idx) => (
                                <motion.div 
                                    key={market.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => router.push(`/resident/markets/${market.id}`)}
                                    className="group relative bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-brand-100/50 transition-all cursor-pointer overflow-hidden flex flex-col gap-6"
                                >
                                    {/* Decorative circle */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 opacity-50" />
                                    
                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-all shadow-inner">
                                            <Globe size={24} />
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-black text-brand-600 bg-brand-50 px-3 py-1 rounded-xl uppercase border border-brand-100">
                                                {market.active_stalls_count || 0} Traders
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2 relative z-10">
                                        <h3 className="text-2xl font-black text-green-950 group-hover:text-brand-700 transition-colors leading-tight uppercase tracking-tight">{market.name}</h3>
                                        <div className="flex flex-col gap-1.5">
                                            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest flex items-center gap-1.5">
                                                <MapPin size={12} className="text-amber-500" />
                                                {market.location}
                                            </p>
                                            <p className="text-[10px] text-brand-600 font-black uppercase tracking-widest opacity-80">
                                                {market.county} • {market.estate}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex items-center justify-between mt-auto relative z-10">
                                        <div className="flex items-center gap-2 text-brand-600 font-black text-[10px] uppercase tracking-widest">
                                            View Market <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setViewMode('map');
                                            }}
                                            className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-brand-600 hover:border-brand-200 hover:bg-brand-50 transition-all shadow-sm"
                                            title="View on Map"
                                        >
                                            <Navigation size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </main>
            )}
        </div>
    );
}

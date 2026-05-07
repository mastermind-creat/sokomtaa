'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Loader2, Navigation, Target, Map as MapIcon, Layers } from 'lucide-react';
import BottomNav from '@/components/shared/BottomNav';
import { ApiResponse } from '@/types';

// Dynamic import for Leaflet (No SSR)
const StallMap = dynamic(() => import('@/components/map/StallMap'), { 
    ssr: false,
    loading: () => <div className="w-full h-full bg-neutral-100 flex items-center justify-center"><Loader2 className="animate-spin text-brand-600" /></div>
});

interface Market {
    id: number;
    name: string;
    location: string;
    county: string;
    latitude: string;
    longitude: string;
}

export default function MarketMapPage() {
    // Default to Nairobi Central if no market selected
    const [center, setCenter] = React.useState<[number, number]>([-1.286389, 36.817223]);

    const { data: marketData, isLoading } = useQuery<ApiResponse<Market[]>>({
        queryKey: ['markets'],
        queryFn: () => api.get('/markets'),
    });

    const markets = Array.isArray(marketData) ? marketData : (marketData?.data || []);

    return (
        <div className="flex flex-col h-screen bg-surface-base w-full flex-1 relative overflow-hidden">
            {/* Map UI Overlay: Top Search / Title */}
            <div className="absolute top-12 left-6 right-6 z-10 space-y-4 pointer-events-none">
                <div className="flex items-center justify-between pointer-events-auto">
                    <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-brand-lg border border-white/50 flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-brand-sm">
                            <MapIcon size={18} />
                        </div>
                        <div>
                            <h1 className="text-sm font-black text-green-950 uppercase tracking-tight">Ramani ya Soko</h1>
                            <p className="text-[10px] text-brand-600 font-bold -mt-0.5">Explore Market Layout</p>
                        </div>
                    </div>
                    <button 
                        className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl shadow-brand-lg border border-white/50 flex items-center justify-center text-green-950 active:scale-90 transition-all"
                        aria-label="Tafuta mahali pangu (Find my location)"
                        title="Tafuta mahali pangu"
                    >
                        <Navigation size={22} />
                    </button>
                </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 w-full bg-neutral-200">
                <StallMap 
                    center={center} 
                    stalls={[]}
                    zoom={15} 
                />
            </div>

            {/* Map UI Overlay: Market Selection Carousel */}
            <div className="absolute bottom-28 left-0 right-0 z-10 px-6 pointer-events-none">
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar pointer-events-auto">
                    {markets.map((market: Market) => (
                        <div 
                            key={market.id}
                            onClick={() => setCenter([parseFloat(market.latitude), parseFloat(market.longitude)])}
                            className={`card min-w-[240px] p-4 flex gap-4 bg-white/95 backdrop-blur-md shadow-brand-lg cursor-pointer transition-all active:scale-95 border-2 ${
                                center[0] === parseFloat(market.latitude) ? 'border-brand-500 shadow-brand-glow' : 'border-transparent'
                            }`}
                        >
                            <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 shrink-0">
                                <Target size={24} />
                            </div>
                            <div className="overflow-hidden">
                                <h4 className="font-black text-green-950 truncate leading-tight">{market.name}</h4>
                                <p className="text-xs text-text-muted font-bold truncate">{market.county}</p>
                            </div>
                        </div>
                    ))}
                    {markets.length === 0 && Array(2).fill(0).map((_, i) => (
                        <div key={i} className="min-w-[240px] h-20 bg-white/50 rounded-3xl animate-pulse" />
                    ))}
                </div>
            </div>

            {/* Legend Toggle / Map Controls */}
            <div className="absolute top-32 right-6 z-10 flex flex-col gap-2">
                <button 
                    className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl shadow-brand-lg border border-white/50 flex items-center justify-center text-text-muted active:scale-90 transition-all pointer-events-auto"
                    aria-label="Badilisha aina ya ramani (Change map layers)"
                    title="Badilisha ramani"
                >
                    <Layers size={20} />
                </button>
            </div>

            <BottomNav />
        </div>
    );
}

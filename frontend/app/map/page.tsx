'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
    ChevronLeft, 
    Search, 
    MapPin, 
    Filter, 
    Store, 
    Loader2, 
    ShoppingBag, 
    Star,
    Phone,
    ArrowUpRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import MarketSchematicMap from '@/components/map/MarketSchematicMap';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiResponse } from '@/types';

interface Stall {
    id: number;
    stall_number: string;
    zone: 'A' | 'B' | 'C';
    status: 'occupied' | 'available' | 'maintenance';
    map_x: number;
    map_y: number;
    trader?: {
        id: number;
        business_name: string;
        is_open: boolean;
        primary_category?: string;
        average_rating?: number;
        phone?: string;
    };
}

export default function ResidentMapPage() {
    const router = useRouter();
    const [selectedBlock, setSelectedBlock] = useState('A');
    const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch Stalls for the current market/block
    const { data: stallData, isLoading } = useQuery<ApiResponse<Stall[]>>({
        queryKey: ['stalls', selectedBlock],
        queryFn: () => api.get('/stalls', { params: { block: selectedBlock } }),
    });

    const stalls = stallData?.data || [];

    const stats = useMemo(() => {
        const total = stalls.length;
        const occupied = stalls.filter(s => s.status === 'occupied').length;
        const vacant = stalls.filter(s => s.status === 'available').length;
        const percent = total > 0 ? Math.round((occupied / total) * 100) : 0;
        return { total, occupied, vacant, percent };
    }, [stalls]);

    const filteredStalls = useMemo(() => {
        if (!searchQuery) return stalls;
        return stalls.filter(s => 
            s.stall_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.trader?.business_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [stalls, searchQuery]);

    return (
        <DashboardLayout title="Ramani ya Soko (Market Map)">
            <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
                
                {/* 1. Header & Controls */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => router.back()}
                                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-text-primary shadow-sm border border-gray-100 active:scale-90 transition-all"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <h1 className="text-xl font-black text-green-950 tracking-tight">Kolenyo Market</h1>
                        </div>
                        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
                            {['A', 'B', 'C'].map((block) => (
                                <button
                                    key={block}
                                    onClick={() => setSelectedBlock(block)}
                                    className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${
                                        selectedBlock === block 
                                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-200' 
                                            : 'text-text-muted hover:text-text-primary'
                                    }`}
                                >
                                    Block {block}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-600 transition-colors" size={18} />
                        <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-14 pl-12 pr-4 bg-white rounded-2xl border border-gray-100 shadow-sm focus:border-brand-500 transition-all outline-none font-medium placeholder:text-text-muted"
                            placeholder="Tafuta duka au nambari ya stall..."
                        />
                    </div>
                </div>

                {/* 2. Map Area */}
                <div className="flex-1 relative min-h-[400px]">
                    {isLoading ? (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-[2.5rem]">
                            <Loader2 className="animate-spin text-brand-600 mb-2" size={32} />
                            <p className="text-xs font-black text-brand-700 tracking-widest uppercase">Loading Schematic...</p>
                        </div>
                    ) : null}
                    
                    <MarketSchematicMap 
                        stalls={filteredStalls} 
                        onStallClick={(stall) => setSelectedStall(stall)} 
                    />

                    {/* Legend Strip */}
                    <div className="absolute bottom-6 left-6 right-6 lg:right-auto lg:w-fit bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-white shadow-xl z-10 flex items-center gap-4 overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="w-3 h-3 bg-brand-50 border border-brand-500 rounded-full" />
                            <span className="text-[10px] font-black text-brand-700 uppercase">Open</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="w-3 h-3 bg-amber-50 border border-amber-500 rounded-full" />
                            <span className="text-[10px] font-black text-amber-700 uppercase">Closed</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="w-3 h-3 bg-blue-50 border border-blue-500 border-dashed rounded-full" />
                            <span className="text-[10px] font-black text-blue-600 uppercase">Vacant</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="w-3 h-3 bg-amber-50 border border-amber-300 rounded-full" />
                            <span className="text-[10px] font-black text-text-muted uppercase">Maintenance</span>
                        </div>
                    </div>
                </div>

                {/* 3. Occupancy Stat Bar */}
                <div className="bg-white p-4 lg:p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Occupancy</p>
                        <h4 className="text-lg font-black text-green-950">{stats.occupied}/{stats.total} <span className="text-brand-600">({stats.percent}%)</span></h4>
                    </div>
                    <div className="flex gap-2">
                        {stats.vacant > 0 && (
                            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                {stats.vacant} Vacant
                            </div>
                        )}
                        <div className="bg-green-50 text-brand-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-100">
                            Block Active
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Stall Detail Bottom Sheet (Resident View) */}
            <AnimatePresence>
                {selectedStall && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedStall(null)}
                            className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm lg:hidden"
                        />
                        <motion.div 
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[3rem] z-[101] p-8 pb-10 shadow-2xl lg:right-10 lg:left-auto lg:bottom-10 lg:w-[400px] lg:rounded-[3rem]"
                        >
                            {/* Handle Bar (mobile) */}
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 lg:hidden" />
                            
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            selectedStall.status === 'occupied' ? 'bg-brand-50 text-brand-700' : 'bg-blue-50 text-blue-700'
                                        }`}>
                                            {selectedStall.stall_number} · Zone {selectedStall.zone}
                                        </span>
                                        {selectedStall.trader?.is_open && (
                                            <span className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Open Now
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-2xl font-black text-green-950 tracking-tight">
                                        {selectedStall.trader?.business_name || 'Vacant Stall'}
                                    </h3>
                                    {selectedStall.trader?.primary_category && (
                                        <p className="text-text-secondary font-medium tracking-tight mt-1">{selectedStall.trader.primary_category}</p>
                                    )}
                                </div>
                                <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center text-brand-600">
                                    <Store size={32} />
                                </div>
                            </div>

                            {selectedStall.status === 'occupied' ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="bg-neutral-50 p-4 rounded-2xl border border-gray-100">
                                            <div className="flex items-center gap-1.5 text-amber-500 mb-1">
                                                <Star size={14} fill="currentColor" />
                                                <span className="text-xs font-black">{selectedStall.trader?.average_rating || 'N/A'}</span>
                                            </div>
                                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Rating</p>
                                        </div>
                                        <div className="bg-neutral-50 p-4 rounded-2xl border border-gray-100">
                                            <div className="flex items-center gap-1.5 text-brand-600 mb-1">
                                                <MapPin size={14} />
                                                <span className="text-xs font-black">Block {selectedBlock}</span>
                                            </div>
                                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Location</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <button 
                                            onClick={() => router.push(`/trader/${selectedStall.trader?.id}`)}
                                            className="w-full h-14 bg-brand-600 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-200 active:scale-95 transition-all"
                                        >
                                            View Duka <ArrowUpRight size={16} />
                                        </button>
                                        <a 
                                            href={`tel:${selectedStall.trader?.phone}`}
                                            className="w-full h-14 bg-white text-green-950 border-2 border-gray-100 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                                        >
                                            <Phone size={16} /> Call Trader
                                        </a>
                                    </div>
                                </>
                            ) : (
                                <div className="p-10 bg-blue-50 rounded-[2rem] border border-blue-100 text-center">
                                    <ShoppingBag size={48} className="text-blue-200 mx-auto mb-4" />
                                    <h4 className="font-black text-blue-900 mb-2">Stall Available</h4>
                                    <p className="text-sm text-blue-700/70 font-medium">This stall is currently vacant. Check back later to see who moves in!</p>
                                </div>
                            )}

                            <button 
                                onClick={() => setSelectedStall(null)}
                                className="mt-6 w-full py-2 text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-red-500 transition-colors"
                            >
                                Funga (Close)
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}

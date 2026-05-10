'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/uiStore';
import { 
    LayoutGrid, 
    Filter, 
    Plus, 
    Building2, 
    Search,
    MapPin,
    Calendar,
    ChevronRight,
    Star,
    CheckCircle2,
    Users,
    ArrowRight
} from 'lucide-react';
import { ApiResponse, Stall, Market } from '@/types';

const MarketSchematicMap = dynamic(() => import('@/components/map/MarketSchematicMap'), { 
    ssr: false,
    loading: () => <div className="w-full h-full bg-neutral-100 animate-pulse rounded-[2.5rem] flex items-center justify-center">Loading Map...</div>
});

export default function AdminMapPage() {
    const { setPageTitle } = useUIStore();
    const [selectedBlock, setSelectedBlock] = useState('A');
    const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
    const [selectedMarketId, setSelectedMarketId] = useState<number | null>(null);

    React.useEffect(() => {
        setPageTitle('Market Map (Ramani)');
    }, [setPageTitle]);

    // Fetch markets list
    const { data: marketsData } = useQuery<ApiResponse<Market[]>>({
        queryKey: ['admin-markets-minimal'],
        queryFn: () => api.get('/admin/markets'),
    });

    const markets = marketsData?.data || [];

    // Auto-select first market if none selected
    React.useEffect(() => {
        if (markets.length > 0 && !selectedMarketId) {
            setSelectedMarketId(markets[0].id);
        }
    }, [markets, selectedMarketId]);

    const { data: mapDataRaw, isLoading } = useQuery<ApiResponse<Stall[]>>({
        queryKey: ['admin-map-data', selectedBlock, selectedMarketId],
        queryFn: () => api.get('/admin/map-data', { 
            params: { 
                block: selectedBlock,
                market_id: selectedMarketId 
            } 
        }).then(res => res.data),
        enabled: !!selectedMarketId
    });

    const stalls = mapDataRaw?.data || [];

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6 p-4 md:p-8 max-w-[1600px] mx-auto overflow-hidden">
            <div className="flex-1 relative min-h-[400px]">
                <div className="absolute top-6 left-6 z-10 flex gap-4 items-center">
                    <select
                        value={selectedMarketId || ''}
                        onChange={(e) => setSelectedMarketId(Number(e.target.value))}
                        className="h-10 px-4 bg-white border border-gray-100 rounded-full text-xs font-black uppercase tracking-widest shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    >
                        {markets.map((market) => (
                            <option key={market.id} value={market.id}>
                                {market.name}
                            </option>
                        ))}
                    </select>

                    <div className="flex gap-2">
                        {['A', 'B', 'C'].map((block) => (
                            <button
                                key={block}
                                onClick={() => setSelectedBlock(block)}
                                className={`px-6 py-2 rounded-full font-bold text-sm shadow-lg transition-all ${
                                    selectedBlock === block 
                                    ? 'bg-brand-600 text-white translate-y-[-2px]' 
                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                Block {block}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-full h-full">
                    <MarketSchematicMap 
                        stalls={stalls} 
                        onStallClick={setSelectedStall} 
                    />
                </div>

                <div className="absolute bottom-6 left-6 z-10 bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-white/50 shadow-xl text-[10px] font-black uppercase tracking-widest flex gap-4">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500"></div> Occupied</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Available</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-orange-400"></div> Maintenance</div>
                </div>
            </div>

            <div className="w-full md:w-[400px] flex flex-col gap-6">
                <AnimatePresence mode="wait">
                    {selectedStall ? (
                        <motion.div
                            key={selectedStall.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl flex flex-col h-full overflow-y-auto"
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 shadow-inner">
                                    <Building2 size={32} />
                                </div>
                                <div className="text-right">
                                    <h2 className="text-4xl font-black text-green-950 uppercase tracking-tighter leading-none mb-1">{selectedStall.stall_number}</h2>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-600">Zone {selectedStall.zone} · {selectedBlock}</p>
                                </div>
                            </div>

                            {selectedStall.status === 'occupied' ? (
                                <div className="space-y-10 flex-1">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-4">Assigned Merchant</p>
                                        <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100 flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-600 shadow-sm border border-gray-100">
                                                <Users size={24} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-black text-green-950 uppercase tracking-tight truncate">{selectedStall.trader?.business_name}</h4>
                                                <span className="text-[10px] font-black text-brand-600 uppercase">Verified Merchant</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm text-center">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-text-muted mb-1">Fee Status</p>
                                            <span className="text-[10px] font-black uppercase text-green-600 tracking-tight flex items-center justify-center gap-1"><CheckCircle2 size={12} /> Paid</span>
                                        </div>
                                        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm text-center">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-text-muted mb-1">Tenure</p>
                                            <span className="text-[10px] font-black uppercase text-green-950 tracking-tight">14 Months</span>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-dashed border-gray-100 space-y-3">
                                        <button className="w-full h-14 bg-green-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all">
                                            Audit Merchant Profile <ChevronRight size={16} />
                                        </button>
                                        <button className="w-full h-14 bg-white border border-gray-100 text-green-950 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all">
                                            Issue Warning
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                        <MapPin size={40} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-green-950 uppercase">Inventory Vacant</h3>
                                        <p className="text-xs font-medium text-text-muted mt-2">This stall is ready for allocation. You can manually assign a verified trader.</p>
                                    </div>
                                    <button className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-blue-500/20">
                                        Allocate Space Now <Plus size={18} />
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl flex flex-col items-center justify-center text-center h-full space-y-4">
                            <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center">
                                <LayoutGrid size={40} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-green-950 uppercase tracking-widest">Select an Asset</h3>
                                <p className="text-xs font-medium text-text-muted mt-2">Tap a stall on the schematic to view occupancy diagnostics.</p>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import { 
    MapPin, 
    Plus, 
    Search,
    Edit3,
    Trash2,
    Map,
    ChevronRight,
    Store,
    LayoutGrid,
    PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiResponse, Market } from '@/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminMarketsPage() {
    const { setPageTitle } = useUIStore();
    const [searchQuery, setSearchQuery] = useState('');

    React.useEffect(() => {
        setPageTitle('Market Infrastructure');
    }, [setPageTitle]);

    const { data: marketsData, isLoading } = useQuery<ApiResponse<Market[]>>({
        queryKey: ['admin-markets'],
        queryFn: () => api.get('/markets'),
    });
    
    const markets = marketsData?.data || [];

    const stats = [
        { label: 'Market sites', value: markets.length, color: 'text-brand-600' },
        { label: 'Active Hubs', value: markets.filter(m => m.is_active).length, color: 'text-blue-600' },
        { label: 'Capacity Avg', value: '74%', color: 'text-orange-600' },
    ];

    const filteredMarkets = markets.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.county.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="pb-32 -mx-4 md:-mx-0">
            {/* ── Site Vitality Matrix ── */}
            <div className="grid grid-cols-3 gap-2 px-4 mb-6">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
                        <span className={cn("text-[8px] font-black uppercase tracking-widest mb-1", s.color)}>{s.label}</span>
                        <div className="text-xl font-black text-green-950 tracking-tight">{isLoading ? '...' : s.value}</div>
                    </div>
                ))}
            </div>

            {/* ── Search Bar ── */}
            <div className="px-4 mb-8">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input 
                        type="text"
                        placeholder="Search market name or county..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:border-brand-300"
                    />
                </div>
            </div>

            {/* ── Market Cards ── */}
            <div className="space-y-4 px-4">
                {isLoading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-100 rounded-[2.5rem] animate-pulse" />)
                ) : filteredMarkets.length === 0 ? (
                    <div className="py-20 text-center opacity-40">
                        <MapPin size={48} className="mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">No market sites found</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {filteredMarkets.map((market) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={market.id}
                                className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-gray-200">
                                                <Store size={28} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-green-950 uppercase tracking-tight">{market.name}</h3>
                                                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5 mt-1">
                                                    <Map size={10} /> {market.county} County
                                                </p>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                            market.is_active ? "bg-brand-50 text-brand-700 border-brand-100" : "bg-gray-50 text-gray-700 border-gray-200"
                                        )}>
                                            {market.is_active ? 'Online' : 'Restricted'}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Estate Location</span>
                                                <span className="text-xs font-bold text-text-secondary">{market.estate}, {market.location}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1 block">Live Occupancy</span>
                                                <span className="text-sm font-black text-green-950 tracking-tighter">74% Capacity</span>
                                            </div>
                                        </div>

                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-brand-500 w-[74%] rounded-full shadow-sm" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 h-14 border-t border-gray-50">
                                    <button className="flex items-center justify-center gap-2 bg-white text-text-muted border-r border-gray-50 active:bg-gray-50 transition-all font-black text-[10px] uppercase tracking-widest">
                                        <LayoutGrid size={16} /> Edit STalls
                                    </button>
                                    <button className="flex items-center justify-center gap-2 bg-white text-brand-700 active:bg-brand-50 transition-all font-black text-[10px] uppercase tracking-widest">
                                        <PieChart size={16} /> Analytics
                                    </button>
                                </div>
                                <button className="w-full h-12 bg-gray-950 hover:bg-black flex items-center justify-between px-6 active:scale-[0.98] transition-all">
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Configure Infrastructure</span>
                                    <ChevronRight size={16} className="text-white/40" />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* ── Site Builder Floating Action ── */}
            <button className="fixed bottom-24 right-4 w-14 h-14 bg-brand-600 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all z-40 border-4 border-white">
                <Plus size={24} />
            </button>
        </div>
    );
}

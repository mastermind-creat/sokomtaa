'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import { useRouter } from 'next/navigation';
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
    PieChart,
    AlertCircle,
    Loader2,
    CreditCard,
    RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiResponse, Market } from '@/types';
import { cn } from '@/lib/utils';
import { MarketModal } from '@/components/admin/MarketModal';

export default function AdminMarketsPage() {
    const { setPageTitle } = useUIStore();
    const queryClient = useQueryClient();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);

    React.useEffect(() => {
        setPageTitle('Market Infrastructure');
    }, [setPageTitle]);

    // ── Queries ──
    const { data: marketsData, isLoading } = useQuery<ApiResponse<Market[]>>({
        queryKey: ['admin-markets'],
        queryFn: () => api.get('/admin/markets'),
    });
    
    const markets = marketsData?.data || [];

    // ── Mutations ──
    const createMutation = useMutation({
        mutationFn: (data: FormData) => api.post('/admin/markets', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-markets'] });
            setIsModalOpen(false);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: FormData }) => {
            // Append _method=PUT for Laravel to handle FormData in a PUT request
            data.append('_method', 'PUT');
            return api.post(`/admin/markets/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-markets'] });
            setIsModalOpen(false);
            setSelectedMarket(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/admin/markets/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-markets'] });
        }
    });

    const toggleStatusMutation = useMutation({
        mutationFn: (id: number) => api.patch(`/admin/markets/${id}/toggle`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-markets'] });
        }
    });

    const resetInfrastructureMutation = useMutation({
        mutationFn: (id: number) => api.post(`/admin/markets/${id}/reset-stalls`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-markets'] });
            alert('Market infrastructure has been reset to standard template.');
        }
    });

    const syncFeesMutation = useMutation({
        mutationFn: (marketId: number) => api.post<ApiResponse<any>>('/admin/stalls/bulk-update-fees', { market_id: marketId }),
        onSuccess: (res) => {
            alert(res.data.message || 'Stall fees updated successfully.');
        }
    });

    const handleSyncFees = (id: number) => {
        if (window.confirm('This will update ALL stalls in this market to the current Global Market Fee. This action is irreversible. Proceed?')) {
            syncFeesMutation.mutate(id);
        }
    };

    const handleResetInfrastructure = (id: number) => {
        if (window.confirm('WARNING: This will delete all existing stalls in this market and regenerate them from the standard template. Active allocations will be lost. Proceed?')) {
            resetInfrastructureMutation.mutate(id);
        }
    };

    const handleFormSubmit = (data: FormData) => {
        if (selectedMarket) {
            updateMutation.mutate({ id: selectedMarket.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (market: Market) => {
        setSelectedMarket(market);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        if (window.confirm('Are you sure you want to delete this market? This action cannot be undone if the market has no active data.')) {
            deleteMutation.mutate(id);
        }
    };

    const avgOccupancy = markets.length > 0
        ? Math.round(markets.reduce((sum, m) => {
            const total = m.stalls_count ?? 0;
            const occupied = m.occupied_stalls_count ?? 0;
            return sum + (total > 0 ? (occupied / total) * 100 : 0);
        }, 0) / markets.length)
        : 0;

    const stats = [
        { label: 'Market sites', value: markets.length, color: 'text-brand-600' },
        { label: 'Active Hubs', value: markets.filter(m => m.is_active).length, color: 'text-blue-600' },
        { label: 'Avg Occupancy', value: isLoading ? '...' : `${avgOccupancy}%`, color: 'text-orange-600' },
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
            <div className="px-4 mb-8 flex items-center gap-3">
                <div className="relative group flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input 
                        type="text"
                        placeholder="Search market name or county..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:border-brand-300 transition-all"
                    />
                </div>
                <button 
                    onClick={() => {
                        setSelectedMarket(null);
                        setIsModalOpen(true);
                    }}
                    className="h-12 w-12 bg-brand-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-100 active:scale-95 transition-all"
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* ── Market Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
                {isLoading ? (
                    [1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-gray-100 rounded-[2.5rem] animate-pulse" />)
                ) : filteredMarkets.length === 0 ? (
                    <div className="col-span-full py-20 text-center opacity-40">
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
                                className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden flex flex-col"
                            >
                                {market.banner_url && (
                                     <div className="h-20 w-full overflow-hidden border-b border-gray-50">
                                         <img src={market.banner_url} alt="" className="w-full h-full object-cover opacity-80" />
                                     </div>
                                 )}
                                <div className="p-6 flex-1">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-gray-200 shrink-0 overflow-hidden">
                                                {market.icon_url ? (
                                                     <img src={market.icon_url} alt="" className="w-full h-full object-cover" />
                                                 ) : (
                                                     <Store size={28} />
                                                 )}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-green-950 uppercase tracking-tight leading-tight">{market.name}</h3>
                                                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5 mt-1">
                                                    <Map size={10} /> {market.county} County
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => toggleStatusMutation.mutate(market.id)}
                                            className={cn(
                                                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95",
                                                market.is_active ? "bg-brand-50 text-brand-700 border-brand-100" : "bg-gray-50 text-gray-700 border-gray-200"
                                            )}
                                        >
                                            {market.is_active ? 'Online' : 'Restricted'}
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {(() => {
                                            const total = market.stalls_count ?? 0;
                                            const occupied = market.occupied_stalls_count ?? 0;
                                            const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
                                            const barColor = pct >= 80 ? 'bg-rose-500' : pct >= 50 ? 'bg-amber-500' : 'bg-brand-500';
                                            const textColor = pct >= 80 ? 'text-rose-700' : pct >= 50 ? 'text-amber-700' : 'text-green-700';
                                            return (
                                                <>
                                                    <div className="flex justify-between items-end">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Estate Location</span>
                                                            <span className="text-xs font-bold text-text-secondary">{market.estate}, {market.location}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1 block">Live Occupancy</span>
                                                            <span className={`text-sm font-black tracking-tighter ${textColor}`}>
                                                                {total > 0 ? `${pct}% · ${occupied}/${total} stalls` : 'No stalls'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full shadow-sm transition-all duration-700 ${barColor}`}
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </>
                                            );
                                        })()}

                                        <div className="pt-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                                                    <CreditCard size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">Global Fee</p>
                                                    <p className="text-xs font-black text-amber-900">KES {(market.default_monthly_fee || 0).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleSyncFees(market.id)}
                                                disabled={syncFeesMutation.isPending}
                                                className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {syncFeesMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                                                Sync Fees
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 h-14 border-t border-gray-50">
                                    <button 
                                        onClick={() => handleEdit(market)}
                                        className="flex items-center justify-center gap-2 bg-white text-blue-600 border-r border-gray-50 active:bg-blue-50 transition-all font-black text-[10px] uppercase tracking-widest"
                                    >
                                        <Edit3 size={16} /> Edit
                                    </button>
                                    <button 
                                        onClick={() => router.push(`/admin/stalls?market_id=${market.id}`)}
                                        className="flex items-center justify-center gap-2 bg-white text-text-muted border-r border-gray-50 active:bg-gray-50 transition-all font-black text-[10px] uppercase tracking-widest hover:text-brand-600 hover:bg-brand-50 transition-all"
                                    >
                                        <LayoutGrid size={16} /> Stalls
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(market.id)}
                                        className="flex items-center justify-center gap-2 bg-white text-rose-600 active:bg-rose-50 transition-all font-black text-[10px] uppercase tracking-widest"
                                    >
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                                <button 
                                    onClick={() => handleResetInfrastructure(market.id)}
                                    className="w-full h-12 bg-gray-950 hover:bg-black flex items-center justify-between px-6 active:scale-[0.98] transition-all disabled:opacity-50"
                                    disabled={resetInfrastructureMutation.isPending}
                                >
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                        {resetInfrastructureMutation.isPending && resetInfrastructureMutation.variables === market.id ? 'Regenerating...' : 'Configure Infrastructure'}
                                    </span>
                                    <ChevronRight size={16} className="text-white/40" />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* ── Site Builder Modal ── */}
            <MarketModal 
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedMarket(null);
                }}
                onSubmit={handleFormSubmit}
                initialData={selectedMarket}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />

            {/* ── Site Builder Floating Action (Desktop/Mobile fallback) ── */}
            <button 
                onClick={() => {
                    setSelectedMarket(null);
                    setIsModalOpen(true);
                }}
                className="fixed bottom-24 right-4 w-14 h-14 bg-brand-600 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all z-40 border-4 border-white md:hidden"
            >
                <Plus size={24} />
            </button>
        </div>
    );
}

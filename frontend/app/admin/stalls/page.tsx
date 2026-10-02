'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import { 
    List, 
    Map as MapIcon, 
    Plus, 
    Zap, 
    Search, 
    Loader2,
    Layers,
    Edit3,
    Trash2,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiResponse, Stall, Market } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { StallModal } from '@/components/admin/StallModal';

// Dynamic import for Leaflet map
const StallMapPreview = dynamic(() => import('../../../components/admin/StallMapPreview'), {
    ssr: false,
    loading: () => <div className="h-[600px] w-full bg-gray-50 animate-pulse rounded-[3rem] flex items-center justify-center font-black uppercase text-text-muted tracking-widest text-xs">Loading Market Schematic...</div>
});

export default function AdminStallsPage() {
    const { t } = useTranslation();
    const { setPageTitle } = useUIStore();
    const queryClient = useQueryClient();

    React.useEffect(() => {
        setPageTitle('Usimamizi wa Vibanda (Stall Registry)');
    }, [setPageTitle]);

    const [view, setView] = useState<'list' | 'map' | 'bulk'>('list');
    const [selectedMarketId, setSelectedMarketId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStallIds, setSelectedStallIds] = useState<number[]>([]);
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStall, setSelectedStall] = useState<Stall | null>(null);

    // Bulk Form State
    const [bulkForm, setBulkForm] = useState({
        prefix: 'B',
        start_number: 1,
        count: 10,
        monthly_fee: 1500,
        zone: 'B' as const,
        block: 'C1'
    });

    // Fetch Markets
    const { data: marketsData } = useQuery<ApiResponse<Market[]>>({
        queryKey: ['markets'],
        queryFn: () => api.get('/admin/markets'),
    });
    const markets = marketsData?.data || [];

    // Auto-select first market
    React.useEffect(() => {
        if (markets.length > 0 && !selectedMarketId) {
            setSelectedMarketId(markets[0].id);
        }
    }, [markets, selectedMarketId]);

    // Fetch Stalls
    const { data: stallsData, isLoading: stallsLoading } = useQuery<ApiResponse<Stall[]>>({
        queryKey: ['admin-stalls', selectedMarketId],
        queryFn: () => api.get('/admin/stalls', { params: { market_id: selectedMarketId } }),
        enabled: !!selectedMarketId,
    });
    const stalls = stallsData?.data || [];

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: Partial<Stall>) => api.post('/admin/stalls', { ...data, market_id: selectedMarketId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-stalls'] });
            setIsModalOpen(false);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: Partial<Stall> }) => api.patch(`/admin/stalls/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-stalls'] });
            setIsModalOpen(false);
            setSelectedStall(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/admin/stalls/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-stalls'] });
            setSelectedStallIds(prev => prev.filter(sid => sid !== selectedStall?.id));
        }
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: (ids: number[]) => api.delete('/admin/stalls/bulk', { data: { ids } }),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['admin-stalls'] });
            setSelectedStallIds([]);
            alert(res.message || 'Selected stalls deleted successfully.');
        }
    });

    // Bulk Generate Mutation
    const bulkMutation = useMutation({
        mutationFn: (data: typeof bulkForm) => api.post('/admin/stalls/bulk', { ...data, market_id: selectedMarketId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-stalls'] });
            setView('list');
            alert('Stalls generated successfully!');
        }
    });

    const handleFormSubmit = (data: Partial<Stall>) => {
        if (selectedStall) {
            updateMutation.mutate({ id: selectedStall.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (stall: Stall) => {
        setSelectedStall(stall);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        if (window.confirm('Are you sure you want to delete this stall? This action cannot be undone.')) {
            deleteMutation.mutate(id);
        }
    };

    const handleBulkDelete = () => {
        if (window.confirm(`Are you sure you want to delete ${selectedStallIds.length} stalls? This action cannot be undone.`)) {
            bulkDeleteMutation.mutate(selectedStallIds);
        }
    };

    const toggleStallSelection = (id: number) => {
        setSelectedStallIds(prev => 
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedStallIds.length === filteredStalls.length) {
            setSelectedStallIds([]);
        } else {
            setSelectedStallIds(filteredStalls.map(s => s.id));
        }
    };

    const filteredStalls = stalls.filter(s => 
        s.stall_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.current_trader?.business_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-32 px-4 pt-6">
                
                {/* 1. Market & View Selector */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-brand-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-100">
                            <Layers size={28} />
                        </div>
                        <div>
                            <select 
                                value={selectedMarketId || ''} 
                                onChange={(e) => setSelectedMarketId(Number(e.target.value))}
                                className="bg-transparent text-2xl font-black text-green-950 tracking-tighter outline-none cursor-pointer border-none p-0 focus:ring-0"
                            >
                                {markets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                            <p className="text-text-secondary font-medium text-sm">Managing physical inventory and layout.</p>
                        </div>
                    </div>
                    
                    <div className="bg-white p-1.5 rounded-[1.5rem] border border-gray-100 shadow-sm flex items-center gap-1">
                        {[
                            { id: 'list', icon: List, label: 'List View' },
                            { id: 'map', icon: MapIcon, label: 'Map Editor' },
                            { id: 'bulk', icon: Zap, label: 'Bulk Tools' }
                        ].map((v) => (
                            <button 
                                key={v.id}
                                onClick={() => setView(v.id as 'list' | 'map' | 'bulk')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    view === v.id ? "bg-brand-600 text-white shadow-brand-sm" : "text-text-muted hover:bg-gray-50"
                                )}
                            >
                                <v.icon size={16} /> {v.label}
                            </button>
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {/* VIEW: LIST */}
                    {view === 'list' && (
                        <motion.div 
                            key="list"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="flex flex-col md:flex-row gap-4 mb-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                                    <input 
                                        type="text" 
                                        placeholder="Search stall number or owner..." 
                                        className="w-full h-14 pl-14 pr-6 bg-white border border-gray-100 rounded-[1.25rem] shadow-sm outline-none focus:ring-2 focus:ring-brand-500/20"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                    <button 
                                        onClick={() => {
                                            setSelectedStall(null);
                                            setIsModalOpen(true);
                                        }}
                                        className="h-14 px-8 bg-brand-600 text-white rounded-[1.25rem] shadow-lg shadow-brand-900/10 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                                    >
                                        <Plus size={18} /> New Stall
                                    </button>
                                    {selectedStallIds.length > 0 && (
                                        <button 
                                            onClick={toggleSelectAll}
                                            className="h-14 px-6 bg-gray-100 text-text-secondary rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all"
                                        >
                                            {selectedStallIds.length === filteredStalls.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    )}
                                </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {stallsLoading ? (
                                    Array(8).fill(0).map((_, i) => <div key={i} className="h-40 bg-white rounded-[2rem] animate-pulse" />)
                                ) : filteredStalls.map((stall) => {
                                    const isSelected = selectedStallIds.includes(stall.id);
                                    return (
                                        <div 
                                            key={stall.id} 
                                            onClick={() => toggleStallSelection(stall.id)}
                                            className={cn(
                                                "group bg-white border p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all cursor-pointer relative overflow-hidden flex flex-col min-h-[160px]",
                                                isSelected ? "border-brand-500 ring-2 ring-brand-500/20" : "border-gray-50 hover:border-brand-200"
                                            )}
                                        >
                                            {/* Selection Indicator */}
                                            <div className={cn(
                                                "absolute top-6 left-6 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all z-20",
                                                isSelected ? "bg-brand-600 border-brand-600 text-white" : "bg-white border-gray-200"
                                            )}>
                                                {isSelected && <Plus size={14} className="rotate-45" />}
                                            </div>

                                            <div className="flex items-start justify-between relative z-10 pl-8">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Zone {stall.zone} • Block {stall.block}</p>
                                                    <h3 className="text-2xl font-black text-green-950 uppercase leading-none">{stall.stall_number}</h3>
                                                </div>
                                                <div className={cn(
                                                    "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border shrink-0",
                                                    stall.status === 'occupied' ? "bg-brand-50 text-brand-700 border-brand-100" :
                                                    stall.status === 'available' ? "bg-blue-50 text-blue-700 border-blue-100" :
                                                    "bg-rose-50 text-rose-700 border-rose-100"
                                                )}>
                                                    {stall.status}
                                                </div>
                                            </div>

                                        <div className="mt-auto flex items-end justify-between relative z-10 pt-4">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Current Trader</p>
                                                <p className="text-sm font-bold text-green-950 truncate pr-2">
                                                    {stall.current_trader?.business_name || 'Unassigned'}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Levy/Mo</p>
                                                <p className="text-sm font-black text-brand-600">KES {stall.monthly_fee}</p>
                                            </div>
                                        </div>

                                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 z-20">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(stall);
                                                }}
                                                className="w-10 h-10 rounded-xl bg-white border border-gray-100 text-text-muted hover:text-brand-600 shadow-sm flex items-center justify-center transition-all active:scale-90"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(stall.id);
                                                }}
                                                className="w-10 h-10 rounded-xl bg-white border border-gray-100 text-text-muted hover:text-rose-500 shadow-sm flex items-center justify-center transition-all active:scale-90"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-brand-50 rounded-full opacity-20 group-hover:scale-125 transition-transform" />
                                    </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* VIEW: MAP EDITOR */}
                    {view === 'map' && (
                        <motion.div 
                            key="map"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="bg-white rounded-[3rem] p-4 lg:p-8 border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-black text-green-950 tracking-tight">Market Visual Editor</h3>
                                    <p className="text-text-secondary text-sm font-medium">Interactive spatial layout of market units.</p>
                                </div>
                            </div>
                            <div className="relative rounded-[2rem] overflow-hidden border border-gray-50 shadow-inner">
                                <StallMapPreview isAdmin={true} marketId={selectedMarketId} />
                            </div>
                        </motion.div>
                    )}

                    {/* VIEW: BULK TOOLS */}
                    {view === 'bulk' && (
                        <motion.div 
                            key="bulk"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-2xl mx-auto"
                        >
                            <div className="bg-white rounded-[3rem] p-10 lg:p-14 border border-gray-100 shadow-xl shadow-brand-900/5 space-y-10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 text-brand-50 opacity-50">
                                    <Zap size={120} strokeWidth={1} />
                                </div>

                                <div className="relative z-10">
                                    <h3 className="text-3xl font-black text-green-950 tracking-tighter">Bulk Stall Manager</h3>
                                    <p className="text-text-secondary font-medium mt-2">Rapidly register multiple stalls. Optimized for **Centre Region (Zone B)** layouts.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-6 relative z-10">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-2">Prefix (e.g. B)</label>
                                        <input 
                                            type="text" 
                                            className="w-full h-14 px-6 bg-gray-50 border-none rounded-2xl font-black text-lg focus:ring-2 focus:ring-brand-500/20"
                                            value={bulkForm.prefix}
                                            onChange={(e) => setBulkForm({...bulkForm, prefix: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-2">Start Number</label>
                                        <input 
                                            type="number" 
                                            className="w-full h-14 px-6 bg-gray-50 border-none rounded-2xl font-black text-lg focus:ring-2 focus:ring-brand-500/20"
                                            value={bulkForm.start_number}
                                            onChange={(e) => setBulkForm({...bulkForm, start_number: parseInt(e.target.value)})}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-2">Total Units</label>
                                        <input 
                                            type="number" 
                                            className="w-full h-14 px-6 bg-gray-50 border-none rounded-2xl font-black text-lg focus:ring-2 focus:ring-brand-500/20"
                                            value={bulkForm.count}
                                            onChange={(e) => setBulkForm({...bulkForm, count: parseInt(e.target.value)})}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-2">Monthly Fee (KES)</label>
                                        <input 
                                            type="number" 
                                            className="w-full h-14 px-6 bg-gray-50 border-none rounded-2xl font-black text-lg focus:ring-2 focus:ring-brand-500/20"
                                            value={bulkForm.monthly_fee}
                                            onChange={(e) => setBulkForm({...bulkForm, monthly_fee: parseInt(e.target.value)})}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-2">Zone</label>
                                        <select 
                                            className="w-full h-14 px-6 bg-gray-50 border-none rounded-2xl font-black text-sm focus:ring-2 focus:ring-brand-500/20"
                                            value={bulkForm.zone}
                                            onChange={(e) => setBulkForm({...bulkForm, zone: e.target.value as any})}
                                        >
                                            <option value="A">Zone A (Left Wall)</option>
                                            <option value="B">Zone B (Centre Region)</option>
                                            <option value="C">Zone C (Right Wall)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-2">Block Name</label>
                                        <input 
                                            type="text" 
                                            className="w-full h-14 px-6 bg-gray-50 border-none rounded-2xl font-black text-lg focus:ring-2 focus:ring-brand-500/20"
                                            value={bulkForm.block}
                                            onChange={(e) => setBulkForm({...bulkForm, block: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <button 
                                        onClick={() => bulkMutation.mutate(bulkForm)}
                                        disabled={bulkMutation.isPending}
                                        className="w-full h-20 bg-brand-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-brand-900/20 active:scale-95 transition-all flex items-center justify-center gap-4"
                                    >
                                        {bulkMutation.isPending ? <Loader2 size={24} className="animate-spin" /> : <Zap size={24} />}
                                        Generate Inventory
                                    </button>
                                    <p className="text-center text-[10px] font-black text-text-muted uppercase tracking-widest mt-6">
                                        Warning: This will skip existing stall numbers to prevent duplicates.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {selectedStallIds.length > 0 && (
                        <motion.div 
                            initial={{ y: 100 }}
                            animate={{ y: 0 }}
                            exit={{ y: 100 }}
                            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[80] w-[95%] max-w-2xl bg-gray-900 text-white rounded-[2.5rem] p-4 shadow-2xl flex items-center justify-between gap-4 border border-white/10 backdrop-blur-md"
                        >
                            <div className="flex items-center gap-4 pl-4">
                                <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center font-black">
                                    {selectedStallIds.length}
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest">Stalls Selected</p>
                                    <p className="text-[10px] font-medium text-white/60">Perform collective operations</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={handleBulkDelete}
                                    disabled={bulkDeleteMutation.isPending}
                                    className="h-12 px-6 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 border border-red-600/30"
                                >
                                    {bulkDeleteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    Delete Selected
                                </button>
                                <button 
                                    onClick={() => setSelectedStallIds([])}
                                    className="h-12 w-12 bg-white/10 hover:bg-white/20 text-white rounded-2xl flex items-center justify-center transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Stall Modal */}
                <StallModal 
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedStall(null);
                    }}
                    onSubmit={handleFormSubmit}
                    initialData={selectedStall}
                    marketId={selectedMarketId}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                />
            </div>
    );
}

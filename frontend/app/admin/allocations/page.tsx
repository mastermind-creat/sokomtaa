'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, 
    Search, 
    User, 
    Building2, 
    ChevronRight,
    MapPin,
    ArrowUpRight
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiResponse, Allocation } from '@/types';
import { AllocationModal } from '@/components/admin/AllocationModal';

export default function AdminAllocationsPage() {
    const { setPageTitle } = useUIStore();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);

    React.useEffect(() => {
        setPageTitle('Stall Allocations');
    }, [setPageTitle]);

    const { data: allocationsRes, isLoading } = useQuery<ApiResponse<Allocation[]>>({
        queryKey: ['admin-allocations', statusFilter],
        queryFn: () => api.get('/admin/allocations', { params: { status: statusFilter } }),
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/admin/allocations', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-allocations'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stalls-available'] });
            queryClient.invalidateQueries({ queryKey: ['admin-traders-unallocated'] });
            alert('Stall allocated successfully');
            setIsModalOpen(false);
        },
        onError: (error: any) => {
            console.error('Allocation error:', error);
            const message = error.message || (error.errors ? Object.values(error.errors)[0] : null) || 'Failed to allocate stall';
            alert(`Hitilafu: ${Array.isArray(message) ? message[0] : message}`);
        }
    });

    const allocations = Array.isArray(allocationsRes) ? allocationsRes : allocationsRes?.data || [];

    const stats = [
        { label: 'Occupied', count: allocations.filter((a: any) => a.status === 'active').length, color: 'text-brand-600' },
        { label: 'Vacant', count: 12, color: 'text-orange-600' }, // Mock vacant data for matrix
        { label: 'Expiring', count: allocations.filter((a: any) => a.status === 'expired').length, color: 'text-red-600' },
    ];

    const filteredAllocations = allocations.filter((item: any) => {
        // Handle both flattened strings from API and potential objects from types
        const traderName = typeof item.trader === 'string' ? item.trader : item.trader?.business_name || '';
        const stallNumber = typeof item.stall === 'string' ? item.stall : item.stall?.stall_number || '';

        const matchesSearch = stallNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             traderName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="pb-32 -mx-4 md:-mx-0">
            {/* ── Spatial Occupancy Matrix ── */}
            <div className="grid grid-cols-3 gap-2 px-4 mb-6">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
                        <span className={cn("text-[8px] font-black uppercase tracking-widest mb-1", s.color)}>{s.label}</span>
                        <div className="text-xl font-black text-green-950 tracking-tight">{isLoading ? '...' : s.count}</div>
                    </div>
                ))}
            </div>

            {/* ── Filter Tabs (Scrollable) ── */}
            <div className="px-4 mb-6">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {['all', 'active', 'expired', 'revoked'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setStatusFilter(tab)}
                            className={cn(
                                "flex-shrink-0 px-5 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                statusFilter === tab 
                                    ? 'bg-brand-600 text-white shadow-brand-sm' 
                                    : 'bg-white text-text-muted border border-gray-100'
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Search Bar ── */}
            <div className="px-4 mb-8">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input 
                        type="text"
                        placeholder="Search trader or stall number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:border-brand-300"
                    />
                </div>
            </div>

            {/* ── Allocation Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                {isLoading ? (
                    [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 bg-gray-100 rounded-[2.5rem] animate-pulse" />)
                ) : (
                    <AnimatePresence mode="popLayout">
                        {filteredAllocations.length === 0 ? (
                            <div className="col-span-full text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                                <Building2 className="mx-auto text-gray-200 mb-4" size={48} />
                                <p className="text-sm font-black text-text-muted uppercase tracking-widest">No Allocations Found</p>
                            </div>
                        ) : (
                            filteredAllocations.map((item: any) => (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key={item.id}
                                className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col"
                            >
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center border border-brand-100 shrink-0">
                                                <Building2 size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-green-950 uppercase tracking-tight">Stall {item.stall}</h3>
                                                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                                                    <MapPin size={10} /> Block {item.block}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                            item.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                                        )}>
                                            {item.status}
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                                                    <User size={14} className="text-text-muted" />
                                                </div>
                                                <span className="text-[11px] font-black text-green-950 truncate pr-2">
                                                    {item.trader?.business_name || item.trader}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[8px] font-black text-text-muted uppercase tracking-widest px-1">
                                                <span>Lease Progress</span>
                                                <span className="text-brand-600">65%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-brand-500 w-[65%] rounded-full shadow-lg shadow-brand-500/20" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Lease ID: #{item.id}</span>
                                    <span className="text-[9px] font-black text-brand-600 uppercase tracking-widest">Active Status</span>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            )}
            </div>

            {/* ── Floating Resource Adder ── */}
            <button 
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-24 right-4 w-14 h-14 bg-brand-600 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all z-40 border-4 border-white"
            >
                <Plus size={24} />
            </button>

            <AllocationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={(data) => createMutation.mutate(data)}
                isLoading={createMutation.isPending}
            />
        </div>
    );
}

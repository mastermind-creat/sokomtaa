'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, 
    Search, 
    Filter, 
    Calendar, 
    User, 
    Building2, 
    MoreHorizontal,
    ExternalLink,
    AlertCircle,
    XCircle,
    CheckCircle2,
    CalendarClock,
    ChevronRight,
    MapPin,
    ArrowUpRight
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminAllocationsPage() {
    const { setPageTitle } = useUIStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    React.useEffect(() => {
        setPageTitle('Stall Allocations');
    }, [setPageTitle]);

    const { data: allocationsRaw, isLoading } = useQuery({
        queryKey: ['admin-allocations', statusFilter],
        queryFn: () => api.get('/admin/allocations', { params: { status: statusFilter } }).catch(() => ({ data: { data: [] } })),
    });

    const allocations = (allocationsRaw as any)?.data?.data || [];

    const stats = [
        { label: 'Occupied', count: allocations.filter((a: any) => a.status === 'active').length, color: 'text-brand-600' },
        { label: 'Vacant', count: 12, color: 'text-orange-600' }, // Mock vacant data for matrix
        { label: 'Expiring', count: allocations.filter((a: any) => a.status === 'expired').length, color: 'text-red-600' },
    ];

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

            {/* ── Allocation Card List ── */}
            <div className="space-y-4 px-4">
                {isLoading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-100 rounded-[2.5rem] animate-pulse" />)
                ) : (
                    <AnimatePresence>
                        {allocations.map((item: any) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={item.id}
                                className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center border border-brand-100">
                                                <Building2 size={28} />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black text-green-950 uppercase tracking-tight">Stall {item.stall}</h3>
                                                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5 mt-1">
                                                    <MapPin size={10} /> Block {item.block}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                            item.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                                        )}>
                                            {item.status}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                                                    <User size={14} className="text-text-muted" />
                                                </div>
                                                <span className="text-xs font-black text-green-950 truncate max-w-[120px]">{item.trader?.business_name || item.trader}</span>
                                            </div>
                                            <button className="text-brand-600 p-1">
                                                <ArrowUpRight size={16} />
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[9px] font-black text-text-muted uppercase tracking-widest px-1">
                                                <span>Lease Progress</span>
                                                <span>65%</span>
                                            </div>
                                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-brand-500 w-[65%]" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button className="w-full h-12 bg-gray-950 hover:bg-black flex items-center justify-between px-6 active:scale-[0.98] transition-all">
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Manage Allocation Workflow</span>
                                    <ChevronRight size={16} className="text-white/40" />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* ── Floating Resource Adder ── */}
            <button className="fixed bottom-24 right-4 w-14 h-14 bg-brand-600 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all z-40 border-4 border-white">
                <Plus size={24} />
            </button>
        </div>
    );
}

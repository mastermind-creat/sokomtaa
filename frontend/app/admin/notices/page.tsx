'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    Bell, 
    Megaphone, 
    Search,
    Filter,
    Plus,
    Calendar,
    AlertTriangle,
    Zap,
    MessageSquare,
    Eye,
    Pin,
    Users,
    Clock,
    ChevronRight,
    Share2,
    Edit2
} from 'lucide-react';
import api from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function AdminNoticesPage() {
    const { setPageTitle } = useUIStore();
    const [typeFilter, setTypeFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    React.useEffect(() => {
        setPageTitle('Broadcast Center');
    }, [setPageTitle]);

    const { data: noticesRaw, isLoading, refetch } = useQuery({
        queryKey: ['admin-notices', typeFilter],
        queryFn: () => api.get('/notices', { params: { type: typeFilter !== 'all' ? typeFilter : undefined } }).catch(() => ({ data: { data: [] } })),
    });

    const notices = (noticesRaw as any)?.data?.data || [];

    const stats = [
        { label: 'Active', value: notices.length, color: 'text-brand-600' },
        { label: 'Urgent', value: notices.filter((n: any) => n.type === 'urgent').length, color: 'text-red-600' },
        { label: 'Avg Reads', value: '1.2k', color: 'text-blue-600' },
    ];

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'urgent': return "bg-red-50 text-red-700 border-red-100 ring-4 ring-red-500/10";
            case 'maintenance': return "bg-orange-50 text-orange-700 border-orange-100";
            case 'promotion': return "bg-green-50 text-green-700 border-green-100";
            case 'event': return "bg-blue-50 text-blue-700 border-blue-100";
            default: return "bg-gray-50 text-gray-700 border-gray-100";
        }
    };

    return (
        <div className="pb-32 -mx-4 md:-mx-0">
            {/* ── Broadcast Reach Matrix ── */}
            <div className="grid grid-cols-3 gap-2 px-4 mb-6">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
                        <span className={cn("text-[8px] font-black uppercase tracking-widest mb-1", s.color)}>{s.label}</span>
                        <div className="text-xl font-black text-green-950 tracking-tight">{isLoading ? '...' : s.value}</div>
                    </div>
                ))}
            </div>

            {/* ── Visual Filters (Scrollable) ── */}
            <div className="px-4 mb-6">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {['all', 'urgent', 'maintenance', 'event', 'promotion'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setTypeFilter(tab)}
                            className={cn(
                                "flex-shrink-0 px-5 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                typeFilter === tab 
                                    ? 'bg-gray-950 text-white shadow-xl' 
                                    : 'bg-white text-text-muted border border-gray-100 shadow-sm'
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
                        placeholder="Search broadcasts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:border-brand-300"
                    />
                </div>
            </div>

            {/* ── Notice Cards ── */}
            <div className="space-y-6 px-4">
                {isLoading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-44 bg-gray-100 rounded-[2.5rem] animate-pulse" />)
                ) : notices.length === 0 ? (
                    <div className="py-20 text-center opacity-40">
                        <Megaphone size={48} className="mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">Board is clear</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {notices.map((notice: any, i: number) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={notice.id}
                                className={cn(
                                    "bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden relative",
                                    notice.is_pinned && "ring-2 ring-brand-500/20"
                                )}
                            >
                                {notice.is_pinned && (
                                    <div className="absolute top-0 right-0 bg-brand-600 text-white px-4 py-1.5 rounded-bl-[1.5rem] text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-brand-500/20">
                                        <Pin size={10} className="fill-white" /> Pinned
                                    </div>
                                )}

                                <div className="p-6">
                                    <div className="flex flex-wrap gap-2 mb-4 pr-16 md:pr-0">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                            getTypeStyles(notice.type)
                                        )}>
                                            {notice.type}
                                        </span>
                                        <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1.5">
                                            <Users size={10} /> {notice.audience}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-black text-green-950 tracking-tight leading-snug mb-3">
                                        {notice.title}
                                    </h3>
                                    
                                    <p className="text-sm font-medium text-text-secondary leading-relaxed line-clamp-3 mb-6">
                                        {notice.content}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-[9px] font-bold text-text-muted uppercase tracking-widest">
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={12} /> {new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(new Date(notice.created_at))}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Eye size={12} /> 1.2k
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 h-14 border-t border-gray-50">
                                    <button className="flex items-center justify-center gap-2 bg-white text-text-muted border-r border-gray-50 active:bg-gray-50 transition-all font-black text-[10px] uppercase tracking-widest">
                                        <Edit2 size={16} /> Edit
                                    </button>
                                    <button className="flex items-center justify-center gap-2 bg-white text-blue-600 active:bg-blue-50 transition-all font-black text-[10px] uppercase tracking-widest">
                                        <Share2 size={16} /> Broadcast
                                    </button>
                                </div>

                                <button className="w-full h-12 bg-gray-950 hover:bg-black flex items-center justify-between px-6 active:scale-[0.98] transition-all">
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest tabular-nums">Board Management Protocol</span>
                                    <ChevronRight size={16} className="text-white/40" />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* ── Fast Broadcast Adder ── */}
            <button className="fixed bottom-24 right-4 w-14 h-14 bg-brand-600 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all z-40 border-4 border-white">
                <Plus size={24} />
            </button>
        </div>
    );
}

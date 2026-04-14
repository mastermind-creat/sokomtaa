'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
    FileText, 
    Clock, 
    CheckCircle2, 
    XCircle, 
    Search, 
    Filter,
    ChevronRight,
    User,
    Store,
    MapPin,
    ArrowRight,
    AlertCircle,
    Loader2,
    Calendar,
    Mail,
    Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiResponse } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useUIStore } from '@/store/uiStore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import ConfirmSheet from '@/components/shared/ConfirmSheet';

interface Application {
    id: number;
    trader_id: number;
    market_id: number;
    preferred_stall_id: number | null;
    preferred_zone: string | null;
    motivation: string;
    status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
    admin_notes: string | null;
    created_at: string;
    trader: {
        business_name: string;
        user: {
            name: string;
            phone: string;
            email: string;
        }
    };
    market: {
        name: string;
    };
    preferred_stall: {
        stall_number: string;
        block: string;
    } | null;
}

interface ApplicationStats {
    pending: number;
    approved: number;
    rejected: number;
    velocity: number;
}

export default function AdminApplicationsPage() {
    const { t } = useTranslation();
    const { setPageTitle } = useUIStore();

    React.useEffect(() => {
        setPageTitle('Trader Applications');
    }, [setPageTitle]);

    const queryClient = useQueryClient();
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('pending');
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch Stats
    const { data: stats } = useQuery<ApiResponse<ApplicationStats>>({
        queryKey: ['admin-applications-stats'],
        queryFn: () => api.get('/admin/applications/stats'),
    });

    // Fetch Applications
    const { data: appsData, isLoading } = useQuery<ApiResponse<any>>({
        queryKey: ['admin-applications', filterStatus],
        queryFn: () => api.get('/admin/applications', { params: { status: filterStatus } }),
    });

    const applications: Application[] = appsData?.data?.data || [];
    const selectedApp = applications.find(a => a.id === selectedId);

    // Mutation for Approval/Rejection
    const reviewMutation = useMutation({
        mutationFn: ({ id, status, notes, stallId }: { id: number, status: string, notes: string, stallId?: number }) => 
            api.post(`/admin/applications/${id}/action`, { status, notes, stall_id: stallId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
            queryClient.invalidateQueries({ queryKey: ['admin-applications-stats'] });
            setSelectedId(null);
        }
    });

    const handleAction = (status: 'approved' | 'rejected') => {
        if (!selectedId) return;
        
        // In a real app, I'd show a modal to pick a stall if approved
        // For this demo, we'll assume the preferred stall or the first available
        reviewMutation.mutate({
            id: selectedId,
            status,
            notes: status === 'approved' ? 'Stall allocated successfully.' : 'Does not meet requirements.',
            stallId: selectedApp?.preferred_stall_id || undefined
        });
    };

    return (
        <div className="space-y-8 pb-32 px-4 pt-6">
                
                {/* 1. Header & Stats */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-end gap-6">
                    
                    <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
                        {[
                            { label: 'Pending', count: stats?.data.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                            { label: 'Approved', count: stats?.data.approved, icon: CheckCircle2, color: 'text-brand-600', bg: 'bg-brand-50' },
                            { label: 'Rejected', count: stats?.data.rejected, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' }
                        ].map((s) => (
                            <div key={s.label} className={cn("flex flex-col p-4 rounded-3xl min-w-[120px] border border-gray-100 bg-white shadow-sm transition-all cursor-pointer hover:shadow-md hover:border-brand-200", filterStatus === s.label.toLowerCase() && "border-brand-500 ring-2 ring-brand-50 shadow-brand-sm")} onClick={() => setFilterStatus(s.label.toLowerCase())}>
                                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-3", s.bg, s.color)}>
                                    <s.icon size={20} />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">{s.label}</p>
                                <p className="text-2xl font-black text-green-950">{s.count ?? 0}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Filters & Search */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-5 flex items-center text-text-muted group-focus-within:text-brand-600 transition-colors">
                            <Search size={20} />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Search traders or businesses..."
                            className="w-full h-14 pl-14 pr-6 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium text-green-950 placeholder:text-text-muted/60 shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="h-14 px-6 bg-white border border-gray-100 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest text-green-950 hover:bg-gray-50 transition-all shadow-sm">
                        <Filter size={18} /> Filters
                    </button>
                </div>

                {/* 3. Applications List */}
                <div className="grid grid-cols-1 gap-4">
                    {isLoading ? (
                        Array(5).fill(0).map((_, i) => (
                            <div key={i} className="h-28 bg-white border border-gray-100 rounded-[2rem] animate-pulse" />
                        ))
                    ) : applications.length === 0 ? (
                        <div className="bg-white border border-dashed border-gray-200 rounded-[3rem] p-20 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mb-6">
                                <FileText size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-green-950 tracking-tight">Kila kitu kipo sawa!</h3>
                            <p className="text-text-secondary font-medium mt-2 max-w-xs">No pending applications found in this category.</p>
                        </div>
                    ) : (
                        applications.map((app) => (
                            <motion.div 
                                layoutId={`app-${app.id}`}
                                key={app.id} 
                                onClick={() => setSelectedId(app.id)}
                                className={cn(
                                    "group bg-white border border-gray-100 p-4 lg:p-6 rounded-[2.5rem] flex flex-col lg:flex-row lg:items-center gap-6 cursor-pointer hover:border-brand-500 hover:shadow-xl hover:shadow-brand-100/50 transition-all",
                                    selectedId === app.id && "border-brand-500 shadow-xl shadow-brand-100/50"
                                )}
                            >
                                <div className="flex items-center gap-5 flex-1">
                                    <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-[1.5rem] flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-all shadow-inner">
                                        <Store size={32} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                                            <Calendar size={12} /> {format(new Date(app.created_at), 'dd MMM yyyy')}
                                        </p>
                                        <h3 className="text-xl font-black text-green-950 group-hover:text-brand-700 transition-colors uppercase tracking-tight">{app.trader.business_name}</h3>
                                        <p className="text-sm font-medium text-text-secondary flex items-center gap-2">
                                            <User size={14} className="text-brand-500" /> {app.trader.user.name}
                                        </p>
                                    </div>
                                </div>

                                <div className="h-full w-px bg-gray-100 hidden lg:block" />

                                <div className="flex-1 space-y-2">
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Preferred Request</p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1.5 bg-brand-50 text-brand-700 border border-brand-100 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                                            <MapPin size={12} /> {app.market.name}
                                        </span>
                                        {app.preferred_stall ? (
                                            <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                                                <Store size={12} /> Stall {app.preferred_stall.stall_number}
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                                                Zone {app.preferred_zone}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <button className="w-12 h-12 rounded-2xl bg-gray-50 text-text-muted flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-all">
                                    <ChevronRight size={24} />
                                </button>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Application Detail / Review Bottom Sheet */}
            <AnimatePresence>
                {selectedId && selectedApp && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedId(null)}
                            className="fixed inset-0 bg-green-950/40 backdrop-blur-sm z-[90] flex items-end justify-center lg:items-center lg:p-4"
                        >
                            <motion.div 
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full lg:max-w-3xl bg-surface-card rounded-t-[3rem] lg:rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                            >
                                <div className="p-8 lg:p-12 overflow-y-auto flex-1 space-y-10">
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-3xl flex items-center justify-center shadow-inner">
                                                <Store size={40} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-brand-600 uppercase tracking-[0.2em] mb-1">Trader Application</p>
                                                <h2 className="text-3xl font-black text-green-950 tracking-tighter leading-none">{selectedApp.trader.business_name}</h2>
                                                <p className="text-text-secondary font-medium mt-1 flex items-center gap-2">
                                                    Submitted {format(new Date(selectedApp.created_at), 'MMMM d, yyyy')}
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedId(null)} className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-text-muted hover:text-rose-500 transition-colors">
                                            <XCircle size={28} />
                                        </button>
                                    </div>

                                    {/* Content Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <User size={14} className="text-brand-500" /> Trader Details
                                                </h4>
                                                <div className="bg-gray-50 rounded-3xl p-6 space-y-4 border border-gray-100 shadow-inner">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-brand-600 shadow-sm">
                                                            <User size={16} />
                                                        </div>
                                                        <p className="text-sm font-black text-green-950">{selectedApp.trader.user.name}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-brand-600 shadow-sm">
                                                            <Phone size={16} />
                                                        </div>
                                                        <p className="text-sm font-bold text-text-secondary">{selectedApp.trader.user.phone}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-brand-600 shadow-sm">
                                                            <Mail size={16} />
                                                        </div>
                                                        <p className="text-sm font-bold text-text-secondary truncate">{selectedApp.trader.user.email}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <Store size={14} className="text-amber-500" /> Requested Stall
                                                </h4>
                                                <div className="bg-amber-50 rounded-3xl p-6 flex items-center gap-5 border border-amber-100">
                                                    <div className="w-14 h-14 bg-white rounded-2xl flex flex-col items-center justify-center shadow-sm text-amber-600 border border-amber-50">
                                                        <span className="text-[10px] font-black uppercase leading-none">Block</span>
                                                        <span className="text-2xl font-black leading-none">{selectedApp.preferred_stall?.block || 'Any'}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-black text-green-950 leading-tight">
                                                            {selectedApp.preferred_stall ? `Stall ${selectedApp.preferred_stall.stall_number}` : `Zone ${selectedApp.preferred_zone}`}
                                                        </p>
                                                        <p className="text-xs font-bold text-amber-700 opacity-80">{selectedApp.market.name}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                                                <FileText size={14} className="text-brand-500" /> Motivation Statement
                                            </h4>
                                            <div className="bg-white border border-gray-100 rounded-3xl p-6 min-h-[200px] text-sm lg:text-base font-medium text-text-secondary leading-relaxed shadow-brand-sm italic relative">
                                                <span className="absolute top-4 left-4 text-4xl text-brand-100 font-serif leading-none">“</span>
                                                <p className="relative z-10 px-4">{selectedApp.motivation}</p>
                                                <span className="absolute bottom-4 right-4 text-4xl text-brand-100 font-serif leading-none">”</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Admin Actions */}
                                    <div className="pt-8 border-t border-gray-100">
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <button 
                                                disabled={reviewMutation.isPending}
                                                onClick={() => handleAction('rejected')}
                                                className="flex-1 h-16 bg-white border-2 border-rose-100 text-rose-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-rose-50 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-3"
                                            >
                                                <XCircle size={18} /> Reject Application
                                            </button>
                                            <button 
                                                disabled={reviewMutation.isPending}
                                                onClick={() => handleAction('approved')}
                                                className="flex-1 h-16 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-700 active:scale-95 transition-all shadow-xl shadow-brand-900/10 flex items-center justify-center gap-3"
                                            >
                                                {reviewMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                                Approve & Allocate Stall
                                            </button>
                                        </div>
                                        <p className="text-center text-[10px] font-black text-text-muted uppercase tracking-widest mt-4">
                                            Approval will automatically create an allocation record.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
    );
}

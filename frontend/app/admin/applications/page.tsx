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
    Zap,
    Loader2,
    Phone,
    CornerDownRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiResponse } from '@/types';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

export default function AdminApplicationsPage() {
    const { setPageTitle } = useUIStore();

    React.useEffect(() => {
        setPageTitle('Trader Applications');
    }, [setPageTitle]);

    const queryClient = useQueryClient();
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('pending');
    const [searchQuery, setSearchQuery] = useState('');

    const { data: stats } = useQuery<ApiResponse<any>>({
        queryKey: ['admin-applications-stats'],
        queryFn: () => api.get('/admin/applications/stats'),
    });

    const { data: appsData, isLoading } = useQuery<ApiResponse<any>>({
        queryKey: ['admin-applications', filterStatus],
        queryFn: () => api.get('/admin/applications', { params: { status: filterStatus } }),
    });

    const applications: any[] = appsData?.data?.data || [];
    const selectedApp = applications.find(a => a.id === selectedId);

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
        reviewMutation.mutate({
            id: selectedId,
            status,
            notes: status === 'approved' ? 'Stall allocated successfully.' : 'Does not meet requirements.',
            stallId: selectedApp?.preferred_stall_id || undefined
        });
    };

    return (
        <div className="pb-32 -mx-4 md:-mx-0">
            {/* ── Summary Matrix (3-col Mobile) ── */}
            <div className="grid grid-cols-3 gap-2 px-4 mb-6">
                {[
                    { id: 'pending', label: 'Pending', count: stats?.data.pending, color: 'text-amber-600' },
                    { id: 'approved', label: 'Approv.', count: stats?.data.approved, color: 'text-brand-600' },
                    { id: 'rejected', label: 'Reject.', count: stats?.data.rejected, color: 'text-rose-600' }
                ].map((s) => (
                    <button 
                        key={s.id} 
                        onClick={() => setFilterStatus(s.id)}
                        className={cn(
                            "bg-white p-3 rounded-2xl border flex flex-col items-center transition-all active:scale-95",
                            filterStatus === s.id ? "border-brand-600 ring-4 ring-brand-50" : "border-gray-100 shadow-sm"
                        )}
                    >
                        <span className={cn("text-[9px] font-black uppercase tracking-widest mb-1", s.color)}>{s.label}</span>
                        <div className="text-xl font-black text-green-950 tracking-tight">{isLoading ? '...' : s.count ?? 0}</div>
                    </button>
                ))}
            </div>

            {/* ── Search & Filters ── */}
            <div className="px-4 mb-8">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-600" size={18} />
                    <input 
                        type="text"
                        placeholder="Search traders or stall requests..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:border-brand-300"
                    />
                </div>
            </div>

            {/* ── Applications List ── */}
            <div className="space-y-4 px-4">
                {isLoading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-3xl animate-pulse" />)
                ) : applications.length === 0 ? (
                    <div className="py-20 text-center">
                        <FileText size={48} className="mx-auto text-gray-200 mb-4" />
                        <h3 className="text-lg font-black text-green-950 tracking-tight">Kila kitu shwari.</h3>
                        <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">No pending applications found.</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {applications.map((app) => (
                            <motion.div 
                                layoutId={`app-${app.id}`}
                                key={app.id} 
                                onClick={() => setSelectedId(app.id)}
                                className="bg-white rounded-[2rem] border border-gray-50 shadow-sm overflow-hidden active:scale-[0.98] transition-all cursor-pointer"
                            >
                                <div className="p-5">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center">
                                            <Store size={24} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-black text-green-950 uppercase tracking-tight truncate">
                                                {app.trader.business_name}
                                            </h3>
                                            <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest">
                                                By {app.trader.user.name}
                                            </p>
                                            <div className="flex items-center gap-1 mt-1 text-text-secondary">
                                                <MapPin size={10} />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{app.market?.name}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            {app.preferred_stall ? (
                                                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                    Stall {app.preferred_stall.stall_number}
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                    {app.preferred_zone || 'Any'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Motivation Peek */}
                                    <div className="flex items-start gap-2 bg-gray-50/50 p-3 rounded-xl mb-2">
                                        <CornerDownRight size={12} className="text-text-muted flex-shrink-0 mt-0.5" />
                                        <p className="text-[10px] font-medium text-text-secondary line-clamp-1 italic">
                                            {app.motivation}
                                        </p>
                                    </div>
                                </div>
                                <div className="h-1 bg-brand-500 w-full opacity-0 group-active:opacity-100 transition-all" />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* Application Detail Sheet */}
            <AnimatePresence>
                {selectedId && selectedApp && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedId(null)}
                            className="fixed inset-0 bg-green-950/40 backdrop-blur-md z-[90] flex items-end justify-center"
                        >
                            <motion.div 
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                className="w-full bg-white rounded-t-[3rem] shadow-2xl flex flex-col max-h-[90vh]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-6 overflow-y-auto no-scrollbar flex-1">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center">
                                                <Store size={28} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-green-950 uppercase tracking-tight">{selectedApp.trader.business_name}</h2>
                                                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Submitted {new Date(selectedApp.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedId(null)} className="p-2 bg-gray-50 rounded-xl">
                                            <XCircle size={24} className="text-text-muted" />
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                                            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-3">Applicant Info</p>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <User size={14} className="text-brand-600" />
                                                    <span className="text-sm font-bold text-green-950">{selectedApp.trader.user.name}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Phone size={14} className="text-brand-600" />
                                                    <span className="text-sm font-bold text-text-secondary">{selectedApp.trader.user.phone}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <MapPin size={14} className="text-brand-600" />
                                                    <span className="text-sm font-bold text-text-secondary">Applying at: {selectedApp.market?.name}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Motivation</p>
                                            <div className="bg-white border border-gray-100 p-5 rounded-3xl text-sm font-medium text-text-secondary leading-relaxed italic">
                                                "{selectedApp.motivation}"
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 border-t border-gray-100 bg-white flex gap-3">
                                    <button 
                                        disabled={reviewMutation.isPending}
                                        onClick={() => handleAction('rejected')}
                                        className="flex-1 h-14 border border-rose-100 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest active:bg-rose-50 transition-all"
                                    >
                                        Reject
                                    </button>
                                    <button 
                                        disabled={reviewMutation.isPending}
                                        onClick={() => handleAction('approved')}
                                        className="flex-[2] h-14 bg-brand-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-900/10 flex items-center justify-center gap-2"
                                    >
                                        {reviewMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                                        Approve & Allocate
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

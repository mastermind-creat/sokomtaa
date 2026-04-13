'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
    Package, 
    Calendar, 
    User, 
    CheckCircle2, 
    Clock, 
    XCircle,
    Phone,
    Loader2,
    Search,
    AlertCircle
} from 'lucide-react';
import BottomNav from '@/components/shared/BottomNav';
import { ApiResponse } from '@/types';

export default function TraderReservationsPage() {
    const queryClient = useQueryClient();
    const [filter, setFilter] = React.useState('active'); // active, completed, cancelled

    const { data: resData, isLoading } = useQuery<ApiResponse<any>>({
        queryKey: ['trader-reservations', filter],
        queryFn: () => api.get('/reservations', { params: { filter } }),
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number, status: string }) => 
            api.patch(`/reservations/${id}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trader-reservations'] });
            alert('Hali imesasishwa na mteja ametumiwa taarifa. (Status updated and customer notified.)');
        },
    });

    const reservations = resData?.data?.data || [];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-brand-600" size={40} />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-surface-base pb-32">
            <header className="p-6 pt-12 flex justify-between items-center sticky top-0 bg-surface-base/80 backdrop-blur-sm z-10 border-b border-border-default">
                <div>
                    <h1 className="text-2xl font-black text-green-950 tracking-tight">Oda na Uhifadhi</h1>
                    <p className="text-xs text-brand-600 font-bold uppercase tracking-widest mt-1">Orders & Reservations</p>
                </div>
            </header>

            {/* Filter Tabs */}
            <div className="px-6 py-4 flex gap-2 border-b border-border-disabled sticky top-[88px] bg-surface-base/80 backdrop-blur-sm z-10">
                {['active', 'completed', 'cancelled'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            filter === f ? 'bg-brand-600 text-white shadow-brand-sm' : 'bg-neutral-100 text-text-muted hover:bg-neutral-200'
                        }`}
                    >
                        {f === 'active' ? 'Zinazoendelea' : f}
                    </button>
                ))}
            </div>

            <div className="p-6 space-y-4">
                {reservations.length === 0 ? (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center text-text-muted mx-auto">
                            <Package size={32} />
                        </div>
                        <p className="text-sm font-bold text-text-muted uppercase tracking-tight">Huna oda kwa sasa</p>
                    </div>
                ) : (
                    reservations.map((res: any) => (
                        <div key={res.id} className="card p-0 overflow-hidden border-2 border-transparent hover:border-brand-100 transition-all shadow-sm">
                            <div className="p-4 flex gap-4">
                                <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 grow-0 shrink-0">
                                    <Package size={28} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-black text-green-950 truncate">{res.product?.name}</h4>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                            res.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                                            res.status === 'paid' ? 'bg-brand-100 text-brand-700' :
                                            res.status === 'ready' ? 'bg-green-100 text-green-700' :
                                            'bg-neutral-100 text-neutral-500'
                                        }`}>
                                            {res.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <User size={12} className="text-text-muted" />
                                        <p className="text-xs font-bold text-text-secondary truncate">{res.resident?.name}</p>
                                    </div>
                                    <div className="mt-3 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-text-muted">
                                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(res.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        <span className="flex items-center gap-1"><Package size={12} /> Qty: {res.quantity}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Group */}
                            <div className="bg-neutral-50 p-3 border-t border-border-default flex gap-2">
                                {res.status === 'paid' && (
                                    <button 
                                        onClick={() => updateStatusMutation.mutate({ id: res.id, status: 'ready' })}
                                        disabled={updateStatusMutation.isPending}
                                        className="flex-1 h-12 bg-brand-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-brand-sm hover:shadow-brand-md active:scale-95 transition-all"
                                    >
                                        <CheckCircle2 size={16} /> Weka Tayari (Ready)
                                    </button>
                                )}
                                {res.status === 'ready' && (
                                    <button 
                                        onClick={() => updateStatusMutation.mutate({ id: res.id, status: 'completed' })}
                                        disabled={updateStatusMutation.isPending}
                                        className="flex-1 h-12 bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm hover:bg-green-700 active:scale-95 transition-all"
                                    >
                                        <CheckCircle2 size={16} /> Kamilisha (Complete)
                                    </button>
                                )}
                                {['pending', 'paid', 'ready'].includes(res.status) && (
                                    <button 
                                        onClick={() => updateStatusMutation.mutate({ id: res.id, status: 'cancelled' })}
                                        disabled={updateStatusMutation.isPending}
                                        className="px-4 h-12 border border-color-error/20 text-color-error rounded-xl text-xs font-black uppercase flex items-center justify-center hover:bg-color-error/5"
                                        title="Ghairi Oda (Cancel)"
                                    >
                                        <XCircle size={18} />
                                    </button>
                                )}
                                {res.resident?.phone && (
                                    <a 
                                        href={`tel:${res.resident.phone}`}
                                        className="px-4 h-12 bg-white border border-border-default text-brand-600 rounded-xl flex items-center justify-center active:scale-95 transition-all"
                                    >
                                        <Phone size={18} />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <BottomNav />
        </div>
    );
}

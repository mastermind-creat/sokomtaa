'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
    ShoppingBag, 
    Clock, 
    CheckCircle2, 
    XCircle, 
    QrCode, 
    ChevronRight, 
    Search,
    Filter,
    ArrowUpRight,
    Loader2,
    Calendar,
    Wallet
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiResponse, Reservation } from '@/types';
import Image from 'next/image';



type StatusFilter = 'all' | 'pending' | 'active' | 'completed';

export default function ResidentReservationsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<StatusFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const { data: reservationsData, isLoading } = useQuery<ApiResponse<Reservation[]>>({
        queryKey: ['reservations', activeTab],
        queryFn: () => api.get('/reservations', { params: { status: activeTab !== 'all' ? activeTab : undefined } }),
    });

    const reservations = reservationsData?.data || [];

    const filteredReservations = useMemo(() => {
        if (!searchQuery) return reservations;
        return reservations.filter(r => 
            r.reservation_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.trader.business_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [reservations, searchQuery]);

    const stats = useMemo(() => {
        const active = reservations.filter(r => ['paid', 'ready'].includes(r.status)).length;
        const totalSpent = reservations
            .filter(r => ['paid', 'ready', 'completed'].includes(r.status))
            .reduce((sum, r) => sum + parseFloat(r.total_amount), 0);
        return { active, totalSpent };
    }, [reservations]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'paid': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'ready': return 'bg-brand-100 text-brand-700 border-brand-200';
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            case 'expired': return 'bg-neutral-100 text-neutral-700 border-neutral-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'Pending Payment';
            case 'paid': return 'Paid (Awaiting Trader)';
            case 'ready': return 'Ready for Pickup';
            case 'completed': return 'Completed';
            case 'cancelled': return 'Cancelled';
            case 'expired': return 'Expired';
            default: return status;
        }
    };

    return (
        <DashboardLayout title="Oda Zangu (My Orders)">
            <div className="space-y-6 pb-20">
                
                {/* 1. Summary Header */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-950 p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10" />
                        <Clock size={24} className="text-brand-400 mb-3" />
                        <h4 className="text-3xl font-black font-mono tracking-tighter">{stats.active}</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-200">Active Orders</p>
                    </div>
                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                        <Wallet size={24} className="text-brand-600 mb-3" />
                        <h4 className="text-xl font-black text-green-950 font-mono tracking-tighter">KES {stats.totalSpent.toLocaleString()}</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Total Spent</p>
                    </div>
                </div>

                {/* 2. Controls & Search */}
                <div className="space-y-4">
                    <div className="flex bg-neutral-100 p-1 rounded-2xl">
                        {(['all', 'pending', 'active', 'completed'] as StatusFilter[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${
                                    activeTab === tab ? 'bg-white text-green-950 shadow-sm' : 'text-text-muted'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-600 transition-colors" size={18} />
                        <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-14 pl-12 pr-4 bg-white rounded-2xl border border-gray-100 shadow-sm focus:border-brand-500 transition-all outline-none font-medium placeholder:text-text-muted"
                            placeholder="Tafuta kwa namba ya oda au bidhaa..."
                        />
                    </div>
                </div>

                {/* 3. Reservation List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center gap-3">
                            <Loader2 className="animate-spin text-brand-600" size={32} />
                            <p className="text-[10px] font-black text-brand-700 uppercase tracking-widest animate-pulse">Checking Orders...</p>
                        </div>
                    ) : filteredReservations.length > 0 ? (
                        filteredReservations.map((res) => (
                            <motion.div 
                                key={res.id}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-brand-sm group active:scale-[0.98] transition-all"
                                onClick={() => router.push(`/reservations/${res.id}`)}
                            >
                                <div className="flex gap-4">
                                    <div className="w-20 h-20 bg-neutral-50 rounded-2xl overflow-hidden border border-gray-100 shrink-0 relative">
                                        {res.product?.image_url ? (
                                            <Image src={res.product.image_url} alt={res.product.name} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-text-muted"><ShoppingBag size={24} /></div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-1 py-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusColor(res.status)}`}>
                                                {getStatusLabel(res.status)}
                                            </span>
                                            <span className="text-[10px] font-mono font-black text-text-muted">#{res.reservation_code}</span>
                                        </div>
                                        <h4 className="font-black text-green-950 text-sm">{res.product?.name}</h4>
                                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-tight">
                                            {res.trader?.business_name} • Quantity: {res.quantity}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-dashed border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-text-muted">
                                        <Calendar size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-tight">
                                            {new Date(res.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="text-sm font-black text-green-950">KES {Number(res.total_amount).toLocaleString()}</p>
                                        <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                                            {['ready', 'paid'].includes(res.status) ? <QrCode size={18} /> : <ChevronRight size={18} />}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-neutral-50 rounded-[2rem] flex items-center justify-center text-neutral-200 mx-auto">
                                <ShoppingBag size={40} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-green-950">Huna oda zozote hivi sasa</h3>
                                <p className="text-xs text-text-secondary font-medium px-10">Anza kufanya miamala na wafanyibiashara wetu ili kuona oda zako hapa.</p>
                            </div>
                            <button 
                                onClick={() => router.push('/')}
                                className="px-8 py-4 bg-brand-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-brand-100"
                            >
                                Anza Kununua (Shop Now)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

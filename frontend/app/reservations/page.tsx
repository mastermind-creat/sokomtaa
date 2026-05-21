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
    Wallet,
    ArrowLeft,
    ChevronDown,
    Download,
    History as HistoryIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiResponse, Reservation } from '@/types';
import Image from 'next/image';
import ReceiptModal from '@/components/resident/ReceiptModal';

type StatusFilter = 'all' | 'pending' | 'paid' | 'ready' | 'completed' | 'cancelled';

export default function ResidentReservationsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<StatusFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const { data: reservationsData, isLoading } = useQuery<ApiResponse<Reservation[]>>({
        queryKey: ['reservations', activeTab],
        queryFn: () => api.get('/reservations', { params: { status: activeTab !== 'all' ? activeTab : undefined } }).then(res => res.data),
    });

    const [selectedReceipt, setSelectedReceipt] = useState<Reservation | null>(null);

    const handleViewReceipt = (res: Reservation) => {
        setSelectedReceipt(res);
    };

    const reservations = reservationsData?.data || [];

    const filteredReservations = useMemo(() => {
        let filtered = [...reservations];

        // Sort by professional order: urgent status first, then by date (newest first)
        const statusPriority: Record<string, number> = {
            'ready': 1,
            'paid': 2,
            'pending': 3,
            'completed': 4,
            'cancelled': 5,
            'expired': 6
        };

        filtered.sort((a, b) => {
            const priorityA = statusPriority[a.status] || 99;
            const priorityB = statusPriority[b.status] || 99;
            
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            
            const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return timeB - timeA;
        });

        if (searchQuery) {
            filtered = filtered.filter(r =>
                r.reservation_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.trader?.business_name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return filtered;
    }, [reservations, searchQuery]);

    const stats = useMemo(() => {
        const active = reservations.filter(r => ['pending', 'paid', 'ready'].includes(r.status)).length;
        const totalSpent = reservations
            .filter(r => ['paid', 'ready', 'completed'].includes(r.status))
            .reduce((sum, r: any) => sum + parseFloat(String(r.total_amount || 0)), 0);
        return { active, totalSpent };
    }, [reservations]);

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'paid': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'ready': return 'bg-brand-50 text-brand-600 border-brand-100';
            case 'completed': return 'bg-green-50 text-green-600 border-green-100';
            case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'expired': return 'bg-neutral-50 text-neutral-600 border-neutral-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'Pending Payment';
            case 'paid': return 'Paid & Processing';
            case 'ready': return 'Ready for Pickup';
            case 'completed': return 'Completed';
            case 'cancelled': return 'Cancelled';
            case 'expired': return 'Expired';
            default: return status.charAt(0).toUpperCase() + status.slice(1);
        }
    };

    return (
        <DashboardLayout title="My Reservations">
            <div className="max-w-5xl mx-auto space-y-10 pb-32">

                {/* Header Section */}
                <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => router.back()}
                                className="w-10 h-10 bg-white rounded-xl border border-gray-100 flex items-center justify-center text-text-muted hover:text-brand-600 hover:border-brand-100 transition-all shadow-sm"
                            >
                                <ArrowLeft size={18} />
                            </button>
                            <span className="bg-brand-100 text-brand-700 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-brand-200">
                                Orders & History
                            </span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-green-950 tracking-tight">Your Reservations</h1>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-green-950 px-6 py-4 rounded-[2rem] text-white shadow-xl flex items-center gap-4 border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform">
                                <ShoppingBag size={48} />
                            </div>
                            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-brand-400 border border-white/10 shrink-0">
                                <Clock size={20} />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black font-mono leading-none">{stats.active}</h4>
                                <p className="text-[9px] font-black uppercase tracking-widest text-brand-300 mt-1">Active Orders</p>
                            </div>
                        </div>
                        <div className="bg-white px-6 py-4 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 group">
                            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 shrink-0 group-hover:scale-110 transition-transform">
                                <Wallet size={20} />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-green-950 font-mono leading-none">KES {stats.totalSpent.toLocaleString()}</h4>
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mt-1">Total Spent</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Filters & Search */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-brand-sm space-y-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex bg-neutral-100 p-1.5 rounded-2xl flex-1 lg:max-w-md">
                            {(['all', 'pending', 'paid', 'ready', 'completed'] as StatusFilter[]).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab ? 'bg-white text-brand-700 shadow-md' : 'text-text-muted hover:text-text-primary'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-600 transition-colors" size={20} />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-14 pl-12 pr-4 bg-neutral-50 rounded-2xl border-2 border-transparent focus:border-brand-500 focus:bg-white transition-all outline-none font-bold text-sm placeholder:text-text-muted shadow-inner focus:shadow-none"
                                placeholder="Search by order code, product or trader..."
                            />
                        </div>
                    </div>
                </div>

                {/* Reservation Cards List */}
                <div className="space-y-6">
                    {isLoading ? (
                        <div className="py-32 flex flex-col items-center gap-6">
                            <div className="relative">
                                <Loader2 className="animate-spin text-brand-600" size={56} />
                                <div className="absolute inset-0 blur-2xl bg-brand-400/20 animate-pulse" />
                            </div>
                            <p className="text-[10px] font-black text-brand-700 uppercase tracking-[0.4em] animate-pulse">Syncing with Market...</p>
                        </div>
                    ) : filteredReservations.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 md:gap-6">
                            {filteredReservations.map((res, index) => (
                                <motion.div
                                    key={res.id}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white p-2.5 rounded-2xl border border-gray-100 shadow-brand-sm group hover:shadow-lg transition-all cursor-pointer relative overflow-hidden flex flex-col gap-2"
                                    onClick={() => router.push(`/reservations/${res.id}`)}
                                >
                                    <div className="relative">
                                        <div className="w-full aspect-square bg-neutral-50 rounded-xl overflow-hidden border border-gray-50 relative shadow-inner">
                                            {res.product?.image_url ? (
                                                <Image src={res.product.image_url} alt={res.product?.name ?? 'Product'} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-neutral-200"><ShoppingBag size={20} /></div>
                                            )}
                                        </div>
                                        <div className="absolute top-1.5 left-1.5">
                                            <span className={`px-2 py-0.5 rounded-md text-[6px] font-black uppercase tracking-wider border shadow-sm ${getStatusStyles(res.status)}`}>
                                                {getStatusLabel(res.status)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-0.5 px-0.5">
                                        <div className="flex items-center justify-between gap-1">
                                            <p className="text-[6px] font-mono font-black text-text-muted">#{res.reservation_code}</p>
                                            <div className="flex items-center gap-1">
                                                {['paid', 'completed', 'ready'].includes(res.status) && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewReceipt(res);
                                                        }}
                                                        className="w-5 h-5 bg-brand-50 text-brand-600 rounded-md flex items-center justify-center hover:bg-brand-600 hover:text-white transition-all shadow-sm"
                                                        title="View Receipt"
                                                    >
                                                        <QrCode size={10} />
                                                    </button>
                                                )}
                                                <p className="text-[8px] font-black text-green-950">KES {Math.round(typeof res.total_amount === 'number' ? res.total_amount : parseFloat(res.total_amount || '0'))}</p>
                                            </div>
                                        </div>
                                        <h4 className="font-black text-green-950 text-[9px] truncate group-hover:text-brand-700 transition-colors uppercase leading-tight">{res.product?.name}</h4>
                                        <p className="text-[7px] font-bold text-text-secondary truncate">{res.trader?.business_name}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-32 text-center space-y-8 bg-white rounded-[4rem] border-2 border-dashed border-gray-100">
                            <div className="relative inline-block">
                                <div className="w-28 h-28 bg-neutral-50 rounded-[3rem] flex items-center justify-center text-neutral-200 mx-auto transition-transform hover:rotate-12">
                                    <ShoppingBag size={56} />
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-text-muted">
                                    <HistoryIcon size={24} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-green-950 tracking-tight">No matching reservations</h3>
                                <p className="text-sm text-text-secondary font-medium px-10 max-w-md mx-auto">Try adjusting your filters or start exploring the market for fresh deals.</p>
                            </div>
                            <button
                                onClick={() => router.push('/resident')}
                                className="px-10 py-5 bg-brand-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-100 flex items-center gap-3 mx-auto"
                            >
                                <ShoppingBag size={18} /> Gundua Bidhaa (Discover)
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            <AnimatePresence>
                {selectedReceipt && (
                    <ReceiptModal 
                        reservation={selectedReceipt} 
                        onClose={() => setSelectedReceipt(null)} 
                    />
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}

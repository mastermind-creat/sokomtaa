'use client';

import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
    ChevronLeft, 
    QrCode, 
    Copy, 
    CheckCircle2, 
    AlertCircle, 
    MapPin, 
    Store, 
    Clock, 
    Phone,
    ArrowUpRight,
    Loader2,
    XCircle
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { ApiResponse } from '@/types';
import { motion } from 'framer-motion';

interface Reservation {
    id: number;
    reservation_code: string;
    quantity: number;
    total_amount: string;
    unit_price: string;
    status: 'pending' | 'paid' | 'ready' | 'completed' | 'cancelled' | 'expired';
    pickup_deadline: string;
    product: {
        name: string;
        image_url?: string;
        unit: string;
    };
    trader: {
        id: number;
        business_name: string;
        stall: { stall_number: string; block: string };
        phone: string;
    };
    created_at: string;
}

export default function ReservationPickupPage() {
    const { id } = useParams();
    const router = useRouter();

    const { data: resData, isLoading } = useQuery<ApiResponse<Reservation>>({
        queryKey: ['reservation', id],
        queryFn: () => api.get(`/reservations/${id}`),
    });

    const cancelMutation = useMutation({
        mutationFn: () => api.post(`/reservations/${id}/cancel`),
        onSuccess: () => {
            router.refresh();
        }
    });

    const reservation = resData?.data;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
                <Loader2 className="animate-spin text-brand-600 mb-4" size={48} />
                <p className="text-sm font-black text-brand-700 uppercase tracking-widest animate-pulse">Safisha Maelezo ya Oda...</p>
            </div>
        );
    }

    if (!reservation) return null;

    const isPickupReady = ['paid', 'ready'].includes(reservation.status);

    return (
        <div className="min-h-screen bg-surface pb-32">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl z-50 px-6 py-6 border-b border-gray-100 flex items-center justify-between shadow-sm">
                <button 
                    onClick={() => router.back()}
                    className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center text-green-950 active:scale-90 transition-all"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="text-center">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-0.5">Reservation Detail</p>
                    <h1 className="text-xs font-black text-green-950 uppercase tracking-widest font-mono">#{reservation.reservation_code}</h1>
                </div>
                <div className="w-12" /> {/* Spacer */}
            </header>

            <main className="pt-28 px-6 space-y-6">
                
                {/* 1. Status Hero */}
                <div className={`p-8 rounded-[3rem] text-center space-y-4 shadow-xl relative overflow-hidden ${
                    isPickupReady ? 'bg-green-950 text-white' : 'bg-white border border-gray-100 text-green-950'
                }`}>
                    {isPickupReady && (
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                    )}
                    
                    <div className="space-y-1">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            isPickupReady ? 'bg-brand-500 text-white' : 'bg-neutral-100 text-neutral-500'
                        }`}>
                            {reservation.status === 'ready' ? 'Ready for Pickup' : reservation.status === 'paid' ? 'Paid & Active' : reservation.status}
                        </span>
                        <h2 className="text-2xl font-black tracking-tight pt-2">
                            {isPickupReady ? 'Onyesha namba hii sokoni' : 'Order Maelezo'}
                        </h2>
                    </div>

                    {isPickupReady && (
                        <div className="py-6 space-y-6">
                            {/* Alphanumeric Code */}
                            <div className="bg-white p-8 rounded-[2.5rem] border-4 border-dashed border-brand-200 shadow-inner">
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-3">Pickup Code</p>
                                <h3 className="text-5xl font-black text-brand-700 font-mono tracking-tighter select-all">{reservation.reservation_code}</h3>
                            </div>
                            
                            <div className="flex justify-center gap-4">
                                <button className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/20 text-xs font-black uppercase tracking-widest">
                                    <Copy size={16} /> Copy Code
                                </button>
                                <button className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/20 text-xs font-black uppercase tracking-widest">
                                    <QrCode size={16} /> QR Code
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Pickup Location & Instructions */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-brand-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-green-950 uppercase tracking-widest">Pickup Information</h3>
                        <CheckCircle2 size={20} className="text-brand-500" />
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 shrink-0">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-tight">Market & Stall</p>
                                <h4 className="text-sm font-black text-green-950">{reservation.trader.business_name}</h4>
                                <p className="text-xs font-medium text-text-secondary">Block {reservation.trader.stall.block}, Stall {reservation.trader.stall.stall_number}</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                                <Clock size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-tight">Pickup Deadline</p>
                                <h4 className="text-sm font-black text-green-950">
                                    {new Date(reservation.pickup_deadline).toLocaleDateString()} at {new Date(reservation.pickup_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </h4>
                                <p className="text-[10px] text-amber-600 font-bold uppercase mt-1">Saa 24 baada ya kulipia</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-dashed border-gray-100">
                        <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
                            Tafadhali fika sokoni kabla ya muda uliopangwa. Ukifika, oyesha <strong>namba ya oda</strong> kwa mfanyibiashara ili kupokea bidhaa zako.
                        </p>
                    </div>
                </div>

                {/* 3. Product Summary */}
                <div className="bg-neutral-50 p-6 rounded-[2.5rem] border border-gray-100 space-y-4">
                    <h3 className="text-sm font-black text-green-950 uppercase tracking-widest">Oda Summary</h3>
                    <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-neutral-50 rounded-xl overflow-hidden shrink-0">
                                {reservation.product.image_url ? <img src={reservation.product.image_url} className="w-full h-full object-cover" /> : <Loader2 className="m-auto text-neutral-200" />}
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-green-950">{reservation.product.name}</h4>
                                <p className="text-[10px] font-bold text-text-muted">Quantity: {reservation.quantity} {reservation.product.unit}</p>
                            </div>
                        </div>
                        <p className="text-sm font-black text-green-950">KES {parseFloat(reservation.total_amount).toLocaleString()}</p>
                    </div>
                </div>

                {/* 4. Actions */}
                <div className="flex flex-col gap-3 py-4">
                    <button 
                        onClick={() => router.push(`/trader/${reservation.trader.id}`)}
                        className="w-full h-16 bg-white border-2 border-gray-100 text-green-950 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
                    >
                        <Store size={18} /> Visit Trader
                    </button>
                    
                    {reservation.status === 'pending' && (
                        <button 
                            onClick={() => cancelMutation.mutate()}
                            disabled={cancelMutation.isPending}
                            className="w-full h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
                        >
                            {cancelMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                            Cancel Order
                        </button>
                    )}

                    <a 
                        href={`tel:${reservation.trader.phone}`}
                        className="w-full h-16 bg-brand-50 text-brand-700 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
                    >
                        <Phone size={18} /> Call Trader
                    </a>
                </div>

            </main>
        </div>
    );
}

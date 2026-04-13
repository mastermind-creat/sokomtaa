'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
    Package, 
    Calendar, 
    MapPin, 
    ChevronRight, 
    Clock, 
    CheckCircle2, 
    Ticket,
    Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ApiResponse } from '@/types';
import BottomNav from '@/components/shared/BottomNav';
import MpesaPaymentSheet from '@/components/shared/MpesaPaymentSheet';
import ComplaintSheet from '@/components/shared/ComplaintSheet';

export default function ReservationsPage() {
    const router = useRouter();
    const [selectedRes, setSelectedRes] = React.useState<any>(null);
    const [isPaymentSheetOpen, setIsPaymentSheetOpen] = React.useState(false);
    const [isComplaintSheetOpen, setIsComplaintSheetOpen] = React.useState(false);

    const { data: resData, isLoading, refetch } = useQuery<ApiResponse<any>>({
        queryKey: ['my-reservations'],
        queryFn: () => api.get('/reservations'),
    });

    const reservations = resData?.data?.data || [];

    const handlePayClick = (e: React.MouseEvent, res: any) => {
        e.stopPropagation();
        setSelectedRes(res);
        setIsPaymentSheetOpen(true);
    };

    const handleReportClick = (e: React.MouseEvent, res: any) => {
        e.stopPropagation();
        setSelectedRes(res);
        setIsComplaintSheetOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-brand-600" size={40} />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-surface-base pb-32">
            <header className="p-6 pt-12 flex justify-between items-center sticky top-0 bg-surface-base/80 backdrop-blur-md z-10 border-b border-border-default">
                <div>
                    <h1 className="text-2xl font-black text-green-950">Uhifadhi Wangu</h1>
                    <p className="text-xs text-text-muted font-bold uppercase tracking-wider">My Reservations ({reservations.length})</p>
                </div>
            </header>

            <div className="p-6 space-y-6">
                {reservations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center text-text-muted">
                            <Ticket size={40} />
                        </div>
                        <div>
                            <p className="font-bold text-green-950 uppercase tracking-tight">Huna uhifadhi wowote</p>
                            <p className="text-sm text-text-muted mt-1 leading-relaxed">Bidhaa unazochagua zitatajwa hapa. <br/>(Your booked items will appear here.)</p>
                        </div>
                        <button 
                            onClick={() => router.push('/')}
                            className="btn btn-primary h-12 px-8 text-sm font-black"
                        >
                            Gundua Soko (Explore Market)
                        </button>
                    </div>
                ) : (
                    reservations.map((res: any) => (
                        <div 
                            key={res.id}
                            onClick={() => router.push(`/reservations/${res.id}`)}
                            className="card p-0 overflow-hidden hover:border-brand-500 transition-all cursor-pointer group active:scale-[0.98] relative"
                        >
                            {/* Code Banner */}
                            <div className="bg-green-50 px-4 py-3 border-b border-brand-100 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
                                        <Ticket size={18} />
                                    </div>
                                    <span className="text-sm font-black text-brand-700 tracking-wider uppercase">Code: {res.reservation_code}</span>
                                </div>
                                <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                    res.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                                    res.status === 'paid' ? 'bg-brand-600 text-white' :
                                    res.status === 'ready' ? 'bg-green-100 text-green-700' :
                                    'bg-neutral-100 text-neutral-500'
                                }`}>
                                    {res.status === 'pending' ? 'Pending Payment' : res.status}
                                </div>
                            </div>

                            <div className="p-4 flex gap-4">
                                <div className="w-16 h-16 bg-neutral-100 rounded-2xl overflow-hidden shadow-inner">
                                    {res.product?.image_url ? (
                                        <img src={res.product.image_url} alt="Item" className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-text-muted"><Package size={24} /></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-green-950 truncate">{res.product?.name}</h4>
                                    <p className="text-xs text-brand-600 font-bold mt-0.5">{res.trader?.business_name}</p>
                                    
                                    <div className="flex items-center gap-3 mt-3">
                                        <div className="flex items-center gap-1 text-[10px] text-text-muted font-bold uppercase tracking-wider">
                                            <Calendar size={12} />
                                            <span>{new Date(res.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-text-muted font-bold uppercase tracking-wider">
                                            <MapPin size={12} />
                                            <span>Stall {res.trader?.stall?.stall_number}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end justify-center gap-2">
                                    {res.status === 'pending' && (
                                        <button 
                                            onClick={(e) => handlePayClick(e, res)}
                                            className="bg-brand-600 text-white text-[10px] font-black uppercase px-3 py-2 rounded-xl shadow-brand-md active:scale-90 transition-all"
                                        >
                                            Lipa Sasa
                                        </button>
                                    )}
                                    <button 
                                        onClick={(e) => handleReportClick(e, res)}
                                        className="bg-white text-color-error text-[10px] font-black uppercase px-3 py-2 rounded-xl border border-color-error/20 active:scale-90 transition-all"
                                    >
                                        Lalamika
                                    </button>
                                    <ChevronRight size={20} className="text-text-muted group-hover:text-brand-600" />
                                </div>
                            </div>

                            {/* Status Footer */}
                            <div className="bg-surface-base px-4 py-2 border-t border-border-default flex items-center justify-between">
                                <span className="text-[10px] font-bold text-text-secondary uppercase">
                                    {res.status === 'paid' ? 'Paid Amount' : 'Total to Pay'}
                                </span>
                                <span className={`text-sm font-black font-mono tracking-tighter uppercase whitespace-nowrap ${res.status === 'paid' ? 'text-brand-600' : 'text-green-900'}`}>
                                    KES {parseFloat(res.total_amount).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    ))
                )}

                {/* Info Card */}
                {reservations.length > 0 && (
                    <div className="p-5 bg-brand-600 rounded-[32px] text-white shadow-brand-lg relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12 scale-150">
                            <CheckCircle2 size={120} />
                        </div>
                        <h4 className="text-lg font-black tracking-tight mb-2">Kidokezo / Tip</h4>
                        <p className="text-xs opacity-90 leading-relaxed font-bold">
                            Onyesha mfanyabiashara namba ya siri (SM-XXXX) ili kuthibitisha kuwa umelipia bidhaa zako dukani.
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-md px-3 py-1 rounded-full w-fit">
                            <Clock size={12} /> Expiry: 24h
                        </div>
                    </div>
                )}
            </div>

            <MpesaPaymentSheet 
                isOpen={isPaymentSheetOpen}
                onClose={() => setIsPaymentSheetOpen(false)}
                type="reservation"
                targetId={selectedRes?.id}
                amount={selectedRes ? parseFloat(selectedRes.total_amount) : 0}
                onSuccess={() => refetch()}
            />

            <ComplaintSheet 
                isOpen={isComplaintSheetOpen}
                onClose={() => setIsComplaintSheetOpen(false)}
                reservationId={selectedRes?.id}
                traderId={selectedRes?.trader_id}
            />

            <BottomNav />
        </div>
    );
}

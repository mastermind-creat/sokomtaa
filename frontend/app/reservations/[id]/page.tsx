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
    XCircle,
    ShoppingBag,
    ShieldCheck,
    Smartphone,
    Star,
    Truck,
    Bike,
    User,
    Check
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useMpesa } from '@/hooks/useMpesa';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import ReviewSheet from '@/components/resident/ReviewSheet';
import { ApiResponse } from '@/types';

interface Reservation {
    id: number;
    reservation_code: string;
    quantity: number;
    total_amount: string;
    unit_price: string;
    service_fee?: string;
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
        stall?: { stall_number: string; block: string } | null;
        phone: string;
    };
    created_at: string;
    delivery_option?: boolean;
    delivery_status?: 'pending_assignment' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | null;
    delivery_fee?: string;
    delivery_address?: string;
    rider?: {
        name: string;
        phone: string;
        delivery_profile?: {
            vehicle_type: string;
            license_plate?: string;
        } | null;
    } | null;
}

export default function ReservationPickupPage() {
    const { id } = useParams();
    const router = useRouter();

    const { user } = useAuthStore();
    const { initiateStk, isPolling, status: mpesaStatus, error: mpesaError } = useMpesa();
    const [checkoutId, setCheckoutId] = React.useState<string | null>(null);

    const [showReviewSheet, setShowReviewSheet] = React.useState(false);

    const { data: resData, isLoading, refetch } = useQuery<ApiResponse<Reservation & { review?: any }>>({
        queryKey: ['reservation', id],
        queryFn: () => api.get(`/reservations/${id}`),
    });

    React.useEffect(() => {
        if (mpesaStatus === 'completed') {
            refetch();
        }
    }, [mpesaStatus, refetch]);

    const cancelMutation = useMutation({
        mutationFn: () => api.post(`/reservations/${id}/cancel`),
        onSuccess: () => {
            refetch();
        }
    });

    const handlePayment = async () => {
        if (!reservation || !user?.phone) return;
        try {
            const id = await initiateStk(user.phone, 'reservation', reservation.id);
            setCheckoutId(id);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSimulateSuccess = async () => {
        if (!checkoutId) return;
        try {
            await api.post(`/payments/mpesa/simulate-success/${checkoutId}`);
            refetch();
        } catch (err) {
            console.error(err);
        }
    };

    const reservation = resData?.data;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
                <Loader2 className="animate-spin text-brand-600 mb-4" size={48} />
                <p className="text-sm font-black text-brand-700 uppercase tracking-widest animate-pulse">Fetching Order Details...</p>
            </div>
        );
    }

    if (!reservation) return null;

    const isPickupReady = ['paid', 'ready'].includes(reservation.status) && !reservation.delivery_option;

    return (
        <div className="min-h-screen bg-surface pb-32">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl z-50 px-6 py-6 border-b border-gray-100 shadow-sm">
                <div className="max-w-2xl mx-auto flex items-center justify-between w-full">
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
                </div>
            </header>

            <main className="pt-28 px-6 space-y-6 max-w-2xl mx-auto">
                
                {/* 1. Status Hero */}
                <div className={`p-8 rounded-[3rem] text-center space-y-4 shadow-xl relative overflow-hidden ${
                    isPickupReady ? 'bg-green-950 text-white' : 'bg-white border border-gray-100 text-green-950'
                }`}>
                    {isPickupReady && (
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                    )}
                    
                    <div className="space-y-1">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-fit mx-auto ${
                            isPickupReady ? 'bg-brand-500 text-white' : 'bg-neutral-100 text-neutral-500'
                        }`}>
                            {reservation.status === 'paid' || reservation.status === 'ready' ? (
                                <><ShieldCheck size={12} /> Paid & Secured</>
                            ) : (
                                reservation.status
                            )}
                        </span>
                        <h2 className="text-2xl font-black tracking-tight pt-2">
                            {isPickupReady ? 'Show this code at the market' : 'Order Details'}
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

                {/* 2. Delivery Progress Tracker (Only when delivery_option is true) */}
                {reservation.delivery_option && (
                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-brand-sm space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                            <div>
                                <h3 className="text-sm font-black text-green-950 uppercase tracking-widest">Delivery Progress</h3>
                                <p className="text-[10px] font-bold text-text-muted mt-0.5">Rider tracking updates</p>
                            </div>
                            <span className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center shrink-0">
                                <Truck size={20} />
                            </span>
                        </div>

                        {/* Progress Stepper */}
                        <div className="relative space-y-8 py-2">
                            {/* Vertical Line */}
                            <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-neutral-100 z-0">
                                <div 
                                    className="w-full bg-brand-600 transition-all duration-500" 
                                    style={{ 
                                        height: 
                                            reservation.delivery_status === 'delivered' ? '100%' :
                                            ['picked_up', 'in_transit'].includes(reservation.delivery_status || '') ? '66%' :
                                            reservation.delivery_status === 'assigned' ? '33%' : '0%'
                                    }}
                                />
                            </div>

                            {/* Step 1: Paid & Booked */}
                            <div className="relative flex gap-4 z-10">
                                <div className="w-8 h-8 shrink-0 rounded-full border-2 border-brand-500 bg-white flex items-center justify-center text-brand-600 shadow-sm">
                                    <Check size={14} className="stroke-[3]" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-green-950 uppercase tracking-wide">Order Paid</h4>
                                    <p className="text-[10px] text-text-secondary mt-0.5">Payment received. Awaiting rider assignment.</p>
                                </div>
                            </div>

                            {/* Step 2: Rider Assigned */}
                            <div className="relative flex gap-4 z-10">
                                <div className={`w-8 h-8 shrink-0 rounded-full border-2 bg-white flex items-center justify-center shadow-sm ${
                                    reservation.delivery_status && reservation.delivery_status !== 'pending_assignment'
                                        ? 'border-brand-500 text-brand-600'
                                        : 'border-neutral-200 text-neutral-300'
                                }`}>
                                    {reservation.delivery_status && reservation.delivery_status !== 'pending_assignment' ? (
                                        <Check size={14} className="stroke-[3]" />
                                    ) : (
                                        <div className="w-2 h-2 rounded-full bg-neutral-300 animate-pulse" />
                                    )}
                                </div>
                                <div>
                                    <h4 className={`text-xs font-black uppercase tracking-wide ${
                                        reservation.delivery_status && reservation.delivery_status !== 'pending_assignment' ? 'text-green-950' : 'text-neutral-400'
                                    }`}>Rider Assigned</h4>
                                    <p className="text-[10px] text-text-secondary mt-0.5">
                                        {reservation.delivery_status && reservation.delivery_status !== 'pending_assignment' 
                                            ? `${reservation.rider?.name || 'A rider'} has accepted your shipment.`
                                            : 'Finding a reliable local rider to deliver your items...'}
                                    </p>
                                </div>
                            </div>

                            {/* Step 3: Out for Delivery */}
                            <div className="relative flex gap-4 z-10">
                                <div className={`w-8 h-8 shrink-0 rounded-full border-2 bg-white flex items-center justify-center shadow-sm ${
                                    ['picked_up', 'in_transit', 'delivered'].includes(reservation.delivery_status || '')
                                        ? 'border-brand-500 text-brand-600'
                                        : 'border-neutral-200 text-neutral-300'
                                }`}>
                                    {['picked_up', 'in_transit', 'delivered'].includes(reservation.delivery_status || '') ? (
                                        <Check size={14} className="stroke-[3]" />
                                    ) : (
                                        <Truck size={14} />
                                    )}
                                </div>
                                <div>
                                    <h4 className={`text-xs font-black uppercase tracking-wide ${
                                        ['picked_up', 'in_transit', 'delivered'].includes(reservation.delivery_status || '') ? 'text-green-950' : 'text-neutral-400'
                                    }`}>Out for Delivery</h4>
                                    <p className="text-[10px] text-text-secondary mt-0.5">
                                        {['picked_up', 'in_transit', 'delivered'].includes(reservation.delivery_status || '')
                                            ? 'The rider has picked up your items and is heading to your location!'
                                            : 'Rider will collect items once packaged.'}
                                    </p>
                                </div>
                            </div>

                            {/* Step 4: Completed / Delivered */}
                            <div className="relative flex gap-4 z-10">
                                <div className={`w-8 h-8 shrink-0 rounded-full border-2 bg-white flex items-center justify-center shadow-sm ${
                                    reservation.delivery_status === 'delivered'
                                        ? 'border-brand-500 text-brand-600 bg-brand-50'
                                        : 'border-neutral-200 text-neutral-300'
                                }`}>
                                    <ShieldCheck size={14} />
                                </div>
                                <div>
                                    <h4 className={`text-xs font-black uppercase tracking-wide ${
                                        reservation.delivery_status === 'delivered' ? 'text-green-950' : 'text-neutral-400'
                                    }`}>Delivered</h4>
                                    <p className="text-[10px] text-text-secondary mt-0.5">
                                        {reservation.delivery_status === 'delivered'
                                            ? 'Items delivered and verification code checked successfully!'
                                            : 'Awaiting handoff.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Rider details card if assigned */}
                        {reservation.rider && (
                            <div className="mt-4 p-4 bg-brand-50/50 rounded-2xl border border-brand-100 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-brand-600 border border-brand-100 shrink-0">
                                        {reservation.rider.delivery_profile?.vehicle_type === 'bicycle' ? (
                                            <Bike size={24} />
                                        ) : reservation.rider.delivery_profile?.vehicle_type === 'foot' ? (
                                            <User size={24} />
                                        ) : (
                                            <Truck size={24} />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black text-brand-700 uppercase tracking-widest">
                                            {reservation.rider.delivery_profile?.vehicle_type === 'bicycle' ? 'Bicycle Rider' :
                                             reservation.rider.delivery_profile?.vehicle_type === 'foot' ? 'Foot Delivery' :
                                             reservation.rider.delivery_profile?.vehicle_type === 'handcart' ? 'Handcart Delivery' : 'Boda Rider'}
                                        </p>
                                        <h4 className="text-xs font-black text-green-950 truncate leading-tight">{reservation.rider.name}</h4>
                                        <p className="text-[9px] font-bold text-text-muted mt-0.5">
                                            {reservation.rider.delivery_profile?.license_plate ? `Plate: ${reservation.rider.delivery_profile.license_plate}` : 'No Plate'}
                                        </p>
                                    </div>
                                </div>

                                <a 
                                    href={`tel:${reservation.rider.phone}`}
                                    className="w-10 h-10 bg-brand-600 text-white rounded-xl flex items-center justify-center active:scale-95 transition-all hover:bg-brand-700 shadow-md shadow-brand-200"
                                >
                                    <Phone size={16} />
                                </a>
                            </div>
                        )}

                        {/* Release code note */}
                        {reservation.delivery_status !== 'delivered' && (
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center space-y-1.5">
                                <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Verification Required</p>
                                <p className="text-[10px] text-amber-800 leading-normal font-medium">
                                    Provide the pickup code <span className="font-mono font-black text-brand-700 select-all text-xs">{reservation.reservation_code}</span> to the rider once your package arrives to complete delivery securely.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. Location & Destination Summary */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-brand-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-green-950 uppercase tracking-widest">Order Summary</h3>
                        <CheckCircle2 size={20} className="text-brand-500" />
                    </div>

                    <div className="space-y-4">
                        {/* Pickup Point (Market Stall) */}
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 shrink-0">
                                <Store size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-tight">Pickup Location</p>
                                <h4 className="text-sm font-black text-green-950">{reservation.trader.business_name}</h4>
                                <p className="text-xs font-medium text-text-secondary">
                                    {reservation.trader.stall ? (
                                        <>Block {reservation.trader.stall.block}, Stall {reservation.trader.stall.stall_number}</>
                                    ) : (
                                        <span className="italic text-amber-600">Stall information pending</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Delivery Destination if delivery option is true */}
                        {reservation.delivery_option ? (
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-tight">Delivery Address</p>
                                    <h4 className="text-sm font-black text-green-950 leading-snug">{reservation.delivery_address}</h4>
                                    <p className="text-xs font-bold text-brand-600 mt-0.5">
                                        Fee: KES {parseFloat(reservation.delivery_fee || '0').toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            /* Regular pickup deadline if self collection */
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-tight">Pickup Deadline</p>
                                    <h4 className="text-sm font-black text-green-950">
                                        {new Date(reservation.pickup_deadline).toLocaleDateString()} at {new Date(reservation.pickup_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </h4>
                                    <p className="text-[10px] text-amber-600 font-bold uppercase mt-1">24 hours after payment</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-dashed border-gray-100">
                        {reservation.delivery_option ? (
                            <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
                                A local rider will pick up your package from the stall above and deliver it directly to your address. Show the code only upon successful arrival.
                            </p>
                        ) : (
                            <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
                                Please arrive at the market before the scheduled time. Once you arrive, show your <strong>order code</strong> to the trader to receive your items.
                            </p>
                        )}
                    </div>
                </div>

                {/* 3. Product Summary - Small Card Version */}
                <div className="bg-neutral-50 p-5 rounded-[2rem] border border-gray-100">
                    <div className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-50">
                        <div className="w-16 h-16 bg-neutral-50 rounded-xl overflow-hidden shrink-0 border border-gray-50">
                            {reservation.product.image_url ? (
                                <img src={reservation.product.image_url} className="w-full h-full object-cover" alt={reservation.product.name} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-neutral-200">
                                    <ShoppingBag size={20} />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-black text-green-950 truncate uppercase leading-tight">{reservation.product.name}</h4>
                            <p className="text-[9px] font-bold text-text-muted mt-0.5">
                                {reservation.quantity} {reservation.product.unit} × KES {parseFloat(reservation.unit_price).toLocaleString()}
                            </p>
                        </div>
                        <div className="text-right pl-2 space-y-1">
                            <p className="text-[10px] font-bold text-text-muted">Subtotal: KES {(parseFloat(reservation.unit_price) * reservation.quantity).toLocaleString()}</p>
                            <p className="text-[10px] font-bold text-brand-600">Fee: KES {parseFloat(reservation.service_fee || '0').toLocaleString()}</p>
                            <p className="text-sm font-black text-green-950 border-t border-dashed border-gray-100 pt-1">Total: KES {parseFloat(reservation.total_amount).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* 4. Actions */}
                <div className="flex flex-col gap-3 py-4">
                    {reservation.status === 'pending' && (
                        <div className="space-y-3 p-6 bg-white rounded-[2.5rem] border-2 border-brand-100 shadow-xl shadow-brand-900/5">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600">
                                    <Smartphone size={24} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-green-950 uppercase">Complete Payment</h4>
                                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-tight">Requires M-Pesa Confirmation</p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={handlePayment}
                                disabled={isPolling}
                                className="w-full h-16 bg-brand-600 text-white rounded-2xl flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-brand-200 disabled:opacity-50"
                            >
                                {isPolling ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                                {isPolling ? 'Confirming...' : 'Pay KES ' + parseFloat(reservation.total_amount).toLocaleString()}
                            </button>

                            {isPolling && (
                                <div className="text-center space-y-3 pt-2">
                                    <p className="text-[10px] font-bold text-brand-600 animate-pulse">Waiting for your M-Pesa PIN entry...</p>
                                    <button 
                                        onClick={handleSimulateSuccess}
                                        className="text-[9px] font-black text-amber-600 underline uppercase tracking-widest"
                                    >
                                        Simulate Success (Local Dev)
                                    </button>
                                </div>
                            )}

                            {mpesaError && (
                                <p className="text-[10px] font-bold text-red-600 text-center bg-red-50 p-2 rounded-lg">{mpesaError}</p>
                            )}
                        </div>
                    )}

                    {reservation.status === 'completed' && !reservation.review && (
                        <button 
                            onClick={() => setShowReviewSheet(true)}
                            className="w-full h-16 bg-amber-500 text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-amber-200"
                        >
                            <Star size={18} fill="currentColor" />
                            Leave a Review
                        </button>
                    )}

                    <button 
                        onClick={() => router.push(`/trader/${reservation.trader.id}`)}
                        className="w-full h-16 bg-white border-2 border-gray-100 text-green-950 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
                    >
                        <Store size={18} /> Visit Trader
                    </button>
                    
                    {reservation.status === 'pending' && !isPolling && (
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
            <AnimatePresence>
                {showReviewSheet && reservation && (
                    <ReviewSheet 
                        reservation={reservation as any}
                        onClose={() => setShowReviewSheet(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

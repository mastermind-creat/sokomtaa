'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShoppingBag, 
    Plus, 
    Minus, 
    Phone, 
    AlertCircle, 
    Loader2, 
    CheckCircle2, 
    ChevronRight, 
    TrendingUp,
    ShieldCheck,
    Smartphone
} from 'lucide-react';
import { useMpesa } from '@/hooks/useMpesa';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { ApiResponse, Reservation, Product } from '@/types';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { SystemSetting } from '@/types';


interface ReservationFlowProps {
    product: Product;
    traderId: number;
    onClose: () => void;
}

type Step = 'review' | 'payment' | 'processing' | 'success';

export default function ReservationFlow({ product, traderId, onClose }: ReservationFlowProps) {
    const { t } = useTranslation();
    const [step, setStep] = useState<Step>('review');
    const [quantity, setQuantity] = useState(1);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [secondsLeft, setSecondsLeft] = useState(60);
    const [reservationId, setReservationId] = useState<number | null>(null);
    const [reservationCode, setReservationCode] = useState<string>('');
    const [localError, setLocalError] = useState<string | null>(null);
    const [checkoutId, setCheckoutId] = useState<string | null>(null);
    
    const { user } = useAuthStore();
    const router = useRouter();
    const { initiateStk, isPolling, status, error, stopPolling } = useMpesa();

    useEffect(() => {
        if (user?.phone) {
            setPhoneNumber(user.phone);
        }
    }, [user]);

    // Fetch Settings for Fee Logic (public endpoint — no auth needed)
    const { data: settings } = useQuery<Record<string, SystemSetting[]>>({
        queryKey: ['system-settings-public'],
        queryFn: async () => {
            const res = await api.get('/settings/public');
            return res.data.data ?? {};
        },
        staleTime: 5 * 60 * 1000, // cache 5 min
    });

    const feeAmount = parseFloat(settings?.fees?.find(s => s.key === 'resident_service_fee')?.value || '10');
    const threshold = parseFloat(settings?.fees?.find(s => s.key === 'service_fee_threshold')?.value || '200');
    
    const subtotal = product.price * quantity;
    const activeFee = subtotal > threshold ? feeAmount : 0;
    const totalWithFee = subtotal + activeFee;

    // Timer for processing step
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (step === 'processing' && secondsLeft > 0) {
            timer = setInterval(() => setSecondsLeft(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [step, secondsLeft]);

    // Track status from useMpesa
    useEffect(() => {
        if (status === 'completed') {
            setStep('success');
        }
    }, [status]);

    const handleNextToPayment = async () => {
        setStep('payment');
    };

    const handleConfirmPayment = async () => {
        setLocalError(null);
        try {
            // 1. Create the reservation first in 'pending' status
            const response = await api.post<ApiResponse<Reservation>>('/reservations', {
                product_id: product.id,
                quantity: quantity,
                trader_id: traderId
            });
            
            // The axios interceptor returns response.data, so response IS {success, data, message}
            const reservation = (response as any).data as Reservation;
            if (!reservation?.id) {
                throw new Error('Reservation could not be created. Please try again.');
            }
            setReservationId(reservation.id);
            setReservationCode(reservation.reservation_code);
            
            // 2. Initiate STK
            const id = await initiateStk(phoneNumber, 'reservation', reservation.id);
            setCheckoutId(id);
            setStep('processing');
            setSecondsLeft(60);
        } catch (err: any) {
            console.error('Reservation creation failed', err);
            setLocalError(err.message || 'Failed to complete reservation. Please try again.');
        }
    };

    const handleSimulateSuccess = async () => {
        if (!checkoutId) return;
        try {
            await api.post(`/payments/mpesa/simulate-success/${checkoutId}`);
            // Polling should pick it up, but we can also manually check
        } catch (err) {
            console.error('Simulation failed', err);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="bg-white rounded-t-[3rem] p-6 md:p-8 max-w-[480px] mx-auto w-full relative shadow-2xl overflow-y-auto max-h-[95vh] no-scrollbar"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag Handle */}
                <div className="w-12 h-1.5 bg-neutral-100 rounded-full mx-auto mb-8" />

                <AnimatePresence mode="wait">
                    {/* STEP 1: REVIEW ORDER */}
                    {step === 'review' && (
                        <motion.div 
                            key="review"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="space-y-6"
                        >
                            <div className="flex gap-6 items-start">
                                <div className="w-28 h-28 bg-neutral-50 rounded-[2rem] overflow-hidden border-2 border-white shadow-brand-md shrink-0">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                            <ShoppingBag size={40} />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1 py-1 text-left">
                                    <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest">{product.category?.name || t('common.product')}</span>
                                    <h3 className="text-xl font-black text-green-950 leading-tight">{product.name}</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xs font-bold text-text-muted">KES</span>
                                        <span className="text-2xl font-black text-green-950 font-mono">{product.price}</span>
                                        <span className="text-xs text-text-muted">/{product.unit}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-lg w-fit mt-2">
                                        <TrendingUp size={12} className="text-green-600" />
                                        <span className="text-[9px] font-black text-green-700 uppercase">Best Price</span>
                                    </div>
                                </div>
                            </div>
 
                            <div className="bg-neutral-50 p-6 rounded-[2.5rem] border border-gray-100 flex items-center justify-between">
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Quantity ({product.unit}s)</p>
                                    <h4 className="text-lg font-black text-green-950">Select Quantity</h4>
                                </div>
                                <div className="flex items-center gap-4 bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
                                    <button 
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-neutral-50 active:scale-90 transition-all text-green-950"
                                    >
                                        <Minus size={20} />
                                    </button>
                                    <span className="text-xl font-black font-mono w-6 text-center">{quantity}</span>
                                    <button 
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-neutral-50 active:scale-90 transition-all text-green-950"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>
 
                            <div className="space-y-4 pt-4 border-t border-neutral-100">
                                <div className="flex items-center justify-between px-4">
                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Subtotal</span>
                                    <span className="text-sm font-black text-green-950 font-mono">KES {product.price * quantity}</span>
                                </div>
                                <div className="flex items-center justify-between px-4">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Service Fee</span>
                                        <div className="group relative">
                                            <AlertCircle size={10} className="text-text-muted" />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-green-950 text-white text-[8px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                Convenience fee for securing your items online.
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-sm font-black text-brand-600 font-mono">
                                        {activeFee > 0 ? `KES ${activeFee.toFixed(2)}` : 'FREE'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between px-4 pt-2">
                                    <span className="text-sm font-black text-green-950 uppercase tracking-widest">Total Amount</span>
                                    <span className="text-2xl font-black text-green-950 font-mono">KES {totalWithFee.toFixed(2)}</span>
                                </div>
                                <button 
                                    onClick={handleNextToPayment}
                                    className="w-full h-16 bg-brand-600 text-white rounded-2xl flex items-center justify-between px-8 text-sm font-black uppercase tracking-widest shadow-xl shadow-brand-100 group"
                                >
                                    Proceed to Payment
                                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    )}
 
                    {/* STEP 2: PAYMENT INFO */}
                    {step === 'payment' && (
                        <motion.div 
                            key="payment"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="space-y-6"
                        >
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mx-auto mb-4">
                                    <Phone size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-green-950">M-Pesa Payment</h3>
                                <p className="text-sm text-text-secondary font-medium px-4">Enter your phone number to receive the payment prompt.</p>
                            </div>
 
                            <div className="space-y-4">
                                <div className="relative group">
                                    <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-600" size={20} />
                                    <input 
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="w-full h-16 pl-14 pr-4 bg-neutral-50 rounded-2xl border-2 border-transparent focus:border-brand-500 focus:bg-white transition-all outline-none font-mono text-lg font-black"
                                        placeholder="07XXXXXXXX or +254..."
                                    />
                                </div>
 
                                <div className="flex gap-4 items-start bg-amber-50 p-5 rounded-[2rem] border border-amber-100 text-left">
                                    <AlertCircle className="text-amber-500 shrink-0" size={24} />
                                    <p className="text-[11px] text-amber-900 leading-relaxed font-bold uppercase tracking-tight">
                                        This reservation is only valid for 24 hours. Pay now to secure your item and avoid disappointment.
                                    </p>
                                </div>

                                {localError && (
                                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        {localError}
                                    </div>
                                )}
                            </div>
 
                            <div className="flex flex-col gap-3 pt-4">
                                <button 
                                    onClick={handleConfirmPayment}
                                    disabled={!phoneNumber || isPolling}
                                    className="w-full h-16 bg-brand-600 text-white rounded-2xl flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest shadow-xl shadow-brand-100 active:scale-95 transition-all"
                                >
                                    {isPolling ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />}
                                    Confirm Order (Pay KES {totalWithFee.toFixed(2)})
                                </button>
                                <button 
                                    onClick={() => setStep('review')}
                                    className="w-full py-4 text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-brand-600 transition-colors"
                                >
                                    Go Back
                                </button>
                            </div>
                        </motion.div>
                    )}
 
                    {/* STEP 3: PROCESSING / POLLING */}
                    {step === 'processing' && (
                        <motion.div 
                            key="processing"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center py-10 space-y-8"
                        >
                            <div className="relative w-32 h-32 mx-auto">
                                <div className="absolute inset-0 bg-brand-100 rounded-full animate-ping opacity-25" />
                                <div className="absolute inset-4 bg-brand-200 rounded-full animate-ping opacity-40 delay-300" />
                                <div className="relative w-full h-full bg-white rounded-full border-8 border-brand-50 shadow-2xl flex items-center justify-center text-brand-600">
                                    <Smartphone size={48} className="animate-bounce" />
                                </div>
                            </div>
 
                            <div className="space-y-3">
                                <h3 className="text-2xl font-black text-green-950">Processing Payment...</h3>
                                <p className="text-sm text-text-secondary font-medium px-8 leading-relaxed">
                                    Please check your phone and enter your <strong>M-Pesa PIN</strong> to complete the payment.
                                </p>
                            </div>
 
                            <div className="bg-neutral-50 px-6 py-4 rounded-2xl inline-flex items-center gap-3">
                                <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                                <span className="font-mono font-black text-brand-600">{secondsLeft}s left</span>
                            </div>
 
                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 mt-4">
                                    {error}
                                </div>
                            )}

                            {/* Simulation Button for Dev */}
                            <div className="pt-4 space-y-4">
                                <button 
                                    onClick={handleSimulateSuccess}
                                    className="w-full py-3 bg-amber-50 text-amber-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-200 hover:bg-amber-100 transition-colors"
                                >
                                    I have paid (Simulate Success)
                                </button>
                                
                                <button 
                                    onClick={onClose}
                                    className="text-[10px] font-black text-text-muted uppercase tracking-widest block mx-auto underline"
                                >
                                    Cancel Payment
                                </button>
                            </div>
                        </motion.div>
                    )}
 
                    {/* STEP 4: SUCCESS */}
                    {step === 'success' && (
                        <motion.div 
                            key="success"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center py-6 space-y-8"
                        >
                            <div className="w-24 h-24 bg-green-50 rounded-full mx-auto flex items-center justify-center text-green-600 shadow-inner border-4 border-white overflow-hidden relative">
                                <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="z-10"
                                >
                                    <CheckCircle2 size={64} />
                                </motion.div>
                                {/* Simple CSS Confetti representation */}
                                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                    {[...Array(8)].map((_, i) => (
                                        <div 
                                            key={i} 
                                            className="absolute w-2 h-2 rounded-full animate-ping"
                                            style={{
                                                backgroundColor: ['#10b981', '#f59e0b', '#3b82f6'][i % 3],
                                                top: `${Math.random() * 100}%`,
                                                left: `${Math.random() * 100}%`,
                                                animationDuration: `${1 + Math.random()}s`
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
 
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black text-green-950 leading-tight">Order Received!</h3>
                                <p className="text-sm text-text-secondary font-medium">Thank you for using Soko Mtaa. Your items have been successfully reserved.</p>
                            </div>
 
                            <div className="bg-neutral-50 p-6 rounded-[2.5rem] border-2 border-dashed border-neutral-200">
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">Reservation Code</p>
                                <h4 className="text-4xl font-black text-green-950 font-mono tracking-tighter">{reservationCode}</h4>
                            </div>
 
                            <div className="flex flex-col gap-3 pt-4">
                                <button 
                                    onClick={() => router.push('/reservations')}
                                    className="w-full h-16 bg-brand-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-brand-100"
                                >
                                    View My Reservations
                                </button>
                                <button 
                                    onClick={onClose}
                                    className="w-full py-4 text-[10px] font-black text-text-muted uppercase tracking-widest"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

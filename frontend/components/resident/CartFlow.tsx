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
    Smartphone,
    Trash2,
    Lock,
    Clock,
    CreditCard
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useMpesa } from '@/hooks/useMpesa';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { ApiResponse, Reservation } from '@/types';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { SystemSetting } from '@/types';

interface CartFlowProps {
    traderId: number;
    onClose: () => void;
}

type Step = 'cart' | 'payment' | 'processing' | 'success';

export default function CartFlow({ traderId, onClose }: CartFlowProps) {
    const { t } = useTranslation();
    const [step, setStep] = useState<Step>('cart');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [secondsLeft, setSecondsLeft] = useState(60);
    const [localError, setLocalError] = useState<string | null>(null);
    const [checkoutId, setCheckoutId] = useState<string | null>(null);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    
    const { items, updateQuantity, removeItem, getTotalAmount, clearCart, traderName } = useCartStore();
    const { user } = useAuthStore();
    const router = useRouter();
    const { initiateStk, isPolling, status, error } = useMpesa();

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
    
    const subtotal = getTotalAmount();
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
            clearCart();
        }
    }, [status, clearCart]);

    const handleConfirmPayment = async () => {
        setLocalError(null);
        try {
            // 1. Create bulk reservations
            const response = await api.post<ApiResponse<Reservation[]>>('/reservations/bulk', {
                items: items.map(item => ({
                    product_id: item.id,
                    quantity: item.cartQuantity
                })),
                trader_id: traderId
            });
            
            // The axios interceptor returns response.data, so response IS {success, data, message}
            const createdReservations = (response as any).data as Reservation[];
            if (!Array.isArray(createdReservations) || createdReservations.length === 0) {
                throw new Error('No reservations were created. Please try again.');
            }
            setReservations(createdReservations);
            
            // 2. Initiate STK for the total amount
            const id = await initiateStk(phoneNumber, 'reservation', createdReservations.map(r => r.id));
            setCheckoutId(id);
            setStep('processing');
            setSecondsLeft(60);
        } catch (err: any) {
            console.error('Bulk reservation failed', err);
            setLocalError(err.response?.data?.message || err.message || 'Failed to complete reservation. Please try again.');
        }
    };

    const serviceFee = 10.00;
    const total = getTotalAmount() + serviceFee;

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
                    {/* STEP 1: CART REVIEW */}
                    {step === 'cart' && (
                        <motion.div 
                            key="cart"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="space-y-6"
                        >
                            <div className="text-left">
                                <h3 className="text-2xl font-black text-green-950">{t('storefront.your_cart') || 'Your Cart'}</h3>
                                <p className="text-sm text-text-secondary font-medium">{traderName}</p>
                            </div>

                            <div className="space-y-4 max-h-[40vh] overflow-y-auto no-scrollbar py-2">
                                {items.map((item) => (
                                    <div key={item.id} className="flex gap-4 items-center bg-neutral-50 p-4 rounded-3xl border border-neutral-100">
                                        <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden border border-neutral-100 shrink-0">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-neutral-200">
                                                    <ShoppingBag size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-green-950 truncate">{item.name}</h4>
                                            <p className="text-xs text-text-muted font-mono">KES {item.price} / {item.unit}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="flex items-center gap-2 bg-white rounded-xl border border-neutral-100 p-1">
                                                <button 
                                                    onClick={() => updateQuantity(item.id, item.cartQuantity - 1)}
                                                    className="p-1 hover:bg-neutral-50 rounded-lg"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="text-xs font-black w-4 text-center">{item.cartQuantity}</span>
                                                <button 
                                                    onClick={() => updateQuantity(item.id, item.cartQuantity + 1)}
                                                    className="p-1 hover:bg-neutral-50 rounded-lg"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <button 
                                                onClick={() => removeItem(item.id)}
                                                className="text-red-400 hover:text-red-600 p-1"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3 pt-4 border-t border-neutral-100">
                                <div className="flex justify-between items-center text-xs text-text-muted uppercase font-black tracking-widest px-2">
                                    <span>Subtotal</span>
                                    <span className="font-mono">KES {getTotalAmount()}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-text-muted uppercase font-black tracking-widest px-2">
                                    <div className="flex items-center gap-1">
                                        <span>Service Fee</span>
                                        <Lock size={10} />
                                    </div>
                                    <span className="font-mono">
                                        {activeFee > 0 ? `KES ${activeFee.toFixed(2)}` : 'FREE'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center px-2 pt-2">
                                    <span className="text-lg font-black text-green-950 uppercase tracking-widest">Total</span>
                                    <span className="text-2xl font-black text-brand-600 font-mono">KES {totalWithFee.toFixed(2)}</span>
                                </div>
                                
                                <button 
                                    onClick={() => setStep('payment')}
                                    className="w-full h-16 bg-brand-600 text-white rounded-2xl flex items-center justify-between px-8 text-sm font-black uppercase tracking-widest shadow-xl shadow-brand-100 group mt-4"
                                >
                                    Proceed to Checkout
                                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: PAYMENT */}
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
                                    <CreditCard size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-green-950">M-Pesa Payment</h3>
                                <p className="text-sm text-text-secondary font-medium">Payment will be sent to <strong>{traderName}</strong></p>
                            </div>

                            <div className="space-y-4">
                                <div className="relative">
                                    <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                                    <input 
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="w-full h-16 pl-14 pr-4 bg-neutral-50 rounded-2xl border-2 border-transparent focus:border-brand-500 outline-none font-mono text-lg font-black"
                                        placeholder="07XXXXXXXX or +254..."
                                    />
                                </div>

                                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                                    <Clock size={20} className="text-amber-500 shrink-0" />
                                    <p className="text-[10px] text-amber-900 font-bold uppercase tracking-tight">
                                        Stall items are reserved for 24 hours only. Please pay to secure your order.
                                    </p>
                                </div>

                                {localError && (
                                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100">
                                        {localError}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3 pt-4">
                                <button 
                                    onClick={handleConfirmPayment}
                                    disabled={!phoneNumber || isPolling}
                                    className="w-full h-16 bg-brand-600 text-white rounded-2xl flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest shadow-xl shadow-brand-100"
                                >
                                    {isPolling ? <Loader2 className="animate-spin" /> : <Smartphone size={20} />}
                                    Pay KES {totalWithFee.toFixed(2)}
                                </button>
                                <button 
                                    onClick={() => setStep('cart')}
                                    className="w-full py-4 text-[10px] font-black text-text-muted uppercase tracking-widest"
                                >
                                    Back to Cart
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: PROCESSING */}
                    {step === 'processing' && (
                        <motion.div 
                            key="processing"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center py-10 space-y-8"
                        >
                            <div className="relative w-32 h-32 mx-auto">
                                <div className="absolute inset-0 bg-brand-100 rounded-full animate-ping opacity-25" />
                                <div className="relative w-full h-full bg-white rounded-full border-8 border-brand-50 shadow-2xl flex items-center justify-center text-brand-600">
                                    <Loader2 size={48} className="animate-spin" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-green-950">Confirming Payment...</h3>
                                <p className="text-sm text-text-secondary font-medium px-8">
                                    Enter your <strong>M-Pesa PIN</strong> on your phone to complete the transaction.
                                </p>
                            </div>
                            <div className="bg-neutral-50 px-6 py-4 rounded-2xl inline-flex items-center gap-3">
                                <span className="font-mono font-black text-brand-600">{secondsLeft}s remaining</span>
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
                            <div className="w-24 h-24 bg-green-50 rounded-full mx-auto flex items-center justify-center text-green-600 shadow-inner">
                                <CheckCircle2 size={64} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black text-green-950">Success!</h3>
                                <p className="text-sm text-text-secondary font-medium">Your items from {traderName} have been reserved.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-2 max-h-[20vh] overflow-y-auto no-scrollbar">
                                {reservations.map(res => (
                                    <div key={res.id} className="bg-neutral-50 p-4 rounded-2xl flex justify-between items-center border border-neutral-100">
                                        <div className="text-left">
                                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{res.product?.name}</p>
                                            <p className="text-sm font-black text-green-950 font-mono">{res.reservation_code}</p>
                                        </div>
                                        <div className="bg-white px-3 py-1 rounded-full border border-neutral-100">
                                            <span className="text-[10px] font-black text-brand-600 uppercase">Paid</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-3 pt-4">
                                <button 
                                    onClick={() => {
                                        onClose();
                                        router.push('/reservations');
                                    }}
                                    className="w-full h-16 bg-brand-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest"
                                >
                                    View My Reservations
                                </button>
                                <button 
                                    onClick={onClose}
                                    className="w-full py-4 text-[10px] font-black text-text-muted uppercase tracking-widest"
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

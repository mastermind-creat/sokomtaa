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
    CreditCard,
    Truck,
    MapPin
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
import { normalizePhoneNumber, handleApiError } from '@/lib/utils';




interface CartFlowProps {
    onClose: () => void;
}

type Step = 'cart' | 'payment' | 'processing' | 'success';

export default function CartFlow({ onClose }: CartFlowProps) {
    const { t } = useTranslation();
    const [step, setStep] = useState<Step>('cart');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [secondsLeft, setSecondsLeft] = useState(60);
    const [localError, setLocalError] = useState<string | null>(null);
    const [checkoutId, setCheckoutId] = useState<string | null>(null);
    const [reservations, setReservations] = useState<Reservation[]>([]);

    const { items, updateQuantity, removeItem, getTotalAmount, clearCart } = useCartStore();
    const { user } = useAuthStore();
    const router = useRouter();
    const { initiateStk, isPolling, status, error } = useMpesa();

    useEffect(() => {
        if (user?.phone) {
            setPhoneNumber(user.phone);
        }
    }, [user]);

    const [deliveryOption, setDeliveryOption] = useState(false);
    const [deliveryMtaa, setDeliveryMtaa] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [deliveryLat, setDeliveryLat] = useState<number | null>(null);
    const [deliveryLng, setDeliveryLng] = useState<number | null>(null);
    const [calculatedDeliveryFee, setCalculatedDeliveryFee] = useState(0);

    // Pre-populate with default delivery info if available
    useEffect(() => {
        if (user && deliveryOption) {
            if (user.default_delivery_mtaa && !deliveryMtaa) {
                setDeliveryMtaa(user.default_delivery_mtaa);
            }
            if (user.default_delivery_address && !deliveryAddress) {
                setDeliveryAddress(user.default_delivery_address);
            }
            if (user.default_delivery_latitude && user.default_delivery_longitude && !deliveryLat && !deliveryLng) {
                setDeliveryLat(Number(user.default_delivery_latitude));
                setDeliveryLng(Number(user.default_delivery_longitude));
            }
        }
    }, [user, deliveryOption]);

    const firstItem = items[0];
    const pickupLat = firstItem?.trader?.market?.latitude
        ? parseFloat(firstItem.trader.market.latitude)
        : firstItem?.trader?.latitude
            ? Number(firstItem.trader.latitude)
            : -1.2864; // Gikomba Market fallback

    const pickupLng = firstItem?.trader?.market?.longitude
        ? parseFloat(firstItem.trader.market.longitude)
        : firstItem?.trader?.longitude
            ? Number(firstItem.trader.longitude)
            : 36.8378; // Gikomba Market fallback

    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return parseFloat((R * c).toFixed(2));
    };

    const calculateDeliveryFee = (distanceKm: number, orderSubtotal: number = 0) => {
        let rawFee = 100.00;
        if (distanceKm > 3.0) {
            rawFee = 100.00 + (distanceKm - 3.0) * 30.00;
        }
        
        if (orderSubtotal > 0) {
            const proportionalCap = Math.max(10.0, orderSubtotal * 0.25);
            return parseFloat((Math.min(rawFee, proportionalCap)).toFixed(2));
        }
        
        return parseFloat(rawFee.toFixed(2));
    };



    useEffect(() => {
        if (deliveryOption && deliveryLat && deliveryLng) {
            const dist = calculateDistance(pickupLat, pickupLng, deliveryLat, deliveryLng);
            const sub = getTotalAmount();
            const fee = calculateDeliveryFee(dist, sub);
            setCalculatedDeliveryFee(fee);
        } else {
            setCalculatedDeliveryFee(0);
        }
    }, [deliveryOption, deliveryLat, deliveryLng, pickupLat, pickupLng, items, getTotalAmount]);

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
    const totalWithFee = subtotal + activeFee + (deliveryOption ? calculatedDeliveryFee : 0);

    // Timer for processing step
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (step === 'processing' && secondsLeft > 0) {
            timer = setInterval(() => setSecondsLeft(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [step, secondsLeft]);

    // Track status fromh useMpesa
    useEffect(() => {
        if (status === 'completed') {
            setStep('success');
            clearCart();
        }
    }, [status, clearCart]);

    const handleConfirmPayment = async () => {
        setLocalError(null);
        try {
            const normalizedPhone = normalizePhoneNumber(phoneNumber);
            if (!normalizedPhone) {
                throw new Error('Please enter a valid phone number');
            }

            // 1. Create bulk reservations (Derives trader_id from each product on backend)
            const payload: any = {
                items: items.map(item => ({
                    product_id: item.id,
                    quantity: item.cartQuantity
                })),
            };

            if (deliveryOption) {
                if (!deliveryLat || !deliveryLng || !deliveryMtaa) {
                    throw new Error('Please set your delivery Mtaa and location coordinates in your profile to use shipping.');
                }
                payload.delivery_option = true;
                payload.delivery_mtaa = deliveryMtaa;
                payload.delivery_address = deliveryAddress || `${deliveryMtaa} Area`;
                payload.delivery_latitude = deliveryLat;
                payload.delivery_longitude = deliveryLng;
            }

            const response = await api.post<ApiResponse<Reservation[]>>('/reservations/bulk', payload);

            // The axios interceptor returns response.data, so response IS {success, data, message}
            const createdReservations = (response as any).data as Reservation[];
            if (!Array.isArray(createdReservations) || createdReservations.length === 0) {
                throw new Error('No reservations were created. Please try again.');
            }
            setReservations(createdReservations);

            // 2. Initiate STK for the total amount
            const id = await initiateStk(normalizedPhone, 'reservation', createdReservations.map(r => r.id));
            setCheckoutId(id);
            setStep('processing');
            setSecondsLeft(60);
        } catch (err: any) {
            console.error('Bulk reservation failed', err);
            setLocalError(handleApiError(err));
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
                                <h3 className="text-2xl font-black text-green-950">{t('storefront.your_cart') || 'Market Cart'}</h3>
                                <p className="text-sm text-text-secondary font-medium">Items from different traders</p>
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

                            {/* Dynamic Shipping / Delivery Preference Selection */}
                            <div className="bg-neutral-50 p-5 rounded-[2rem] border border-neutral-100/80 space-y-4 my-4">
                                <h4 className="text-xs font-black uppercase tracking-wider text-green-950 flex items-center gap-2 pl-1">
                                    <Truck size={14} className="text-brand-600" />
                                    How to Receive Your Order (Njia ya Kupokea)
                                </h4>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setDeliveryOption(false)}
                                        className={`p-4 rounded-2xl border-2 text-left transition-all active:scale-95 flex flex-col justify-between h-20 ${
                                            !deliveryOption 
                                                ? 'border-brand-500 bg-white shadow-brand-sm' 
                                                : 'border-transparent bg-neutral-100 hover:bg-neutral-200/50'
                                        }`}
                                    >
                                        <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">Self Pickup</span>
                                        <span className="text-xs font-black text-green-950">Chukua Mwenyewe</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDeliveryOption(true)}
                                        className={`p-4 rounded-2xl border-2 text-left transition-all active:scale-95 flex flex-col justify-between h-20 ${
                                            deliveryOption 
                                                ? 'border-brand-500 bg-white shadow-brand-sm' 
                                                : 'border-transparent bg-neutral-100 hover:bg-neutral-200/50'
                                        }`}
                                    >
                                        <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">Rider Delivery</span>
                                        <span className="text-xs font-black text-green-950">Niletee na Rider</span>
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {deliveryOption && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-3 overflow-hidden pt-2"
                                        >
                                            {user?.default_delivery_latitude && user?.default_delivery_longitude ? (
                                                <div className="space-y-4">
                                                    <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 flex items-start gap-3">
                                                        <MapPin className="text-brand-600 mt-0.5 shrink-0" size={16} />
                                                        <div>
                                                            <p className="text-xs font-bold text-brand-900">Delivery to {deliveryMtaa}</p>
                                                            <p className="text-[10px] text-brand-700/80 mt-0.5 leading-relaxed">
                                                                {deliveryAddress}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <p className="text-[10px] text-text-secondary">To change your delivery location, please update your profile settings.</p>
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                                                    <div className="flex gap-3">
                                                        <AlertCircle className="text-rose-600 shrink-0" size={20} />
                                                        <div>
                                                            <p className="text-xs font-bold text-rose-900">Delivery Profile Incomplete</p>
                                                            <p className="text-[10px] text-rose-700 mt-1 leading-relaxed">
                                                                You must set your Mtaa (Neighborhood) and exact location coordinates in your profile before you can request delivery.
                                                            </p>
                                                            <button 
                                                                onClick={() => { onClose(); router.push('/profile'); }}
                                                                className="mt-3 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold shadow-sm"
                                                            >
                                                                Update Profile
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {(deliveryLat && deliveryLng) && (
                                                <div className="p-3 bg-brand-50/50 rounded-xl border border-brand-100/50 text-[10px] text-brand-900 font-bold uppercase tracking-wider flex justify-between items-center">
                                                    <span>Calculated Shipping Fee:</span>
                                                    <span className="font-mono text-brand-600 font-black">KES {calculatedDeliveryFee.toFixed(2)}</span>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
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
                                {deliveryOption && (
                                    <div className="flex justify-between items-center text-xs text-text-muted uppercase font-black tracking-widest px-2">
                                        <div className="flex items-center gap-1">
                                            <span>Shipping Fee</span>
                                            <Truck size={10} />
                                        </div>
                                        <span className="font-mono">
                                            KES {calculatedDeliveryFee.toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center px-2 pt-2">
                                    <span className="text-lg font-black text-green-950 uppercase tracking-widest">Total</span>
                                    <span className="text-2xl font-black text-brand-600 font-mono">KES {totalWithFee.toFixed(2)}</span>
                                </div>

                                <button
                                    onClick={() => setStep('payment')}
                                    disabled={deliveryOption && (!deliveryLat || !deliveryLng || !deliveryMtaa)}
                                    className="w-full h-16 bg-brand-600 text-white rounded-2xl flex items-center justify-between px-8 text-sm font-black uppercase tracking-widest shadow-xl shadow-brand-100 group mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                <p className="text-sm text-text-secondary font-medium">Pay for your marketplace items</p>
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
                                <p className="text-sm text-text-secondary font-medium">Your marketplace items have been reserved.</p>
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

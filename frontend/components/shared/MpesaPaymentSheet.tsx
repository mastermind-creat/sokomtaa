'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import api from '@/lib/api';
import { ApiResponse } from '@/types';

interface MpesaPaymentSheetProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'reservation' | 'market_fee' | 'wallet_topup';
    targetId?: number;
    amount?: number;
    onSuccess?: () => void;
    title?: string;
    description?: string;
}
export default function MpesaPaymentSheet({ isOpen, onClose, type, targetId, amount, onSuccess, title, description }: MpesaPaymentSheetProps) {
    const [phone, setPhone] = React.useState('07');
    const [inputAmount, setInputAmount] = React.useState(amount?.toString() || '');
    const [status, setStatus] = React.useState<'idle' | 'pending' | 'success' | 'error'>('idle');
    const [message, setMessage] = React.useState('');
    const [isProcessing, setIsProcessing] = React.useState(false);

    interface MpesaStkResponse {
        CheckoutRequestID: string;
        CustomerMessage: string;
    }

    const handlePayment = async () => {
        if (!phone.match(/^(?:254|\+254|0)?(7|1)[0-9]{8}$/)) {
            setMessage('Invalid phone number. Use 07XXXXXXXX, 254... or +254...');
            setStatus('error');
            return;
        }

        setIsProcessing(true);
        setStatus('pending');
        setMessage('Please complete the payment on your phone...');

        try {
            await api.post<ApiResponse<MpesaStkResponse>>('/payments/mpesa/stkpush', {
                phone_number: phone,
                type,
                target_id: targetId || 0,
                amount: type === 'wallet_topup' ? parseFloat(inputAmount) : amount
            });
            
            setStatus('success');
            setMessage('Payment request sent successfully!');
            
            setTimeout(() => {
                onSuccess?.();
                onClose();
            }, 3000);
        } catch (err: unknown) {
            setStatus('error');
            let errorMsg = 'An error occurred during payment.';
            
            if (err && typeof err === 'object') {
                const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
                errorMsg = axiosError.response?.data?.message || axiosError.message || errorMsg;
            }
            
            setMessage(errorMsg);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    key="mpesa-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                />
            )}
            {isOpen && (
                <motion.div 
                    key="mpesa-sheet"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-8 z-[70] shadow-2xl safe-bottom"
                >
                    <div className="flex justify-between items-center mb-1">
                        <h2 className="text-2xl font-bold text-green-950">{title || 'Pay with M-Pesa'}</h2>
                        <button 
                            onClick={onClose} 
                            className="p-2 bg-slate-100 rounded-full active:scale-90 transition-all"
                            aria-label="Close"
                            title="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    {description && (
                        <p className="text-xs text-text-secondary font-medium mb-6">
                            {description}
                        </p>
                    )}

                    {type !== 'wallet_topup' ? (
                        <div className="mb-8 p-6 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center text-white shrink-0">
                                <span className="font-bold">KES</span>
                            </div>
                            <div>
                                <p className="text-sm text-green-800">Amount to Pay</p>
                                <p className="text-3xl font-bold text-green-900">{amount?.toLocaleString()}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-8 space-y-2">
                            <label className="input-label mb-2 block tracking-tight font-black text-green-950 uppercase text-[10px]">Top-up Amount</label>
                            <div className="flex items-center gap-3">
                                <div className="h-16 px-5 bg-brand-50 border border-brand-100 rounded-xl flex shrink-0 items-center justify-center font-black text-brand-600">KES</div>
                                <input
                                    value={inputAmount}
                                    onChange={(e) => setInputAmount(e.target.value)}
                                    disabled={isProcessing}
                                    placeholder="Min 10"
                                    className="input flex-1 h-16 text-2xl font-black tracking-tighter"
                                    type="number"
                                />
                            </div>
                        </div>
                    )}

                    {status === 'idle' || status === 'pending' || status === 'error' ? (
                        <div className="space-y-6">
                            <div>
                                <label className="input-label mb-2 block">M-Pesa Number</label>
                                <div className="flex items-center gap-3">
                                    <div className="h-14 w-14 bg-gray-50 border border-gray-100 rounded-xl flex shrink-0 items-center justify-center text-text-muted">
                                        <Phone size={20} />
                                    </div>
                                    <input
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        disabled={isProcessing}
                                        placeholder="07XXXXXXXX or +254..."
                                        className="input flex-1 h-14"
                                        type="tel"
                                    />
                                </div>
                                {status === 'error' && (
                                    <p className="mt-2 text-color-error text-sm flex items-center gap-2">
                                        <AlertCircle size={16} /> {message}
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={handlePayment}
                                disabled={isProcessing || !phone}
                                className="btn btn-primary w-full h-14 text-lg relative overflow-hidden"
                            >
                                {isProcessing ? (
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="animate-spin" />
                                        Processing...
                                    </div>
                                ) : (
                                    'Pay Now'
                                )}
                            </button>
                            
                            <p className="text-center text-xs text-text-muted">
                                Please complete the payment on your phone after clicking &quot;Pay Now&quot;.
                            </p>
                        </div>
                    ) : (
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center py-8 text-center"
                        >
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle size={48} className="text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-green-900 mb-2">Request Sent!</h3>
                            <p className="text-green-800 px-6">{message}</p>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

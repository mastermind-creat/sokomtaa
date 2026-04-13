'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import api from '@/lib/api';
import { ApiResponse } from '@/types';

interface MpesaPaymentSheetProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'reservation' | 'market_fee';
    targetId: number;
    amount: number;
    onSuccess?: () => void;
}
export default function MpesaPaymentSheet({ isOpen, onClose, type, targetId, amount, onSuccess }: MpesaPaymentSheetProps) {
    const [phone, setPhone] = React.useState('2547');
    const [status, setStatus] = React.useState<'idle' | 'pending' | 'success' | 'error'>('idle');
    const [message, setMessage] = React.useState('');
    const [isProcessing, setIsProcessing] = React.useState(false);

    interface MpesaStkResponse {
        CheckoutRequestID: string;
        CustomerMessage: string;
    }

    const handlePayment = async () => {
        if (!phone.match(/^2547[0-9]{8}$/)) {
            setMessage('Namba ya simu si sahihi (Use 2547XXXXXXXX)');
            setStatus('error');
            return;
        }

        setIsProcessing(true);
        setStatus('pending');
        setMessage('Tafadhali kamilisha malipo kwenye simu yako...');

        try {
            await api.post<ApiResponse<MpesaStkResponse>>('/payments/mpesa/stkpush', {
                phone_number: phone,
                type,
                target_id: targetId
            });
            
            setStatus('success');
            setMessage('Ombi la malipo limetumwa! (Payment request sent!)');
            
            setTimeout(() => {
                onSuccess?.();
                onClose();
            }, 3000);
        } catch (err: unknown) {
            setStatus('error');
            let errorMsg = 'Hitilafu imetokea. (An error occurred.)';
            
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
                <>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                    />
                    <motion.div 
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-8 z-[70] shadow-2xl safe-bottom"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-green-950">Lipa na M-Pesa</h2>
                            <button 
                                onClick={onClose} 
                                className="p-2 bg-slate-100 rounded-full active:scale-90 transition-all"
                                aria-label="Funga (Close)"
                                title="Funga (Close)"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-8 p-6 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center text-white shrink-0">
                                <span className="font-bold">KES</span>
                            </div>
                            <div>
                                <p className="text-sm text-green-800">Kiasi cha Kulipa (Amount to Pay)</p>
                                <p className="text-3xl font-bold text-green-900">{amount.toLocaleString()}</p>
                            </div>
                        </div>

                        {status === 'idle' || status === 'pending' || status === 'error' ? (
                            <div className="space-y-6">
                                <div>
                                    <label className="input-label mb-2 block">Namba ya Simu (M-Pesa Number)</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                                        <input
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            disabled={isProcessing}
                                            placeholder="2547XXXXXXXX"
                                            className="input pl-12 h-14"
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
                                            Inachakata... (Processing...)
                                        </div>
                                    ) : (
                                        'Lipa Sasa / Pay Now'
                                    )}
                                </button>
                                
                                <p className="text-center text-xs text-text-muted">
                                    Tafadhali kamilisha malipo kwenye simu yako baada ya kugusa &quot;Lipa Sasa&quot;.
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
                                <h3 className="text-xl font-bold text-green-900 mb-2">Ombi Limetumwa!</h3>
                                <p className="text-green-800 px-6">{message}</p>
                            </motion.div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

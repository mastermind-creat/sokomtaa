'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Info } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const complaintSchema = z.object({
    category: z.enum(['trader_conduct', 'product_quality', 'payment_dispute', 'cleanliness', 'security', 'other']),
    subject: z.string().min(5, 'Mada ni fupi mno (Subject too short)'),
    description: z.string().min(10, 'Maelezo yanahitajika (Description required)'),
    trader_id: z.number().optional(),
    reservation_id: z.number().optional(),
    market_id: z.number().optional(),
});

type ComplaintFormValues = z.infer<typeof complaintSchema>;

interface ComplaintSheetProps {
    isOpen: boolean;
    onClose: () => void;
    traderId?: number;
    reservationId?: number;
    marketId?: number;
}

export default function ComplaintSheet({ isOpen, onClose, traderId, reservationId, marketId = 1 }: ComplaintSheetProps) {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<ComplaintFormValues>({
        resolver: zodResolver(complaintSchema),
        defaultValues: { 
            trader_id: traderId, 
            reservation_id: reservationId, 
            market_id: marketId 
        }
    });

    const mutation = useMutation({
        mutationFn: (data: ComplaintFormValues) => api.post('/complaints', data),
        onSuccess: () => {
            onClose();
            reset();
            alert('Lalamishi lako limetumwa. Tutaifanyia kazi hivi karibuni. (Complaint submitted successfully.)');
        },
    });

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    key="complaint-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                />
            )}
            {isOpen && (
                <motion.div 
                    key="complaint-sheet"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed bottom-0 left-0 right-0 bg-surface-base rounded-t-[40px] z-[101] p-6 pb-12 shadow-2xl border-t border-border-default max-h-[90vh] overflow-y-auto"
                >
                    <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mb-6" />
                    
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-green-950 tracking-tight">Ripoti Tatizo</h2>
                            <p className="text-xs text-text-secondary font-bold uppercase tracking-widest mt-1">File a Marketplace Complaint</p>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-3 bg-neutral-50 rounded-2xl border border-border-default text-text-secondary active:scale-95 transition-all"
                            aria-label="Funga (Close)"
                            title="Funga (Close)"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit((data: ComplaintFormValues) => mutation.mutate(data))} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-green-900 ml-1 italic">Kundi la Tatizo (Category)</label>
                            <select 
                                {...register('category')}
                                className="input !rounded-2xl h-14 font-bold border-neutral-200 focus:border-brand-500"
                            >
                                <option value="product_quality">Ubora wa Bidhaa (Product Quality)</option>
                                <option value="trader_conduct">Tabia ya Mfanyabiashara (Trader Conduct)</option>
                                <option value="payment_dispute">Tatizo la Malipo (Payment Dispute)</option>
                                <option value="cleanliness">Usafi (Cleanliness)</option>
                                <option value="security">Usalama (Security)</option>
                                <option value="other">Nyingine (Other)</option>
                            </select>
                            {errors.category && <p className="text-xs text-color-error font-black mt-1 ml-1 uppercase">{errors.category.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black text-green-900 ml-1 italic">Mada (Subject)</label>
                            <input 
                                {...register('subject')}
                                placeholder="Mfano: Bidhaa imeharibika..."
                                className="input !rounded-2xl h-14 font-bold border-neutral-200"
                            />
                            {errors.subject && <p className="text-xs text-color-error font-black mt-1 ml-1 uppercase">{errors.subject.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black text-green-900 ml-1 italic">Maelezo Kamili (Description)</label>
                            <textarea 
                                {...register('description')}
                                rows={4}
                                placeholder="Eleza kwa kina kilichotokea..."
                                className="input !rounded-3xl p-4 font-bold border-neutral-200 resize-none"
                            />
                            {errors.description && <p className="text-xs text-color-error font-black mt-1 ml-1 uppercase">{errors.description.message}</p>}
                        </div>

                        <div className="p-4 bg-brand-50 rounded-3xl border border-brand-100 flex gap-3 items-start">
                            <Info className="text-brand-600 shrink-0 mt-0.5" size={18} />
                            <p className="text-[11px] text-brand-800 font-bold leading-relaxed">
                                Lalamishi lako litatumwa kwa wasimamizi wa soko la kaunti. Tutahakikisha linafanyiwa kazi kwa haki na haraka.
                                <span className="block mt-1 opacity-60 italic">(Your complaint will be sent to county administrators for resolution.)</span>
                            </p>
                        </div>

                        <button 
                            type="submit" 
                            disabled={mutation.isPending}
                            className="btn-primary w-full h-[64px] !rounded-full shadow-brand-lg hover:shadow-brand-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            {mutation.isPending ? (
                                <div className="h-6 w-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Send size={20} />
                                    <span className="font-black text-lg">Tuma Lalamishi (Submit)</span>
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Reservation } from '@/types';
import { cn } from '@/lib/utils';

interface ReviewSheetProps {
    reservation?: Reservation;
    trader?: any;
    product?: any;
    onClose: () => void;
}

export default function ReviewSheet({ reservation, trader, product, onClose }: ReviewSheetProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hoveredRating, setHoveredRating] = useState(0);
    const queryClient = useQueryClient();

    const targetTrader = reservation?.trader || trader;
    const targetProduct = reservation?.product || product;

    const mutation = useMutation({
        mutationFn: (data: any) => api.post('/resident/reviews', data),
        onSuccess: () => {
            if (reservation) {
                queryClient.invalidateQueries({ queryKey: ['reservation', reservation.id.toString()] });
            }
            if (targetTrader) {
                queryClient.invalidateQueries({ queryKey: ['trader-reviews', targetTrader.id.toString()] });
            }
            setTimeout(onClose, 2000);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0 || !targetTrader) return;
        mutation.mutate({
            trader_id: targetTrader.id,
            reservation_id: reservation?.id,
            rating,
            comment
        });
    };

    if (mutation.isSuccess) {
        return (
            <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:p-6">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="absolute inset-0 bg-green-950/40 backdrop-blur-md" 
                />
                <motion.div 
                    initial={{ y: '100%' }} 
                    animate={{ y: 0 }} 
                    className="relative w-full max-w-lg bg-white rounded-t-[3rem] p-12 text-center space-y-6 shadow-2xl"
                >
                    <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto text-brand-600">
                        <CheckCircle2 size={40} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-green-950">Review Submitted!</h2>
                        <p className="text-sm text-text-muted font-medium">Thank you for helping the Soko Mtaa community.</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:p-6">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-green-950/60 backdrop-blur-sm" 
            />
            <motion.div 
                initial={{ y: '100%' }} 
                animate={{ y: 0 }} 
                exit={{ y: '100%' }}
                className="relative w-full max-w-lg bg-white rounded-t-[3rem] sm:rounded-[3rem] p-8 space-y-8 shadow-2xl overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-6">
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center text-text-muted hover:text-green-950 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-2">
                    <span className="text-[10px] font-black text-brand-600 uppercase tracking-[0.3em]">Customer Feedback</span>
                    <h2 className="text-3xl font-black text-green-950 tracking-tight">Rate your experience</h2>
                    <p className="text-sm text-text-muted font-medium">
                        {reservation ? (
                            <>How was your order of <span className="text-green-950 font-bold">{reservation.product?.name}</span> from <span className="text-green-950 font-bold">{targetTrader?.business_name}</span>{reservation.delivery_option ? ' and the shipping experience' : ''}?</>
                        ) : targetProduct ? (
                            <>How was your experience with <span className="text-green-950 font-bold">{targetProduct.name}</span> from <span className="text-green-950 font-bold">{targetTrader?.business_name}</span>?</>
                        ) : (
                            <>How was your overall experience with <span className="text-green-950 font-bold">{targetTrader?.business_name}</span>?</>
                        )}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Star Rating */}
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                onClick={() => setRating(star)}
                                className="relative transition-transform active:scale-90"
                            >
                                <Star 
                                    size={44} 
                                    className={cn(
                                        "transition-all duration-300",
                                        (hoveredRating || rating) >= star 
                                            ? "fill-amber-400 text-amber-400 scale-110" 
                                            : "text-neutral-200 fill-neutral-50"
                                    )} 
                                />
                                {rating === star && (
                                    <motion.div 
                                        layoutId="star-glow"
                                        className="absolute inset-0 bg-amber-400/20 blur-xl rounded-full"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Feedback Textarea */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Share more details (Optional)</label>
                        <textarea 
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full min-h-[120px] bg-neutral-50 rounded-3xl p-5 text-sm font-bold border-2 border-transparent focus:border-brand-500 focus:bg-white outline-none transition-all resize-none placeholder:text-text-muted/50"
                            placeholder="Tell us about the product quality, trader service, etc..."
                        />
                    </div>

                    {/* Submit Button */}
                    <button 
                        type="submit"
                        disabled={rating === 0 || mutation.isPending}
                        className="w-full h-16 bg-brand-600 text-white rounded-2xl flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest shadow-lg shadow-brand-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                    >
                        {mutation.isPending ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <Send size={18} />
                        )}
                        {mutation.isPending ? 'Sending...' : 'Submit Review'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}

'use client';

import React from 'react';
import { Star, User, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReviewCardProps {
    review: {
        id: number;
        resident_id: number;
        rating: number;
        comment: string;
        created_at: string;
        resident?: {
            name: string;
            avatar_url?: string;
        };
    };
}

export default function ReviewCard({ review }: ReviewCardProps) {
    const formattedDate = new Date(review.created_at).toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    return (
        <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-brand-sm space-y-4"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center text-text-muted overflow-hidden border-2 border-white shadow-sm">
                        {review.resident?.avatar_url ? (
                            <img src={review.resident.avatar_url} alt={review.resident.name} className="w-full h-full object-cover" />
                        ) : (
                            <User size={24} />
                        )}
                    </div>
                    <div>
                        <h4 className="font-black text-green-950 text-sm leading-tight">{review.resident?.name || 'Mteja wa Soko'}</h4>
                        <p className="text-[10px] font-bold text-text-muted flex items-center gap-1 uppercase tracking-wider">
                            <Calendar size={10} className="text-amber-500" />
                            {formattedDate}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1 bg-brand-50 px-3 py-1.5 rounded-full border border-brand-100">
                    <Star size={12} className="fill-brand-500 text-brand-500" />
                    <span className="text-xs font-black text-brand-700">{review.rating}</span>
                </div>
            </div>

            <div className="relative">
                {/* Visual marker for premium feel */}
                <div className="absolute -left-1 top-0 bottom-0 w-1 bg-brand-200/50 rounded-full" />
                <p className="pl-4 text-sm text-text-secondary leading-relaxed font-medium">
                    &quot;{review.comment}&quot;
                </p>
            </div>

            {/* Verification badge if applicable */}
            <div className="flex items-center gap-1.5 pt-2">
                <div className="w-4 h-4 bg-emerald-100 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                </div>
                <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Verified Purchase</span>
            </div>
        </motion.div>
    );
}

'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Star, ShoppingBag, Flag, MessageCircle } from 'lucide-react';
import api from '@/lib/api';
import { ApiResponse } from '@/types';

import { useUIStore } from '@/store/uiStore';
import { useTranslation } from '@/hooks/useTranslation';

interface ReviewItem {
    id: number;
    rating: number;
    comment: string | null;
    created_at: string;
    resident: { id: number; name: string; avatar_url: string | null };
    reservation?: { reservation_code: string; product: { name: string; quantity: number; unit: string } };
}

interface ReviewSummary {
    average_rating: number;
    total_reviews: number;
    breakdown: Record<'1' | '2' | '3' | '4' | '5', number>;
}

function StarRow({ rating, count, total }: { rating: number; count: number; total: number }) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-text-secondary w-4 text-right">{rating}</span>
            <Star className="w-3 h-3 fill-accent text-accent shrink-0" />
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-semibold text-text-muted w-8">{pct}%</span>
        </div>
    );
}

function ReviewCard({ review }: { review: ReviewItem }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
        >
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary font-black">{review.resident.name.charAt(0)}</span>
                    </div>
                    <div>
                        <p className="font-bold text-sm text-text-primary">{review.resident.name}</p>
                        <p className="text-xs text-text-muted">
                            {new Date(review.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-accent text-accent' : 'text-gray-200'}`} />
                    ))}
                </div>
            </div>

            {review.comment && (
                <p className="text-sm text-text-primary leading-relaxed mb-3">&quot;{review.comment}&quot;</p>
            )}

            {review.reservation && (
                <div className="flex items-center gap-2 text-xs text-text-muted">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{review.reservation.product.name} × {review.reservation.product.quantity} {review.reservation.product.unit}</span>
                    <span className="font-mono">· {review.reservation.reservation_code}</span>
                </div>
            )}

            <button className="flex items-center gap-1 text-xs text-text-muted hover:text-red-500 transition-colors mt-3">
                <Flag className="w-3 h-3" /> Report
            </button>
        </motion.div>
    );
}

export default function TraderReviewsPage() {
    const { t } = useTranslation();
    const { setPageTitle } = useUIStore();

    React.useEffect(() => {
        setPageTitle(t('trader.reviews') || 'Reviews');
    }, [setPageTitle, t]);

    const { data: summary, isLoading: summaryLoading } = useQuery({
        queryKey: ['trader-review-summary'],
        queryFn: async () => {
            const res = await api.get<never, ApiResponse<ReviewSummary>>('/trader/reviews/summary');
            return res.data;
        },
    });

    const { data: reviewsData, isLoading } = useQuery({
        queryKey: ['trader-reviews'],
        queryFn: async () => {
            const res = await api.get<never, ApiResponse<{ data: ReviewItem[] }>>('/trader/reviews');
            return res.data;
        },
    });

    const reviews: ReviewItem[] = Array.isArray(reviewsData) ? reviewsData : (reviewsData as any)?.data ?? [];

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
            <h1 className="text-2xl font-black text-text-primary tracking-tight">Reviews Received</h1>
            {/* ... rest of content ... */}
        </div>
    );
}

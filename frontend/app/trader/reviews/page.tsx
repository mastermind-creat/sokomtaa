'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Star, ShoppingBag, Flag } from 'lucide-react';
import api from '@/lib/api';
import { ApiResponse } from '@/types';

import { useUIStore } from '@/store/uiStore';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

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

    const reviews: ReviewItem[] = Array.isArray(reviewsData) 
        ? (reviewsData as ReviewItem[]) 
        : ((reviewsData as { data?: ReviewItem[] })?.data ?? []);

    const avgRating = Number(summary?.average_rating ?? 0);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 pb-32 space-y-10">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black text-green-950 tracking-tight">Reviews</h1>
                <p className="text-text-secondary font-medium">What your customers are saying about your stall.</p>
            </div>

            {summaryLoading ? (
                <div className="h-64 bg-white rounded-[2.5rem] animate-pulse border border-gray-100" />
            ) : summary ? (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 p-8 md:p-10"
                >
                    <div className="grid md:grid-cols-2 gap-10 items-center">
                        <div className="flex flex-col items-center md:items-start text-center md:text-left border-b md:border-b-0 md:border-r border-gray-100 pb-10 md:pb-0 md:pr-10">
                            <div className="text-7xl font-black text-green-950 tracking-tighter mb-2">
                                {avgRating.toFixed(1)}
                            </div>
                            <div className="flex items-center gap-1 mb-4">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star 
                                        key={i} 
                                        className={cn(
                                            "w-6 h-6",
                                            i < Math.round(avgRating) ? 'fill-accent text-accent' : 'text-gray-200'
                                        )} 
                                    />
                                ))}
                            </div>
                            <p className="text-sm font-black text-text-muted uppercase tracking-[0.2em]">
                                Based on {summary.total_reviews} verified reviews
                            </p>
                        </div>

                        <div className="space-y-3 flex-1">
                            {([5,4,3,2,1] as const).map(r => (
                                <StarRow 
                                    key={r} 
                                    rating={r} 
                                    count={summary.breakdown[String(r) as '1'|'2'|'3'|'4'|'5'] ?? 0} 
                                    total={summary.total_reviews} 
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>
            ) : null}

            <div className="space-y-6">
                <div className="flex items-center gap-2 pl-2">
                    <div className="w-1.5 h-6 bg-brand-600 rounded-full" />
                    <h2 className="text-xl font-black text-green-950 uppercase tracking-tight">Recent Feedback</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {isLoading ? (
                        [1,2,3,4].map(i => <div key={i} className="h-48 bg-white border border-gray-100 rounded-[2rem] animate-pulse" />)
                    ) : reviews.length === 0 ? (
                        <div className="col-span-full bg-white rounded-[2.5rem] border border-gray-100 border-dashed py-24 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-neutral-50 rounded-[2rem] flex items-center justify-center text-neutral-200 mb-6">
                                <Star size={40} />
                            </div>
                            <h3 className="text-xl font-black text-green-950 uppercase tracking-tight">No reviews yet</h3>
                            <p className="text-text-muted font-medium mt-2 max-w-xs">Reviews from customers will appear here after they pick up their orders.</p>
                        </div>
                    ) : (
                        reviews.map(review => <ReviewCard key={review.id} review={review} />)
                    )}
                </div>
            </div>
        </div>
    );
}

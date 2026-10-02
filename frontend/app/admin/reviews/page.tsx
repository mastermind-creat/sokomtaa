'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Star, 
    Search, 
    Filter, 
    Eye, 
    EyeOff, 
    Trash2, 
    ShieldAlert,
    TrendingUp,
    Quote,
    ChevronRight,
    Flag,
    Award
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { ApiResponse } from '@/types';

interface AdminReview {
    id: number;
    resident: string;
    trader: string;
    rating: number;
    comment: string;
    is_visible: boolean;
    created_at: string;
    verified: boolean;
}

export default function AdminReviewsPage() {
    const { setPageTitle } = useUIStore();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');

    React.useEffect(() => {
        setPageTitle('Reputation Hub');
    }, [setPageTitle]);

    // Fetch Reviews
    const { data: reviewsDataRaw, isLoading: isLoadingReviews } = useQuery<ApiResponse<AdminReview[]>>({
        queryKey: ['admin-reviews'],
        queryFn: async () => {
            const res = await api.get('/admin/reviews');
            return res.data;
        },
    });

    // Fetch Stats
    const { data: statsDataRaw, isLoading: isLoadingStats } = useQuery({
        queryKey: ['admin-reviews-stats'],
        queryFn: async () => {
            const res = await api.get('/admin/reviews/stats');
            return res.data;
        },
    });

    const reviews = reviewsDataRaw?.data || [];
    const statsData = statsDataRaw?.data || { avg_rating: 0, flagged: 0, total: 0 };

    const stats = [
        { label: 'Avg Rating', value: `${statsData.avg_rating} ★`, color: 'text-brand-600', icon: Star },
        { label: 'Flagged / Hidden', value: statsData.flagged.toString(), color: 'text-rose-600', icon: ShieldAlert },
        { label: 'Total Reviews', value: statsData.total.toString(), color: 'text-blue-600', icon: TrendingUp },
    ];

    const toggleVisibilityMutation = useMutation({
        mutationFn: (id: number) => api.post(`/admin/reviews/${id}/toggle-visibility`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
            queryClient.invalidateQueries({ queryKey: ['admin-reviews-stats'] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/admin/reviews/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
            queryClient.invalidateQueries({ queryKey: ['admin-reviews-stats'] });
        }
    });

    const RatingStars = ({ count }: { count: number }) => (
        <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
                <Star key={i} className={cn(
                    "w-3 h-3 transition-all",
                    i < count ? 'text-brand-500 fill-brand-500' : 'text-gray-200'
                )} />
            ))}
        </div>
    );

    const getSentimentStyles = (rating: number) => {
        if (rating >= 4) return 'shadow-[0_0_20px_rgba(27,107,58,0.1)] border-brand-100 bg-brand-50/10';
        if (rating <= 2) return 'shadow-[0_0_20px_rgba(220,38,38,0.05)] border-rose-100 bg-rose-50/10';
        return 'border-gray-100 bg-white';
    };

    const filteredReviews = reviews.filter((r) => 
        r.resident.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (r.comment && r.comment.toLowerCase().includes(searchQuery.toLowerCase())) ||
        r.trader.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="pb-32 -mx-4 md:-mx-0 font-sans">
            {/* ── Reputation Matrix (3-col Mobile) ── */}
            <div className="grid grid-cols-3 gap-2 px-4 mb-6">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                        <span className={cn("text-[8px] font-black uppercase tracking-widest mb-1", s.color)}>{s.label}</span>
                        <div className="text-sm font-black text-green-950 tracking-tight">
                            {isLoadingStats ? '...' : s.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Reputation Search ── */}
            <div className="px-4 mb-8">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-600" size={18} />
                    <input 
                        type="text"
                        placeholder="Search feedback or reviewer..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-50"
                    />
                </div>
            </div>

            {/* ── Reputation Triage Cards ── */}
            <div className="space-y-4 px-4">
                {isLoadingReviews ? (
                    [1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-100 rounded-[2.5rem] animate-pulse" />)
                ) : filteredReviews.length === 0 ? (
                    <div className="py-16 text-center">
                        <ShieldAlert size={48} className="mx-auto text-gray-200 mb-4" />
                        <h3 className="text-sm font-black text-text-primary uppercase tracking-widest">No Reviews Found</h3>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {filteredReviews.map((review) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                key={review.id}
                                className={cn(
                                    "rounded-[2.5rem] border overflow-hidden transition-all",
                                    getSentimentStyles(review.rating),
                                    !review.is_visible && 'opacity-60 grayscale bg-gray-50'
                                )}
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-5">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="w-12 h-12 bg-gray-950 text-white rounded-2xl flex items-center justify-center font-black uppercase">
                                                    {review.resident.charAt(0)}
                                                </div>
                                                {review.verified && (
                                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand-600 border-2 border-white rounded-full flex items-center justify-center">
                                                        <Award size={10} className="text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-green-950 uppercase tracking-tight leading-none mb-1">
                                                    {review.resident}
                                                </h4>
                                                <p className="text-[10px] font-black uppercase text-text-muted tracking-widest truncate max-w-[140px]">
                                                    on {review.trader}
                                                </p>
                                            </div>
                                        </div>
                                        <RatingStars count={review.rating} />
                                    </div>

                                    {/* Quote Block */}
                                    <div className="relative mb-6">
                                        <Quote size={20} className="absolute -top-2 -left-2 text-brand-100/50 -z-0" />
                                        <p className="relative z-10 text-[11px] font-bold text-green-900 leading-relaxed italic pl-2">
                                            {review.comment ? `"${review.comment}"` : "No written feedback provided."}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => toggleVisibilityMutation.mutate(review.id)}
                                            disabled={toggleVisibilityMutation.isPending}
                                            className={cn(
                                                "flex-1 h-11 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-sm",
                                                review.is_visible ? 'bg-white border border-gray-100 text-text-secondary' : 'bg-brand-600 text-white',
                                                toggleVisibilityMutation.isPending && 'opacity-50 pointer-events-none'
                                            )}
                                        >
                                            {review.is_visible ? <EyeOff size={14} /> : <Eye size={14} />}
                                            {review.is_visible ? 'Hide from Public' : 'Restore Visibility'}
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if (confirm('Are you sure you want to permanently delete this review?')) {
                                                    deleteMutation.mutate(review.id);
                                                }
                                            }}
                                            disabled={deleteMutation.isPending}
                                            className="h-11 w-11 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 flex items-center justify-center active:scale-95 transition-all disabled:opacity-50"
                                            title="Delete Review"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-gray-50/50 px-6 py-3 flex justify-between items-center border-t border-gray-100">
                                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">
                                        {review.verified ? 'Verified Buyer' : 'Unverified'} • {new Date(review.created_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}

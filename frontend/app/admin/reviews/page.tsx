'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Star, 
    Search, 
    Filter, 
    Eye, 
    EyeOff, 
    Trash2, 
    User, 
    MessageCircle,
    CheckCircle2,
    ShieldAlert,
    TrendingUp,
    Quote,
    MoreHorizontal,
    ChevronRight,
    Flag,
    Award
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

export default function AdminReviewsPage() {
    const { setPageTitle } = useUIStore();
    const [searchQuery, setSearchQuery] = useState('');

    React.useEffect(() => {
        setPageTitle('Reputation Hub');
    }, [setPageTitle]);

    const { data: reviewsDataRaw, isLoading } = useQuery({
        queryKey: ['admin-reviews'],
        queryFn: () => api.get('/admin/reviews').catch(() => ({ data: [] })),
    });

    const reviews = (reviewsDataRaw as any)?.data || [
        { id: 1, resident: 'John Doe', trader: "Mama Wanjiru's Mboga", rating: 5, comment: "Fresh tomatoes and fast delivery! Highly recommend.", created_at: '2025-01-20T10:00:00Z', is_visible: true, verified: true },
        { id: 2, resident: 'Jane Smith', trader: "Tech Safi", rating: 2, comment: "The charger I bought didn't work. Very slow response.", created_at: '2025-01-21T15:30:00Z', is_visible: false, verified: true },
        { id: 3, resident: 'Samuel Kamau', trader: "Ochieng Fish", rating: 4, comment: "Great fish, but the stall was a bit hard to find in Block C.", created_at: '2025-01-22T08:45:00Z', is_visible: true, verified: false },
    ];

    const stats = [
        { label: 'Avg Rating', value: '4.7 ★', color: 'text-brand-600', icon: Star },
        { label: 'Flagged', value: '12', color: 'text-rose-600', icon: ShieldAlert },
        { label: 'Growth', value: '+14%', color: 'text-blue-600', icon: TrendingUp },
    ];

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

    return (
        <div className="pb-32 -mx-4 md:-mx-0 font-sans">
            {/* ── Reputation Matrix (3-col Mobile) ── */}
            <div className="grid grid-cols-3 gap-2 px-4 mb-6">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                        <span className={cn("text-[8px] font-black uppercase tracking-widest mb-1", s.color)}>{s.label}</span>
                        <div className="text-sm font-black text-green-950 tracking-tight">
                            {isLoading ? '...' : s.value}
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
                {isLoading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-100 rounded-[2.5rem] animate-pulse" />)
                ) : (
                    <AnimatePresence mode="wait">
                        {reviews.filter((r: any) => 
                            r.resident.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            r.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            r.trader.toLowerCase().includes(searchQuery.toLowerCase())
                        ).map((review: any) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
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
                                                <div className="w-12 h-12 bg-gray-950 text-white rounded-2xl flex items-center justify-center font-black">
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
                                        <p className="relative z-10 text-[11px] font-bold text-green-900 leading-relaxed italic z-10 pl-2">
                                            "{review.comment}"
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button className={cn(
                                            "flex-1 h-11 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-sm",
                                            review.is_visible ? 'bg-white border border-gray-100 text-text-secondary' : 'bg-brand-600 text-white'
                                        )}>
                                            {review.is_visible ? <EyeOff size={14} /> : <Eye size={14} />}
                                            {review.is_visible ? 'Moderate' : 'Approve'}
                                        </button>
                                        <button className="h-11 w-11 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 flex items-center justify-center active:scale-95 transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                        <button className="h-11 w-11 bg-gray-50 text-text-muted rounded-2xl border border-gray-100 flex items-center justify-center active:scale-95 transition-all">
                                            <Flag size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-gray-50/50 px-6 py-3 flex justify-between items-center border-t border-gray-100">
                                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">
                                        Verified Buyer • {new Date(review.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </span>
                                    <div className="flex items-center gap-1 text-brand-600">
                                        <span className="text-[9px] font-black uppercase tracking-widest">View Context</span>
                                        <ChevronRight size={14} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* ── Global Moderation Actions ── */}
            <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-3">
                <button className="w-14 h-14 bg-gray-950 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all border-4 border-white">
                    <Filter size={24} />
                </button>
            </div>
        </div>
    );
}

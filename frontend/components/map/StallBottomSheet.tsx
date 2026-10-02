'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MapPin, ArrowUpRight, X, Store } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { StallFeature } from '@/lib/mapUtils';

interface StallBottomSheetProps {
    stall: StallFeature | null;
    isOffline: boolean;
    onClose: () => void;
}

export default function StallBottomSheet({
    stall,
    isOffline,
    onClose,
}: StallBottomSheetProps) {
    const router = useRouter();

    return (
        <AnimatePresence>
            {stall && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm"
                        aria-hidden="true"
                    />

                    {/* Sheet */}
                    <motion.div
                        key="sheet"
                        role="dialog"
                        aria-modal="true"
                        aria-label={stall.trader?.business_name ?? 'Stall details'}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] z-[101] p-8 pb-10 shadow-2xl"
                    >
                        {/* Drag handle */}
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" aria-hidden="true" />

                        <div className="flex items-start justify-between mb-6">
                            <div className="flex-1 min-w-0">
                                {/* Badges */}
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <span
                                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${stall.status === 'occupied'
                                                ? 'bg-brand-50 text-brand-700'
                                                : 'bg-blue-50 text-blue-700'
                                            }`}
                                    >
                                        {stall.status}
                                    </span>
                                    {stall.trader?.is_open && (
                                        <span className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
                                            Open Now
                                        </span>
                                    )}
                                    {isOffline && (
                                        <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            Cached
                                        </span>
                                    )}
                                </div>

                                {/* Business name */}
                                <h3 className="text-2xl font-black text-green-950 tracking-tight truncate">
                                    {stall.trader?.business_name ?? 'Vacant Stall'}
                                </h3>

                                {/* Category */}
                                {stall.trader?.primary_category && (
                                    <p className="text-text-secondary font-medium tracking-tight mt-1">
                                        {stall.trader.primary_category}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-3 ml-3 shrink-0">
                                <div className="w-14 h-14 bg-neutral-100 rounded-2xl flex items-center justify-center text-brand-600">
                                    <Store size={28} aria-hidden="true" />
                                </div>
                                <button
                                    onClick={onClose}
                                    aria-label="Close stall details"
                                    className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center text-text-muted hover:text-red-500 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {stall.status === 'occupied' && stall.trader ? (
                            <>
                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-neutral-50 p-4 rounded-2xl border border-gray-100">
                                        <div className="flex items-center gap-1.5 text-amber-500 mb-1">
                                            <Star size={14} fill="currentColor" aria-hidden="true" />
                                            <span className="text-xs font-black">
                                                {stall.trader.average_rating?.toFixed(1) ?? 'N/A'}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                            Rating
                                        </p>
                                    </div>
                                    <div className="bg-neutral-50 p-4 rounded-2xl border border-gray-100">
                                        <div className="flex items-center gap-1.5 text-brand-600 mb-1">
                                            <MapPin size={14} aria-hidden="true" />
                                            <span className="text-xs font-black">
                                                {stall.lat.toFixed(4)}, {stall.lon.toFixed(4)}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                            Location
                                        </p>
                                    </div>
                                </div>

                                {/* CTA */}
                                <div className="relative group">
                                    <button
                                        onClick={() => {
                                            if (!isOffline && stall.trader) {
                                                router.push(`/trader/${stall.trader.id}`);
                                            }
                                        }}
                                        disabled={isOffline}
                                        aria-label={
                                            isOffline
                                                ? 'View Profile unavailable while offline'
                                                : `View profile of ${stall.trader.business_name}`
                                        }
                                        className={`w-full h-14 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest transition-all ${isOffline
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-brand-600 text-white shadow-lg shadow-brand-200 active:scale-95'
                                            }`}
                                    >
                                        View Profile <ArrowUpRight size={16} aria-hidden="true" />
                                    </button>
                                    {isOffline && (
                                        <p className="mt-2 text-center text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                                            Available when online
                                        </p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="p-8 bg-blue-50 rounded-3xl border border-blue-100 text-center">
                                <p className="font-black text-blue-900 mb-1">Stall Available</p>
                                <p className="text-sm text-blue-700/70 font-medium">
                                    This stall is currently vacant.
                                </p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

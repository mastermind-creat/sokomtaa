'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    X, Store, User, MapPin, ArrowRight, Star,
    ChevronDown, ShoppingBag, Navigation2
} from 'lucide-react';
import { Market, Trader } from '@/types';

interface NearbyMarket extends Market {
    distance_km?: number;
}

interface NearbyTrader extends Trader {
    distance_km?: number;
}

interface NearbyDiscoveryPanelProps {
    markets: NearbyMarket[];
    traders: NearbyTrader[];
    radiusKm: number;
    isOpen: boolean;
    onClose: () => void;
}

function formatDistance(km?: number): string {
    if (!km && km !== 0) return '—';
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
}

function DistanceBadge({ km }: { km?: number }) {
    const color = !km ? 'bg-gray-100 text-gray-500'
        : km < 5  ? 'bg-green-100 text-green-700'
        : km < 20 ? 'bg-amber-100 text-amber-700'
        : 'bg-blue-100 text-blue-700';

    return (
        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 ${color}`}>
            <Navigation2 size={9} />
            {formatDistance(km)}
        </span>
    );
}

export default function NearbyDiscoveryPanel({
    markets, traders, radiusKm, isOpen, onClose
}: NearbyDiscoveryPanelProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'markets' | 'traders'>('markets');
    const [showAll, setShowAll] = useState(false);

    const displayedMarkets = showAll ? markets : markets.slice(0, 6);
    const displayedTraders = showAll ? traders : traders.slice(0, 6);
    const total = markets.length + traders.length;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop — mobile only */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 z-[200] lg:hidden"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                        className={[
                            'fixed z-[201] bg-white shadow-2xl',
                            // Mobile: bottom sheet
                            'bottom-0 left-0 right-0 rounded-t-[2.5rem] max-h-[80vh]',
                            // Desktop: right sidebar
                            'lg:top-0 lg:right-0 lg:bottom-0 lg:left-auto lg:w-[400px] lg:rounded-none lg:rounded-l-[2.5rem] lg:max-h-full',
                        ].join(' ')}
                    >
                        {/* Handle — mobile */}
                        <div className="w-10 h-1.5 bg-gray-200 rounded-full mx-auto mt-4 lg:hidden" />

                        {/* Header */}
                        <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-black text-green-950 tracking-tight">
                                    Karibu Nawe · Nearby
                                </h2>
                                <p className="text-xs font-bold text-text-secondary mt-0.5">
                                    {total} result{total !== 1 ? 's' : ''} within {radiusKm} km of you
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all active:scale-90"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Tab Switcher */}
                        <div className="px-6 pt-4 flex gap-2">
                            {(['markets', 'traders'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab); setShowAll(false); }}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                        activeTab === tab
                                            ? 'bg-green-950 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                                >
                                    {tab === 'markets' ? `Masoko (${markets.length})` : `Wafanyabiashara (${traders.length})`}
                                </button>
                            ))}
                        </div>

                        {/* List */}
                        <div className="overflow-y-auto flex-1 px-6 pt-4 pb-10 space-y-3"
                            style={{ maxHeight: 'calc(80vh - 180px)' }}>

                            {/* ── Markets Tab ── */}
                            {activeTab === 'markets' && (
                                <>
                                    {displayedMarkets.length === 0 ? (
                                        <EmptyState
                                            icon={<Store size={40} />}
                                            title="Hakuna masoko karibu"
                                            subtitle={`No markets found within ${radiusKm} km of your location.`}
                                        />
                                    ) : (
                                        displayedMarkets.map(market => (
                                            <button
                                                key={market.id}
                                                onClick={() => router.push(`/resident/markets/${market.id}`)}
                                                className="w-full bg-white border border-gray-100 hover:border-brand-200 hover:bg-brand-50/30 rounded-2xl p-4 flex items-center gap-4 text-left transition-all active:scale-[0.98] shadow-sm"
                                            >
                                                {/* Icon */}
                                                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 shrink-0 border border-brand-100">
                                                    {market.icon_url
                                                        ? <img src={market.icon_url} className="w-full h-full object-cover rounded-xl" alt="" />
                                                        : <Store size={22} />
                                                    }
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-black text-green-950 truncate leading-tight">
                                                        {market.name}
                                                    </p>
                                                    <div className="flex items-center gap-1 mt-1 text-text-secondary">
                                                        <MapPin size={10} />
                                                        <span className="text-[10px] font-bold truncate">{market.location}</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-brand-600 mt-0.5 block">
                                                        {market.active_stalls_count ?? 0} active traders
                                                    </span>
                                                </div>

                                                {/* Distance */}
                                                <div className="flex flex-col items-end gap-2 shrink-0">
                                                    <DistanceBadge km={market.distance_km} />
                                                    <ArrowRight size={14} className="text-gray-300" />
                                                </div>
                                            </button>
                                        ))
                                    )}

                                    {markets.length > 6 && !showAll && (
                                        <LoadMoreButton
                                            remaining={markets.length - 6}
                                            onClick={() => setShowAll(true)}
                                        />
                                    )}
                                </>
                            )}

                            {/* ── Traders Tab ── */}
                            {activeTab === 'traders' && (
                                <>
                                    {displayedTraders.length === 0 ? (
                                        <EmptyState
                                            icon={<User size={40} />}
                                            title="Hakuna wafanyabiashara karibu"
                                            subtitle={`No independent traders found within ${radiusKm} km.`}
                                        />
                                    ) : (
                                        displayedTraders.map(trader => (
                                            <button
                                                key={trader.id}
                                                onClick={() => router.push(`/trader/${trader.id}`)}
                                                className="w-full bg-white border border-gray-100 hover:border-amber-200 hover:bg-amber-50/30 rounded-2xl p-4 flex items-center gap-4 text-left transition-all active:scale-[0.98] shadow-sm"
                                            >
                                                {/* Avatar */}
                                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-amber-50 border border-amber-100 shrink-0 flex items-center justify-center">
                                                    {trader.avatar_url
                                                        ? <img src={trader.avatar_url} className="w-full h-full object-cover" alt="" />
                                                        : <User size={22} className="text-amber-500" />
                                                    }
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${trader.is_currently_open ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">
                                                            {trader.is_currently_open ? 'Open' : 'Closed'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-black text-green-950 truncate leading-tight">
                                                        {trader.business_name}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {trader.average_rating > 0 && (
                                                            <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                                                                <Star size={9} fill="currentColor" />
                                                                {Number(trader.average_rating).toFixed(1)}
                                                            </span>
                                                        )}
                                                        {(trader.products_count ?? 0) > 0 && (
                                                            <span className="text-[10px] font-bold text-text-muted flex items-center gap-0.5">
                                                                <ShoppingBag size={9} />
                                                                {trader.products_count} items
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Distance */}
                                                <div className="flex flex-col items-end gap-2 shrink-0">
                                                    <DistanceBadge km={trader.distance_km} />
                                                    <ArrowRight size={14} className="text-gray-300" />
                                                </div>
                                            </button>
                                        ))
                                    )}

                                    {traders.length > 6 && !showAll && (
                                        <LoadMoreButton
                                            remaining={traders.length - 6}
                                            onClick={() => setShowAll(true)}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
            <div className="text-gray-200">{icon}</div>
            <p className="font-black text-green-950 text-sm">{title}</p>
            <p className="text-xs text-text-secondary font-medium max-w-[220px]">{subtitle}</p>
        </div>
    );
}

function LoadMoreButton({ remaining, onClick }: { remaining: number; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full py-3.5 border-2 border-dashed border-gray-200 rounded-2xl text-xs font-black text-gray-400 hover:border-brand-300 hover:text-brand-600 transition-all flex items-center justify-center gap-2"
        >
            <ChevronDown size={14} />
            Show {remaining} more
        </button>
    );
}

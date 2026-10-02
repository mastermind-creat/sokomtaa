'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Radio } from 'lucide-react';
import { useRiderTracking } from '@/hooks/useRiderTracking';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import OfflineBanner from '@/components/shared/OfflineBanner';

// Lazy-load the heavy map component (avoids SSR issues with MapLibre GL)
const StallMap = dynamic(() => import('@/components/map/StallMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-neutral-100">
            <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
    ),
});

/**
 * Live map page — full-screen MapLibre GL map with:
 * - Debounced viewport stall fetching (useStallMap inside StallMap)
 * - Supercluster clustering at zoom < 15
 * - Rider position streaming (useRiderTracking)
 * - Offline banner (OfflineBanner shared component)
 * - Tracking unavailability banner
 */
export default function LiveMapPage() {
    const user = useAuthStore((s) => s.user);

    // Only track rider when the logged-in user is a resident (not trader/admin)
    const riderId =
        user?.role === 'resident' ? (user?.id?.toString() ?? null) : null;

    const { position: riderPosition, isTrackingUnavailable } =
        useRiderTracking(riderId);

    return (
        <div className="relative w-screen h-screen overflow-hidden">
            {/* Shared offline banner — sits above everything (z-[200] in OfflineBanner) */}
            <OfflineBanner />

            {/* Full-screen live map */}
            <StallMap riderPosition={riderPosition} className="absolute inset-0" />

            {/* Non-blocking banners stacked below the offline banner */}
            <div className="absolute top-4 left-4 right-4 z-20 flex flex-col gap-2 pointer-events-none">
                {/* Tracking unavailable banner — Requirement 11.4, 13.4 */}
                <AnimatePresence>
                    {isTrackingUnavailable && (
                        <TrackingUnavailableBanner />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

/** Non-blocking banner shown when WebSocket reconnect attempts are exhausted. */
function TrackingUnavailableBanner() {
    return (
        <motion.div
            key="tracking-banner"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className="flex items-center gap-3 bg-amber-500/95 text-white px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm"
        >
            <Radio
                size={18}
                aria-hidden="true"
                className="shrink-0 animate-pulse"
            />
            <div>
                <p className="text-sm font-black leading-tight">
                    Live tracking temporarily unavailable
                </p>
                <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-0.5">
                    Attempting to reconnect&hellip;
                </p>
            </div>
        </motion.div>
    );
}

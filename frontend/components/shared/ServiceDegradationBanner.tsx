'use client';

/**
 * ServiceDegradationBanner
 *
 * Non-blocking banner displayed when any upstream service health check
 * returns a non-200 status for more than 30 seconds.
 *
 * Requirements: 13.4
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useServiceHealth } from '@/hooks/useServiceHealth';

export default function ServiceDegradationBanner() {
    const { isDegraded, statuses } = useServiceHealth();

    // Build a short label for which services are affected
    const affected = Object.entries(statuses)
        .filter(([, s]) => s === 'degraded')
        .map(([key]) => key)
        .join(', ');

    return (
        <AnimatePresence>
            {isDegraded && (
                <motion.div
                    key="degradation-banner"
                    role="status"
                    aria-live="polite"
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                    className="w-full bg-orange-500/95 text-white px-4 py-2.5 flex items-center gap-3 backdrop-blur-sm z-[190]"
                >
                    <AlertTriangle
                        size={16}
                        aria-hidden="true"
                        className="shrink-0"
                    />
                    <p className="text-xs font-bold flex-1">
                        Some services are temporarily degraded
                        {affected ? ` (${affected})` : ''}.{' '}
                        <span className="font-normal opacity-80">
                            Some features may be unavailable.
                        </span>
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Navigation } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';

export default function LocationPermissionBanner() {
    const { permissionStatus, requestLocation, isLocating } = useGeolocation();
    const [dismissed, setDismissed] = useState(false);

    // Load dismissed state from localStorage
    useEffect(() => {
        setDismissed(localStorage.getItem('location-banner-dismissed') === 'true');
    }, []);

    const handleDismiss = () => {
        setDismissed(true);
        localStorage.setItem('location-banner-dismissed', 'true');
    };

    const handleAllow = () => {
        requestLocation();
        // Reset dismissed so if they later deny → grant, banner won't show again
        localStorage.setItem('location-banner-dismissed', 'true');
        setDismissed(true);
    };

    // Only show when permission is 'prompt' or 'unknown' and not dismissed
    const shouldShow = !dismissed &&
        (permissionStatus === 'prompt' || permissionStatus === 'unknown');

    return (
        <AnimatePresence>
            {shouldShow && (
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="mx-4 mb-4 bg-gradient-to-r from-[#1B6B3A] to-[#2D9653] rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-green-900/20"
                >
                    {/* Icon */}
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-white" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-black text-sm leading-tight">
                            See what&apos;s near you
                        </p>
                        <p className="text-white/70 text-xs font-medium mt-0.5">
                            Allow location to find stalls within 5 km
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={handleAllow}
                            disabled={isLocating}
                            className="flex items-center gap-1.5 bg-white text-[#1B6B3A] text-xs font-black px-3 py-2 rounded-xl active:scale-95 transition-all disabled:opacity-70"
                        >
                            <Navigation className="w-3.5 h-3.5" />
                            {isLocating ? 'Locating…' : 'Allow'}
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

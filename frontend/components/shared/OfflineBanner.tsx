'use client';

import React from 'react';
import { WifiOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOffline } from '@/hooks/useOffline';

export default function OfflineBanner() {
    const isOffline = useOffline();

    return (
        <AnimatePresence>
            {isOffline && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-[200] p-4 bg-amber-500 text-white shadow-lg text-center"
                >
                    <div className="flex items-center justify-center gap-3">
                        <WifiOff size={20} className="animate-pulse" />
                        <div>
                            <p className="text-sm font-black tracking-tight leading-none uppercase">
                                Upo nje ya mtandao
                            </p>
                            <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">
                                You are offline • Using cached data
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

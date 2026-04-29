'use client';

import React from 'react';
import { useUIStore } from '@/store/uiStore';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalLoader() {
    const isGlobalLoading = useUIStore((state) => state.isGlobalLoading);

    return (
        <AnimatePresence>
            {isGlobalLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/40 backdrop-blur-[2px]"
                >
                    <div className="bg-white p-4 rounded-2xl shadow-xl shadow-brand-900/10 border border-brand-100 flex items-center gap-3">
                        <Loader2 className="animate-spin text-brand-600" size={24} />
                        <span className="text-sm font-bold tracking-tight text-green-950">Processing...</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

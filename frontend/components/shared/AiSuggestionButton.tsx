'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface AiSuggestionButtonProps {
    productName: string;
    category?: string;
    onSuggestion: (suggestion: string) => void;
}

export default function AiSuggestionButton({ productName, category, onSuggestion }: AiSuggestionButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const getSuggestion = async () => {
        if (!productName) {
            toast.error('Please enter a product name first.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await api.get('/ai/suggest-description', {
                params: { name: productName, category }
            });
            if (res.data.suggestion) {
                onSuggestion(res.data.suggestion);
                toast.success('AI Suggestion generated!');
            }
        } catch (err) {
            toast.error('AI Suggestion failed. Try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={getSuggestion}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100 disabled:opacity-50"
        >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            AI Magic
        </motion.button>
    );
}

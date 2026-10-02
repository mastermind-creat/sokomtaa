'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Info, Megaphone } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const noticeSchema = z.object({
    market_id: z.number(),
    title: z.string().min(5, 'Title is too short (Kichwa cha habari ni kifupi mno)'),
    content: z.string().min(10, 'Content is required (Maelezo yanahitajika)'),
    type: z.enum(['general', 'event', 'maintenance', 'promotion', 'urgent']),
    audience: z.enum(['all', 'traders', 'residents']),
    is_pinned: z.boolean(),
});

type NoticeFormValues = z.infer<typeof noticeSchema>;

interface NoticeSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NoticeSheet({ isOpen, onClose }: NoticeSheetProps) {
    const queryClient = useQueryClient();
    const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<NoticeFormValues>({
        resolver: zodResolver(noticeSchema),
        defaultValues: { 
            market_id: 1, 
            type: 'general',
            audience: 'all',
            is_pinned: false
        }
    });

    const mutation = useMutation({
        mutationFn: (data: NoticeFormValues) => api.post('/notices', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-notices'] });
            onClose();
            reset();
            alert('Broadcast dispatched successfully. (Tangazo limetumwa.)');
        },
    });

    const selectedType = watch('type');

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'urgent': return 'text-red-600 bg-red-50 border-red-100';
            case 'maintenance': return 'text-orange-600 bg-orange-50 border-orange-100';
            case 'promotion': return 'text-green-600 bg-green-50 border-green-100';
            case 'event': return 'text-blue-600 bg-blue-50 border-blue-100';
            default: return 'text-gray-600 bg-gray-50 border-gray-100';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    key="notice-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                />
            )}
            {isOpen && (
                <motion.div 
                    key="notice-sheet"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] z-[101] p-6 pb-12 shadow-2xl border-t border-gray-100 max-h-[90vh] overflow-y-auto max-w-2xl mx-auto"
                >
                    <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mb-6" />
                    
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-green-950 tracking-tight uppercase">System Broadcast</h2>
                            <p className="text-[10px] text-text-secondary font-black uppercase tracking-[0.2em] mt-1">Dispatch Market Notice</p>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-3 bg-neutral-50 rounded-2xl border border-gray-100 text-text-secondary active:scale-95 transition-all"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit((data) => mutation.mutate(data as NoticeFormValues))} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-green-950 uppercase tracking-widest ml-1">Broadcast Type</label>
                                <select 
                                    {...register('type')}
                                    className={`w-full h-14 px-4 rounded-2xl border-2 outline-none transition-all font-bold text-sm ${getTypeColor(selectedType)} focus:ring-4 focus:ring-brand-50`}
                                >
                                    <option value="general">General Notice</option>
                                    <option value="event">Market Event</option>
                                    <option value="maintenance">Planned Maintenance</option>
                                    <option value="promotion">Promotion / Alert</option>
                                    <option value="urgent">Urgent Warning</option>
                                </select>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-green-950 uppercase tracking-widest ml-1">Target Audience</label>
                                <select 
                                    {...register('audience')}
                                    className="w-full h-14 px-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none font-bold text-sm text-gray-700 focus:border-brand-500 focus:bg-white transition-all focus:ring-4 focus:ring-brand-50"
                                >
                                    <option value="all">Everyone (All Users)</option>
                                    <option value="traders">Traders Only</option>
                                    <option value="residents">Residents Only</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-green-950 uppercase tracking-widest ml-1">Subject / Title</label>
                            <input 
                                {...register('title')}
                                placeholder="e.g. Planned Power Maintenance on Block B"
                                className="w-full h-14 px-5 bg-gray-50 rounded-2xl border border-gray-100 outline-none font-bold text-sm text-green-950 focus:border-brand-500 focus:bg-white transition-all focus:ring-4 focus:ring-brand-50"
                            />
                            {errors.title && <p className="text-[10px] text-rose-600 font-black mt-1 ml-1 uppercase">{errors.title.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-green-950 uppercase tracking-widest ml-1">Detailed Content</label>
                            <textarea 
                                {...register('content')}
                                rows={5}
                                placeholder="Provide the full details of the broadcast..."
                                className="w-full p-5 bg-gray-50 rounded-3xl border border-gray-100 outline-none font-bold text-sm text-green-950 resize-none focus:border-brand-500 focus:bg-white transition-all focus:ring-4 focus:ring-brand-50"
                            />
                            {errors.content && <p className="text-[10px] text-rose-600 font-black mt-1 ml-1 uppercase">{errors.content.message}</p>}
                        </div>

                        <div className="flex items-center gap-3 ml-2">
                            <input 
                                type="checkbox" 
                                id="is_pinned" 
                                {...register('is_pinned')}
                                className="w-5 h-5 rounded-md border-gray-300 text-brand-600 focus:ring-brand-500"
                            />
                            <label htmlFor="is_pinned" className="text-xs font-black text-green-950 uppercase tracking-widest cursor-pointer select-none">
                                Pin to Top of Notice Board
                            </label>
                        </div>

                        <div className="p-4 bg-brand-50 rounded-3xl border border-brand-100 flex gap-3 items-start">
                            <Info className="text-brand-600 shrink-0 mt-0.5" size={18} />
                            <p className="text-[11px] text-brand-800 font-bold leading-relaxed">
                                This broadcast will be visible to the selected audience immediately. Urgent notices will trigger a push notification.
                            </p>
                        </div>

                        <button 
                            type="submit" 
                            disabled={mutation.isPending}
                            className="w-full h-16 bg-gray-950 text-white rounded-full font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-gray-950/20 disabled:opacity-50"
                        >
                            {mutation.isPending ? (
                                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Megaphone size={20} />
                                    Dispatch Broadcast
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

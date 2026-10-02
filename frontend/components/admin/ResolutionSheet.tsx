'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, ShieldAlert, Send, Clock, User } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';

const resolutionSchema = z.object({
    status: z.enum(['in_review', 'resolved', 'closed']),
    admin_response: z.string().min(10, 'Response too short (Maelezo ni mafupi mno)'),
});

type ResolutionFormValues = z.infer<typeof resolutionSchema>;

interface ResolutionSheetProps {
    isOpen: boolean;
    onClose: () => void;
    complaint: any;
}

export default function ResolutionSheet({ isOpen, onClose, complaint }: ResolutionSheetProps) {
    const queryClient = useQueryClient();
    const { register, handleSubmit, formState: { errors }, reset } = useForm<ResolutionFormValues>({
        resolver: zodResolver(resolutionSchema),
        defaultValues: {
            status: complaint?.status === 'open' ? 'in_review' : complaint?.status,
            admin_response: complaint?.admin_response || '',
        }
    });

    React.useEffect(() => {
        if (complaint) {
            reset({
                status: complaint.status === 'open' ? 'in_review' : complaint.status,
                admin_response: complaint.admin_response || '',
            });
        }
    }, [complaint, reset]);

    const mutation = useMutation({
        mutationFn: (data: ResolutionFormValues) => api.patch(`/complaints/${complaint.id}/resolve`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-complaints'] });
            queryClient.invalidateQueries({ queryKey: ['admin-complaints-stats'] });
            onClose();
            alert('Incident resolution updated successfully. (Tatizo limeshughulikiwa.)');
        },
    });

    if (!complaint) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    key="resolution-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                />
            )}
            {isOpen && (
                <motion.div 
                    key="resolution-sheet"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] z-[101] p-6 pb-12 shadow-2xl border-t border-gray-100 max-h-[90vh] overflow-y-auto max-w-2xl mx-auto"
                >
                    <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mb-6" />
                    
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-green-950 tracking-tight uppercase">Mediate Incident</h2>
                            <p className="text-[10px] text-text-secondary font-black uppercase tracking-[0.2em] mt-1">Resolution Protocol Level 4</p>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-3 bg-neutral-50 rounded-2xl border border-gray-100 text-text-secondary active:scale-95 transition-all"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Incident Brief */}
                        <div className="bg-rose-50/30 rounded-3xl p-5 border border-rose-100/50">
                            <div className="flex items-center gap-3 mb-3">
                                <ShieldAlert className="text-rose-600" size={20} />
                                <h3 className="text-sm font-black text-rose-950 uppercase tracking-tight">{complaint.subject}</h3>
                            </div>
                            <p className="text-xs font-bold text-rose-900/70 leading-relaxed mb-4">
                                {complaint.description}
                            </p>
                            <div className="flex items-center gap-4 text-[9px] font-black text-rose-950/50 uppercase tracking-widest">
                                <span className="flex items-center gap-1"><User size={10} /> {complaint.user_name}</span>
                                <span className="flex items-center gap-1"><Clock size={10} /> {new Date(complaint.created_at).toLocaleString()}</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-green-950 uppercase tracking-widest ml-1">Update Status</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['in_review', 'resolved', 'closed'].map((status) => (
                                        <label 
                                            key={status}
                                            className={cn(
                                                "h-12 rounded-2xl border flex items-center justify-center text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all active:scale-95",
                                                complaint.status === status ? "bg-green-950 text-white border-green-950" : "bg-white text-text-muted border-gray-100"
                                            )}
                                        >
                                            <input 
                                                type="radio" 
                                                value={status} 
                                                {...register('status')} 
                                                className="hidden" 
                                            />
                                            {status.replace('_', ' ')}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-green-950 uppercase tracking-widest ml-1">Administrative Response</label>
                                <textarea 
                                    {...register('admin_response')}
                                    rows={4}
                                    placeholder="Eleza hatua zilizochukuliwa... (Explain action taken)"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-3xl p-4 text-sm font-bold focus:ring-4 focus:ring-brand-50 outline-none transition-all placeholder:text-text-muted/50"
                                />
                                {errors.admin_response && <p className="text-[10px] text-rose-600 font-black mt-1 ml-1 uppercase">{errors.admin_response.message}</p>}
                            </div>

                            <button 
                                type="submit" 
                                disabled={mutation.isPending}
                                className="w-full h-16 bg-green-950 text-white rounded-full font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-green-950/20 disabled:opacity-50"
                            >
                                {mutation.isPending ? (
                                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle2 size={20} />
                                        Commit Resolution
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

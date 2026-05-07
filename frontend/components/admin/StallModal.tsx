'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
    X, 
    Hash, 
    LayoutGrid, 
    Map, 
    Coins, 
    Info, 
    Save, 
    Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stall, Market } from '@/types';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

const stallSchema = z.object({
    stall_number: z.string().min(1, 'Stall number is required'),
    block: z.string().min(1, 'Block is required'),
    zone: z.enum(['A', 'B', 'C']),
    size_sqm: z.preprocess((val) => Number(val), z.number().min(0).nullable()),
    monthly_fee: z.preprocess((val) => Number(val), z.number().min(0)),
    status: z.enum(['available', 'occupied', 'maintenance']),
    notes: z.string().optional().nullable(),
});

type StallFormValues = z.infer<typeof stallSchema>;

interface StallModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: StallFormValues) => void;
    initialData?: Stall | null;
    marketId: number | null;
    isLoading?: boolean;
}

export const StallModal: React.FC<StallModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    marketId,
    isLoading = false
}) => {
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors }
    } = useForm<StallFormValues>({
        resolver: zodResolver(stallSchema),
        defaultValues: {
            stall_number: '',
            block: 'A',
            zone: 'B',
            size_sqm: 0,
            monthly_fee: 0,
            status: 'available',
            notes: '',
        }
    });

    const watchedBlock = watch('block');
    const watchedZone = watch('zone');

    // Auto-generate stall number
    React.useEffect(() => {
        const fetchNextNumber = async () => {
            if (!isOpen || initialData || !marketId || !watchedBlock) return;
            
            try {
                const res = await api.get('/admin/stalls/next-number', {
                    params: {
                        market_id: marketId,
                        block: watchedBlock,
                        zone: watchedZone
                    }
                });
                
                // res is response.data due to api.ts interceptor
                const data = (res as any).data;
                if (data?.next_number) {
                    setValue('stall_number', data.next_number);
                }
            } catch (error: any) {
                console.error('Failed to auto-generate stall number:', error?.message || error);
                if (error?.response?.data) {
                    console.error('Backend error details:', error.response.data);
                }
            }
        };

        const timeoutId = setTimeout(fetchNextNumber, 500); // Debounce
        return () => clearTimeout(timeoutId);
    }, [isOpen, initialData, marketId, watchedBlock, watchedZone, setValue]);

    React.useEffect(() => {
        if (initialData) {
            reset({
                stall_number: initialData.stall_number,
                block: initialData.block,
                zone: initialData.zone,
                size_sqm: initialData.size_sqm || 0,
                monthly_fee: initialData.monthly_fee,
                status: initialData.status,
                notes: '',
            });
        } else {
            reset({
                stall_number: '',
                block: 'A',
                zone: 'B',
                size_sqm: 0,
                monthly_fee: 0,
                status: 'available',
                notes: '',
            });
        }
    }, [initialData, reset, isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 backdrop-blur-md"
                />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
                >
                    <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                <LayoutGrid size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-green-950 uppercase tracking-tight">
                                    {initialData ? 'Edit Stall Unit' : 'Register Stall'}
                                </h2>
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                    Configure physical unit details
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl hover:bg-gray-50 flex items-center justify-center transition-colors"
                        >
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Stall Number */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-green-950 uppercase tracking-widest ml-1">
                                        Stall Number
                                    </label>
                                    <div className="relative">
                                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input 
                                            {...register('stall_number')}
                                            placeholder="e.g. A10"
                                            className={cn(
                                                "w-full h-12 pl-11 pr-4 bg-gray-50 border border-transparent rounded-xl text-sm font-bold focus:bg-white focus:border-brand-200 transition-all outline-none",
                                                errors.stall_number && "border-red-200 bg-red-50"
                                            )}
                                        />
                                    </div>
                                    {errors.stall_number && <p className="text-[10px] font-bold text-red-600 ml-1">{errors.stall_number.message}</p>}
                                </div>

                                {/* Block */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-green-950 uppercase tracking-widest ml-1">
                                        Building Block
                                    </label>
                                    <div className="relative">
                                        <Map className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input 
                                            {...register('block')}
                                            placeholder="e.g. Block C"
                                            className={cn(
                                                "w-full h-12 pl-11 pr-4 bg-gray-50 border border-transparent rounded-xl text-sm font-bold focus:bg-white focus:border-brand-200 transition-all outline-none",
                                                errors.block && "border-red-200 bg-red-50"
                                            )}
                                        />
                                    </div>
                                    {errors.block && <p className="text-[10px] font-bold text-red-600 ml-1">{errors.block.message}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Zone Selection */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-green-950 uppercase tracking-widest ml-1">
                                        Physical Zone
                                    </label>
                                    <select 
                                        {...register('zone')}
                                        className="w-full h-12 px-4 bg-gray-50 border border-transparent rounded-xl text-sm font-bold focus:bg-white focus:border-brand-200 transition-all outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="A">Zone A (Left Wall)</option>
                                        <option value="B">Zone B (Centre)</option>
                                        <option value="C">Zone C (Right Wall)</option>
                                    </select>
                                </div>

                                {/* Size */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-green-950 uppercase tracking-widest ml-1">
                                        Size (SQM)
                                    </label>
                                    <input 
                                        {...register('size_sqm')}
                                        type="number"
                                        placeholder="15.5"
                                        className="w-full h-12 px-4 bg-gray-50 border border-transparent rounded-xl text-sm font-bold focus:bg-white focus:border-brand-200 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {/* Monthly Fee */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-green-950 uppercase tracking-widest ml-1">
                                    Monthly Rent/Levy (KES)
                                </label>
                                <div className="relative">
                                    <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        {...register('monthly_fee')}
                                        type="number"
                                        placeholder="1500"
                                        className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-transparent rounded-xl text-sm font-bold focus:bg-white focus:border-brand-200 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {/* Status */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-green-950 uppercase tracking-widest ml-1">
                                    Operational Status
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['available', 'occupied', 'maintenance'].map((s) => (
                                        <label key={s} className="relative group cursor-pointer">
                                            <input 
                                                type="radio" 
                                                value={s}
                                                {...register('status')}
                                                className="sr-only peer"
                                            />
                                            <div className="h-10 flex items-center justify-center bg-gray-50 text-[9px] font-black uppercase tracking-widest rounded-xl border border-transparent peer-checked:bg-white peer-checked:border-brand-300 peer-checked:text-brand-700 transition-all">
                                                {s}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 h-14 bg-gray-50 text-text-secondary rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-[2] h-14 bg-gray-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-gray-200 disabled:opacity-70"
                            >
                                {isLoading ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Save size={16} className="text-blue-400" />
                                )}
                                {initialData ? 'Save Changes' : 'Register Unit'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

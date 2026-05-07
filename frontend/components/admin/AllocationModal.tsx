'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
    X, 
    User, 
    Building2, 
    Calendar,
    Save, 
    Loader2,
    FileText,
    MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { ApiResponse, Stall, Trader, Market } from '@/types';

const allocationSchema = z.object({
    stall_id: z.string().min(1, 'Stall is required'),
    trader_id: z.string().min(1, 'Trader is required'),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
});

type AllocationFormValues = z.infer<typeof allocationSchema>;

interface AllocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: AllocationFormValues) => void;
    isLoading?: boolean;
}

export const AllocationModal: React.FC<AllocationModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    isLoading = false
}) => {
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors }
    } = useForm<AllocationFormValues>({
        resolver: zodResolver(allocationSchema),
        defaultValues: {
            stall_id: '',
            trader_id: '',
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
            notes: '',
        }
    });

    React.useEffect(() => {
        if (isOpen) {
            reset({
                stall_id: '',
                trader_id: '',
                start_date: new Date().toISOString().split('T')[0],
                end_date: '',
                notes: '',
            });
        }
    }, [isOpen, reset]);

    const [selectedMarketId, setSelectedMarketId] = React.useState<string>('');

    const { data: marketsRes, isLoading: marketsLoading } = useQuery<ApiResponse<Market[]>>({
        queryKey: ['admin-markets'],
        queryFn: () => api.get('/admin/markets'),
        enabled: isOpen,
    });

    const { data: stallsRes, isLoading: stallsLoading } = useQuery<ApiResponse<Stall[]>>({
        queryKey: ['admin-stalls-available', selectedMarketId],
        queryFn: () => api.get('/admin/stalls', { params: { status: 'available', market_id: selectedMarketId || undefined } }),
        enabled: isOpen,
    });

    const { data: tradersRes, isLoading: tradersLoading } = useQuery<ApiResponse<Trader[]>>({
        queryKey: ['admin-traders-unallocated'],
        queryFn: () => api.get('/admin/traders', { params: { unallocated: 'true' } }),
        enabled: isOpen,
    });

    const markets = Array.isArray(marketsRes) ? marketsRes : marketsRes?.data || [];
    const stalls = Array.isArray(stallsRes) ? stallsRes : stallsRes?.data || [];
    const traders = Array.isArray(tradersRes) ? tradersRes : tradersRes?.data || [];

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
                            <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-green-950 uppercase tracking-tight">
                                    Allocate Stall
                                </h2>
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                    Assign a trader to a physical unit
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
                            
                            {/* Market Selection */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-green-950 uppercase tracking-widest ml-1">
                                    Filter by Market
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <select 
                                        value={selectedMarketId}
                                        onChange={(e) => {
                                            const marketId = e.target.value;
                                            setSelectedMarketId(marketId);
                                            // @ts-ignore
                                            setValue('stall_id', ''); 
                                        }}
                                        className="w-full h-12 pl-11 pr-4 bg-gray-50 border border-transparent rounded-xl text-sm font-bold focus:bg-white focus:border-brand-200 transition-all outline-none appearance-none cursor-pointer"
                                        disabled={marketsLoading}
                                    >
                                        <option value="">{marketsLoading ? 'Loading markets...' : 'All Markets'}</option>
                                        {markets.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            {/* Stall Selection */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-green-950 uppercase tracking-widest ml-1">
                                    Select Available Stall
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <select 
                                        {...register('stall_id')}
                                        className={cn(
                                            "w-full h-12 pl-11 pr-4 bg-gray-50 border border-transparent rounded-xl text-sm font-bold focus:bg-white focus:border-brand-200 transition-all outline-none appearance-none cursor-pointer",
                                            errors.stall_id && "border-red-200 bg-red-50"
                                        )}
                                        disabled={stallsLoading}
                                    >
                                        <option value="">{stallsLoading ? 'Loading stalls...' : 'Choose a stall...'}</option>
                                        {stalls.map(s => (
                                            <option key={s.id} value={s.id}>Stall {s.stall_number} (Block {s.block})</option>
                                        ))}
                                    </select>
                                </div>
                                {errors.stall_id && <p className="text-[10px] font-bold text-red-600 ml-1">{errors.stall_id.message}</p>}
                                {!stallsLoading && stalls.length === 0 && (
                                    <p className="text-[10px] font-bold text-orange-600 ml-1">No available stalls found.</p>
                                )}
                            </div>

                            {/* Trader Selection */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-green-950 uppercase tracking-widest ml-1">
                                    Select Trader
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <select 
                                        {...register('trader_id')}
                                        className={cn(
                                            "w-full h-12 pl-11 pr-4 bg-gray-50 border border-transparent rounded-xl text-sm font-bold focus:bg-white focus:border-brand-200 transition-all outline-none appearance-none cursor-pointer",
                                            errors.trader_id && "border-red-200 bg-red-50"
                                        )}
                                        disabled={tradersLoading}
                                    >
                                        <option value="">{tradersLoading ? 'Loading traders...' : 'Choose an unallocated trader...'}</option>
                                        {traders.map(t => (
                                            <option key={t.id} value={t.id}>{t.business_name || t.user?.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {errors.trader_id && <p className="text-[10px] font-bold text-red-600 ml-1">{errors.trader_id.message}</p>}
                                {!tradersLoading && traders.length === 0 && (
                                    <p className="text-[10px] font-bold text-orange-600 ml-1">No unallocated traders found.</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Start Date */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-green-950 uppercase tracking-widest ml-1">
                                        Start Date
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input 
                                            type="date"
                                            {...register('start_date')}
                                            className={cn(
                                                "w-full h-12 pl-11 pr-4 bg-gray-50 border border-transparent rounded-xl text-sm font-bold focus:bg-white focus:border-brand-200 transition-all outline-none",
                                                errors.start_date && "border-red-200 bg-red-50"
                                            )}
                                        />
                                    </div>
                                    {errors.start_date && <p className="text-[10px] font-bold text-red-600 ml-1">{errors.start_date.message}</p>}
                                </div>

                                {/* End Date */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-green-950 uppercase tracking-widest ml-1">
                                        End Date (Optional)
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input 
                                            type="date"
                                            {...register('end_date')}
                                            className={cn(
                                                "w-full h-12 pl-11 pr-4 bg-gray-50 border border-transparent rounded-xl text-sm font-bold focus:bg-white focus:border-brand-200 transition-all outline-none",
                                                errors.end_date && "border-red-200 bg-red-50"
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-green-950 uppercase tracking-widest ml-1">
                                    Notes (Optional)
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-4 text-gray-400" size={16} />
                                    <textarea 
                                        {...register('notes')}
                                        placeholder="Add any specific conditions..."
                                        rows={3}
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm font-bold focus:bg-white focus:border-brand-200 transition-all outline-none resize-none"
                                    />
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
                                    <Save size={16} className="text-brand-400" />
                                )}
                                Allocate Stall
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

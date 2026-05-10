'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
    X, 
    MapPin, 
    Globe, 
    Compass, 
    Building2, 
    ShieldCheck, 
    Save, 
    Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Market } from '@/types';
import { cn } from '@/lib/utils';

const marketSchema = z.object({
    name: z.string().min(3, 'Market name is required (min 3 chars)'),
    county: z.string().min(2, 'County is required'),
    location: z.string().min(2, 'Location is required'),
    estate: z.string().min(2, 'Estate/Street is required'),
    latitude: z.string().optional().nullable(),
    longitude: z.string().optional().nullable(),
    is_active: z.boolean().default(true),
    banner_image: z.any().optional(),
    icon_image: z.any().optional(),
});

type MarketFormValues = z.infer<typeof marketSchema>;

interface MarketModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: FormData) => void;
    initialData?: Market | null;
    isLoading?: boolean;
}

export const MarketModal: React.FC<MarketModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    isLoading = false
}) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<MarketFormValues>({
        resolver: zodResolver(marketSchema),
        defaultValues: {
            name: '',
            county: '',
            location: '',
            estate: '',
            latitude: '',
            longitude: '',
            is_active: true,
        }
    });

    const handleFormSubmit = (data: MarketFormValues) => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (key === 'banner_image' || key === 'icon_image') {
                if (value instanceof FileList && value[0]) {
                    formData.append(key, value[0]);
                }
            } else if (value !== undefined && value !== null) {
                formData.append(key, value.toString());
            }
        });
        onSubmit(formData);
    };

    React.useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name,
                county: initialData.county,
                location: initialData.location,
                estate: initialData.estate,
                latitude: initialData.latitude || '',
                longitude: initialData.longitude || '',
                is_active: initialData.is_active,
            });
        } else {
            reset({
                name: '',
                county: '',
                location: '',
                estate: '',
                latitude: '',
                longitude: '',
                is_active: true,
            });
        }
    }, [initialData, reset]);

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
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-green-950 uppercase tracking-tight">
                                    {initialData ? 'Edit Market Hub' : 'Register New Hub'}
                                </h2>
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                    Configure core market infrastructure
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

                    <form onSubmit={handleSubmit(handleFormSubmit)} className="p-8 space-y-6">
                        <div className="space-y-4">
                            {/* Market Name */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-green-950 uppercase tracking-widest ml-1">
                                    Market Site Name
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        {...register('name')}
                                        placeholder="e.g. Gikomba Main Hub"
                                        className={cn(
                                            "w-full h-14 pl-12 pr-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-brand-200 transition-all outline-none",
                                            errors.name && "border-red-200 bg-red-50"
                                        )}
                                    />
                                </div>
                                {errors.name && <p className="text-[10px] font-bold text-red-600 ml-1">{errors.name.message}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* County */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-green-950 uppercase tracking-widest ml-1">
                                        County
                                    </label>
                                    <div className="relative">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input 
                                            {...register('county')}
                                            placeholder="Nairobi"
                                            className={cn(
                                                "w-full h-12 pl-11 pr-4 bg-gray-50 border border-transparent rounded-xl text-sm font-bold focus:bg-white focus:border-brand-200 transition-all outline-none",
                                                errors.county && "border-red-200 bg-red-50"
                                            )}
                                        />
                                    </div>
                                    {errors.county && <p className="text-[10px] font-bold text-red-600 ml-1">{errors.county.message}</p>}
                                </div>

                                {/* Location */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-green-950 uppercase tracking-widest ml-1">
                                        Location
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input 
                                            {...register('location')}
                                            placeholder="Central"
                                            className={cn(
                                                "w-full h-12 pl-11 pr-4 bg-gray-50 border border-transparent rounded-xl text-sm font-bold focus:bg-white focus:border-brand-200 transition-all outline-none",
                                                errors.location && "border-red-200 bg-red-50"
                                            )}
                                        />
                                    </div>
                                    {errors.location && <p className="text-[10px] font-bold text-red-600 ml-1">{errors.location.message}</p>}
                                </div>
                            </div>

                            {/* Estate */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-green-950 uppercase tracking-widest ml-1">
                                    Estate / Specific Area
                                </label>
                                <div className="relative">
                                    <Compass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        {...register('estate')}
                                        placeholder="e.g. Kamukunji Area"
                                        className={cn(
                                            "w-full h-12 pl-12 pr-4 bg-gray-50 border border-transparent rounded-xl text-sm font-bold focus:bg-white focus:border-brand-200 transition-all outline-none",
                                            errors.estate && "border-red-200 bg-red-50"
                                        )}
                                    />
                                </div>
                                {errors.estate && <p className="text-[10px] font-bold text-red-600 ml-1">{errors.estate.message}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                {/* Latitude */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">
                                        Latitude (Optional)
                                    </label>
                                    <input 
                                        {...register('latitude')}
                                        placeholder="-1.286389"
                                        className="w-full h-12 px-4 bg-gray-50 border border-transparent rounded-xl text-sm font-bold focus:bg-white focus:border-brand-200 transition-all outline-none"
                                    />
                                </div>

                                {/* Longitude */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">
                                        Longitude (Optional)
                                    </label>
                                    <input 
                                        {...register('longitude')}
                                        placeholder="36.817223"
                                        className="w-full h-12 px-4 bg-gray-50 border border-transparent rounded-xl text-sm font-bold focus:bg-white focus:border-brand-200 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {/* Images Section */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 mt-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-green-950 uppercase tracking-widest ml-1">
                                        Banner Image
                                    </label>
                                    <input 
                                        type="file"
                                        accept="image/*"
                                        {...register('banner_image')}
                                        className="w-full text-[10px] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-green-950 uppercase tracking-widest ml-1">
                                        Market Icon
                                    </label>
                                    <input 
                                        type="file"
                                        accept="image/*"
                                        {...register('icon_image')}
                                        className="w-full text-[10px] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                                    />
                                </div>
                            </div>

                            {/* Status Toggle */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 mt-4">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="text-brand-600" size={20} />
                                    <div>
                                        <p className="text-xs font-black text-green-950 uppercase tracking-tight">Active Status</p>
                                        <p className="text-[10px] font-bold text-text-muted">Allow visibility in directory</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        {...register('is_active')}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 h-14 bg-gray-50 text-text-secondary rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                            >
                                Discard
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
                                {initialData ? 'Commit Changes' : 'Initialize Site'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

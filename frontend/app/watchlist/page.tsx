'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
    Heart, 
    Bell, 
    BellOff, 
    Trash2, 
    ShoppingBag, 
    Store, 
    ChevronRight,
    Loader2,
    ArrowUpRight,
    TrendingDown,
    MapPin
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiResponse } from '@/types';

interface WatchlistItem {
    id: number;
    notify_on_available: boolean;
    product: {
        id: number;
        name: string;
        price: string;
        unit: string;
        stock_status: 'available' | 'low' | 'out_of_stock';
        image_url?: string;
        trader: {
            id: number;
            business_name: string;
        };
    };
}

export default function WatchlistPage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data: watchlistData, isLoading } = useQuery<ApiResponse<WatchlistItem[]>>({
        queryKey: ['watchlist'],
        queryFn: () => api.get('/watchlist'),
    });

    const removeMutation = useMutation({
        mutationFn: (productId: number) => api.delete(`/watchlist/${productId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['watchlist'] });
        }
    });

    const toggleNotifyMutation = useMutation({
        mutationFn: (productId: number) => api.patch(`/watchlist/${productId}/notify`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['watchlist'] });
        }
    });

    const watchlist = watchlistData?.data || [];

    const getStockBadge = (status: string) => {
        switch (status) {
            case 'available': return 'bg-green-100 text-green-700 border-green-200';
            case 'low': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'out_of_stock': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <DashboardLayout title="Bidhaa Ninazofuata (Watchlist)">
            <div className="space-y-6 pb-20">
                
                {/* 1. Stats Counter */}
                <div className="bg-green-950 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-brand-500 rounded-[1.5rem] flex items-center justify-center text-white shadow-lg">
                            <Heart size={32} fill="currentColor" />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black font-mono tracking-tighter">{watchlist.length}</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-200">Products Followed</p>
                        </div>
                    </div>
                </div>

                {/* 2. List of Items */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center gap-3">
                            <Loader2 className="animate-spin text-brand-600" size={32} />
                            <p className="text-[10px] font-black text-brand-700 uppercase tracking-widest animate-pulse">Safisha Watchlist...</p>
                        </div>
                    ) : watchlist.length > 0 ? (
                        watchlist.map((item) => (
                            <motion.div 
                                key={item.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-brand-sm group"
                            >
                                <div className="flex gap-4">
                                    <div className="w-24 h-24 bg-neutral-50 rounded-2xl overflow-hidden border border-gray-100 shrink-0 relative">
                                        {item.product.image_url ? (
                                            <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-text-muted"><ShoppingBag size={24} /></div>
                                        )}
                                        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tight border ${getStockBadge(item.product.stock_status)}`}>
                                            {item.product.stock_status.replace('_', ' ')}
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 space-y-1 py-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-text-muted">
                                                <Store size={12} className="text-amber-500" />
                                                <span className="text-[10px] font-bold uppercase tracking-tight">{item.product.trader.business_name}</span>
                                            </div>
                                            <button 
                                                onClick={() => removeMutation.mutate(item.product.id)}
                                                className="text-text-muted hover:text-red-500 transition-colors p-1"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        
                                        <h4 className="font-black text-green-950 text-sm">{item.product.name}</h4>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-[10px] font-bold text-text-muted">KES</span>
                                            <span className="text-xl font-black text-green-950 font-mono tracking-tighter">{item.product.price}</span>
                                            <span className="text-[9px] text-text-muted font-bold lowercase">/{item.product.unit}</span>
                                        </div>

                                        <div className="flex gap-2 mt-2">
                                            <button 
                                                onClick={() => toggleNotifyMutation.mutate(item.product.id)}
                                                className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${
                                                    item.notify_on_available 
                                                        ? 'bg-brand-50 text-brand-600 border border-brand-100' 
                                                        : 'bg-neutral-50 text-neutral-400 border border-neutral-100'
                                                }`}
                                            >
                                                {item.notify_on_available ? <Bell size={14} /> : <BellOff size={14} />}
                                                {item.notify_on_available ? 'Unfollow Stock' : 'Notify on Stock'}
                                            </button>
                                            <button 
                                                onClick={() => router.push(`/trader/${item.product.id}`)}
                                                className="w-10 h-10 bg-neutral-900 text-white rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-lg"
                                            >
                                                <ArrowUpRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="py-20 text-center space-y-6">
                            <div className="w-24 h-24 bg-neutral-50 rounded-[2.5rem] flex items-center justify-center text-neutral-200 mx-auto relative">
                                <Heart size={48} className="animate-pulse" />
                                <div className="absolute top-2 right-2 w-4 h-4 bg-brand-500 rounded-full animate-ping" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-green-950">Huna bidhaa unazo fuata</h3>
                                <p className="text-xs text-text-secondary font-medium px-16 leading-relaxed">
                                    Bonyeza alama ya moyo kwenye bidhaa ili kupata taarifa zikiongezwa dukani au zikiwa punguzo.
                                </p>
                            </div>
                            <button 
                                onClick={() => router.push('/')}
                                className="px-10 py-5 bg-brand-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-100 flex items-center gap-3 mx-auto"
                            >
                                <ShoppingBag size={18} /> Gudua Bidhaa (Discover)
                            </button>
                        </div>
                    )}
                </div>

                {/* 3. Personalized Recommendation Banner */}
                <div className="bg-amber-100 p-8 rounded-[3rem] border border-amber-200 flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-amber-600 mb-1">
                            <TrendingDown size={20} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Price Peak Alert</span>
                        </div>
                        <h4 className="text-lg font-black text-amber-900 leading-tight">Zucchini bei imeshuka Leo!</h4>
                        <p className="text-[10px] font-bold text-amber-700/70 uppercase">Fika market ya Kolenyo sasa</p>
                    </div>
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-amber-500 border border-amber-100 animate-bounce">
                        <MapPin size={24} />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

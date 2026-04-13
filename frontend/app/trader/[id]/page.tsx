'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { 
    ChevronLeft,
    ChevronRight,
    MapPin, 
    Clock, 
    CheckCircle2, 
    ShoppingBag, 
    Plus, 
    Minus,
    Loader2,
    Store,
    AlertCircle,
    Star,
    TrendingUp
} from 'lucide-react';
import { ApiResponse } from '@/types';
import BottomNav from '@/components/shared/BottomNav';

interface Category {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    price: string;
    unit: string;
    image_url?: string;
    category?: Category;
}

interface Trader {
    id: number;
    business_name: string;
    description: string;
    avatar_url?: string;
    banner_url?: string;
    is_open: boolean;
    market?: { name: string };
    stall?: { stall_number: string };
}

export default function TraderStorefrontPage() {
    const { id } = useParams();
    const router = useRouter();
    const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
    const [quantity, setQuantity] = React.useState(1);

    const { data: storefrontData, isLoading } = useQuery<ApiResponse<{
        trader: Trader;
        products: { data: Product[] };
    }>>({
        queryKey: ['trader', id],
        queryFn: () => api.get(`/traders/${id}`),
    });

    const reservationMutation = useMutation({
        mutationFn: (data: { product_id: number; quantity: number }) => api.post('/reservations', data),
        onSuccess: () => {
            setSelectedProduct(null);
            router.push('/reservations');
        }
    });

    const trader = storefrontData?.data?.trader;
    const products = storefrontData?.data?.products?.data || [];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-brand-600" size={40} />
            </div>
        );
    }

    const handleReserve = () => {
        if (!selectedProduct) return;
        reservationMutation.mutate({
            product_id: selectedProduct.id,
            quantity: quantity,
        });
    };

    return (
        <div className="flex flex-col min-h-screen bg-surface-base pb-32">
            {/* Header / Banner */}
            <div className="relative h-56 w-full bg-green-950 overflow-hidden">
                {trader?.banner_url ? (
                    <img src={trader.banner_url} alt="Banner" className="w-full h-full object-cover opacity-60" />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-b from-green-900 to-green-950" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-green-950/80 via-transparent to-transparent" />
                
                <button 
                    onClick={() => router.back()}
                    className="absolute top-12 left-6 w-11 h-11 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-white z-20 active:scale-90 transition-all shadow-2xl"
                    aria-label="Rudi nyuma (Back)"
                >
                    <ChevronLeft size={24} />
                </button>

                <div className="absolute -bottom-6 left-6 w-24 h-24 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center border-4 border-white text-green-600 z-10 overflow-hidden transition-transform hover:scale-105 duration-300">
                    {trader?.avatar_url ? (
                        <img src={trader.avatar_url} alt={trader?.business_name || 'Trader Profile'} className="w-full h-full object-cover" />
                    ) : (
                        <Store size={40} className="text-green-800" />
                    )}
                </div>
            </div>

            {/* Profile Info */}
            <section className="px-6 pt-10 pb-6 relative">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-black text-green-950 tracking-tight leading-none">{trader?.business_name}</h1>
                            <CheckCircle2 size={24} className="text-brand-500 fill-brand-50 shrink-0" />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <p className="text-[11px] text-text-muted font-bold flex items-center gap-1 uppercase tracking-wider">
                                <MapPin size={12} className="text-amber-500" />
                                {trader?.market?.name} • Stendi {trader?.stall?.stall_number}
                            </p>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <div className="flex items-center gap-1 text-[11px] text-brand-600 font-black uppercase tracking-widest">
                                <Star size={12} className="fill-brand-500 text-brand-500" />
                                4.8 (127)
                            </div>
                        </div>
                    </div>
                    <div className={`px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-sm flex items-center gap-2 ${trader?.is_open ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
                        <div className={`w-2 h-2 rounded-full ${trader?.is_open ? 'bg-green-500 animate-pulse' : 'bg-neutral-400'}`} />
                        {trader?.is_open ? 'Wazi Now' : 'Tumefunga'}
                    </div>
                </div>

                {/* Trust Badges */}
                <div className="flex gap-2 mt-6 overflow-x-auto no-scrollbar pb-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full shrink-0">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tight">Imethibitishwa</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-full shrink-0">
                        <Clock size={12} className="text-amber-600" />
                        <span className="text-[10px] font-black text-amber-700 uppercase tracking-tight">Haraka (Fast)</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full shrink-0">
                        <Star size={12} className="text-blue-600" />
                        <span className="text-[10px] font-black text-blue-700 uppercase tracking-tight">Bora Leo</span>
                    </div>
                </div>

                <p className="mt-4 text-[13px] text-text-secondary leading-relaxed font-medium">
                    {trader?.description || "Karibu katika duka letu kwa bidhaa bora na bei nafuu nchini."}
                </p>

                <div className="flex gap-4 mt-6">
                    <div className="flex items-center gap-2 text-xs text-text-muted font-bold bg-white px-4 py-2 rounded-xl shadow-brand-sm">
                        <Clock size={16} className="text-brand-600" />
                        <span>06:00 - 18:00</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-muted font-bold bg-white px-4 py-2 rounded-xl shadow-brand-sm">
                        <ShoppingBag size={16} className="text-brand-600" />
                        <span>{products.length} Bidhaa</span>
                    </div>
                </div>
            </section>

            {/* Product Grid */}
            <section className="px-6 pb-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-green-950 tracking-tight">Bidhaa Zote</h2>
                    <button className="text-[10px] font-black text-brand-600 uppercase tracking-widest bg-brand-50 px-3 py-1.5 rounded-lg active:scale-95 transition-all">
                        Chuja (Filter)
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {products.map((product: Product) => (
                        <motion.div 
                            key={product.id}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setSelectedProduct(product)}
                            className="bg-white rounded-[2rem] border border-border-default shadow-brand-sm overflow-hidden group"
                        >
                            <div className="aspect-square bg-neutral-100 relative overflow-hidden">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-text-muted"><ShoppingBag size={32} /></div>
                                )}
                                <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-xl shadow-md border border-white">
                                    <p className="text-[9px] font-black text-brand-600 uppercase tracking-wider">{product.category?.name || 'Bidhaa'}</p>
                                </div>
                            </div>
                            <div className="p-4 space-y-1">
                                <h4 className="font-bold text-green-950 text-xs truncate leading-tight">{product.name}</h4>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-[9px] font-bold text-text-muted">KES</span>
                                    <span className="text-lg font-black text-green-950 font-mono tracking-tighter">{product.price}</span>
                                    <span className="text-[8px] text-text-muted lowercase font-bold">/{product.unit}</span>
                                </div>
                                <div className="pt-2">
                                    <button className="w-full h-10 bg-brand-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-brand-sm group-active:scale-95 transition-all">
                                        <Plus size={14} />
                                        Hifadhi
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Reservation Drawer Placeholder (Bottom Sheet) */}
            <AnimatePresence>
                {selectedProduct && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-[60] flex flex-col justify-end"
                        onClick={() => setSelectedProduct(null)}
                    >
                        <motion.div 
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="bg-white rounded-t-[3rem] p-8 space-y-6 max-w-[480px] mx-auto w-full relative shadow-3xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mb-2" />

                            <div className="flex gap-6 items-start">
                                <div className="w-32 h-32 bg-neutral-100 rounded-[2.5rem] overflow-hidden shadow-brand-md border-4 border-white shrink-0">
                                    {selectedProduct.image_url ? (
                                        <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-text-muted bg-gray-50"><ShoppingBag size={40} /></div>
                                    )}
                                </div>
                                <div className="space-y-2 py-2">
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-black text-brand-600 uppercase tracking-[0.2em]">{selectedProduct.category?.name || 'MAELEZO'}</span>
                                        <h3 className="text-2xl font-black text-green-950 tracking-tight leading-tight">{selectedProduct.name}</h3>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xs font-black text-text-muted">KES</span>
                                        <span className="text-3xl font-black text-green-950 font-mono tracking-tighter">{selectedProduct.price}</span>
                                        <span className="text-xs text-text-muted font-bold">/{selectedProduct.unit}</span>
                                    </div>
                                    {/* Price Insight Badge */}
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-xl w-fit border border-green-100">
                                        <TrendingUp size={14} className="text-green-600" />
                                        <span className="text-[10px] font-black text-green-700 uppercase tracking-tight">BEI NZURI SOKONI!</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-surface-base p-6 rounded-[2rem] border border-border-default flex items-center justify-between shadow-inner">
                                <div className="space-y-0.5">
                                    <span className="text-xs font-black text-green-950">Chagua Kiasi</span>
                                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Quantity in {selectedProduct.unit}s</p>
                                </div>
                                <div className="flex items-center gap-4 bg-white p-1 rounded-2xl shadow-brand-sm border border-border-default">
                                    <button 
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-neutral-50 active:scale-90 transition-all text-green-950"
                                        aria-label="Punguza kiasi"
                                        title="Punguza kiasi"
                                    >
                                        <Minus size={24} />
                                    </button>
                                    <span className="text-xl font-black w-8 text-center font-mono">{quantity}</span>
                                    <button 
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-neutral-50 active:scale-90 transition-all text-green-950"
                                        aria-label="Ongeza kiasi"
                                        title="Ongeza kiasi"
                                    >
                                        <Plus size={24} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-4 items-center bg-amber-50/50 p-5 rounded-[2rem] border border-amber-100/50">
                                <AlertCircle className="text-amber-500 shrink-0" size={24} />
                                <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                                    Uhifadhi huu ni wa <strong>saa 24</strong> pekee. Lipia bidhaa ili kuthibitisha oda yako na kuzuia isichukuliwe na mwingine.
                                </p>
                            </div>

                            <button 
                                disabled={reservationMutation.isPending}
                                onClick={handleReserve}
                                className="btn btn-primary w-full h-[72px] text-lg flex items-center justify-between px-8 shadow-brand-lg mt-2 relative overflow-hidden"
                            >
                                {reservationMutation.isPending ? (
                                    <div className="flex items-center gap-3 mx-auto">
                                        <Loader2 className="animate-spin" />
                                        <span className="font-black uppercase tracking-widest text-sm">Inatuma...</span>
                                    </div>
                                ) : (
                                    <>
                                        <span className="font-black uppercase tracking-widest text-sm">Hifadhi Sasa</span>
                                        <div className="flex items-center gap-2">
                                            <span className="w-1 h-1 bg-white/40 rounded-full" />
                                            <span className="font-mono text-xl font-black">KES {parseFloat(selectedProduct.price) * quantity}</span>
                                            <ChevronRight size={24} className="ml-1 opacity-50" />
                                        </div>
                                    </>
                                )}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <BottomNav />
        </div>
    );
}

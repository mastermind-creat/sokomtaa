'use client';

import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { 
    ChevronLeft, 
    MapPin, 
    Clock, 
    CheckCircle2, 
    ShoppingBag, 
    Plus, 
    Minus,
    Loader2,
    Store,
    AlertCircle
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
            <div className="relative h-48 w-full bg-brand-600">
                <button 
                    onClick={() => router.back()}
                    className="absolute top-12 left-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white z-20 active:scale-90 transition-all"
                    aria-label="Rudi nyuma (Back)"
                    title="Rudi nyuma"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="absolute -bottom-8 left-6 w-20 h-20 bg-white rounded-[24px] shadow-brand-lg flex items-center justify-center border-4 border-white text-brand-600 z-10 overflow-hidden">
                    {trader?.avatar_url ? (
                        <img src={trader.avatar_url} alt={trader?.business_name || 'Trader Profile'} className="w-full h-full object-cover" />
                    ) : (
                        <Store size={32} />
                    )}
                </div>
            </div>

            {/* Profile Info */}
            <section className="px-6 pt-12 pb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black text-green-950 tracking-tight">{trader?.business_name}</h1>
                            <CheckCircle2 size={20} className="text-brand-600 fill-brand-50" />
                        </div>
                        <p className="text-xs text-text-muted font-bold flex items-center gap-1 uppercase tracking-tight mt-0.5">
                            <MapPin size={12} className="text-amber-500" />
                            {trader?.market?.name} • Stall {trader?.stall?.stall_number}
                        </p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest ${trader?.is_open ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
                        {trader?.is_open ? 'Wazi (Open)' : 'Tumefunga'}
                    </div>
                </div>

                <p className="mt-4 text-sm text-text-secondary leading-relaxed line-clamp-2">
                    {trader?.description || "Karibu katika duka letu kwa bidhaa bora na bei nafuu."}
                </p>

                <div className="flex gap-4 mt-6">
                    <div className="flex items-center gap-2 text-xs text-text-muted font-bold">
                        <Clock size={16} />
                        <span>06:00 - 18:00</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-muted font-bold">
                        <ShoppingBag size={16} />
                        <span>{products.length} Bidhaa</span>
                    </div>
                </div>
            </section>

            {/* Product Grid */}
            <section className="p-6">
                <h2 className="text-xl font-black text-green-950 mb-6 tracking-tight">Bidhaa Zote / All Products</h2>
                <div className="grid grid-cols-2 gap-4">
                    {products.map((product: Product) => (
                        <div 
                            key={product.id}
                            onClick={() => setSelectedProduct(product)}
                            className="card group cursor-pointer active:scale-95 transition-all overflow-hidden"
                        >
                            <div className="aspect-square bg-neutral-100 relative overflow-hidden">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-text-muted"><ShoppingBag size={32} /></div>
                                )}
                                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
                                    <p className="text-[10px] font-black text-brand-600 uppercase tracking-tight">{product.category?.name}</p>
                                </div>
                            </div>
                            <div className="p-3">
                                <h4 className="font-bold text-green-950 text-sm truncate">{product.name}</h4>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-[10px] font-bold text-text-muted">KES</span>
                                    <span className="text-lg font-black text-green-900 font-mono tracking-tighter">{product.price}</span>
                                    <span className="text-[9px] text-text-muted lowercase">/{product.unit}</span>
                                </div>
                                <button className="btn btn-primary w-full h-10 mt-3 text-xs flex items-center justify-center gap-2 shadow-sm py-0">
                                    <Plus size={14} />
                                    Hifadhi (Reserve)
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Reservation Drawer Placeholder (Bottom Sheet) */}
            {selectedProduct && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex flex-col justify-end bottom-sheet-container">
                    <div className="bg-white rounded-t-[40px] p-8 space-y-6 animate-slide-up max-w-[480px] mx-auto w-full relative">
                        <button 
                            onClick={() => setSelectedProduct(null)}
                            className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-neutral-200 rounded-full"
                            aria-label="Funga (Close)"
                            title="Funga"
                        ></button>

                        <div className="flex gap-6 items-start mt-2">
                            <div className="w-24 h-24 bg-neutral-100 rounded-[24px] overflow-hidden grow-0 shrink-0">
                                <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-green-950 tracking-tight">{selectedProduct.name}</h3>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-xs font-bold text-text-muted">KES</span>
                                    <span className="text-2xl font-black text-green-900 font-mono tracking-tighter">{selectedProduct.price}</span>
                                    <span className="text-xs text-text-muted">/{selectedProduct.unit}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-brand-50/50 p-4 rounded-2xl border border-brand-100/50 flex items-center justify-between">
                            <span className="text-sm font-bold text-green-900">Kiasi / Quantity</span>
                            <div className="flex items-center gap-4 bg-white p-1 rounded-xl shadow-brand-sm border border-border-default">
                                <button 
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-neutral-50 active:scale-90"
                                    aria-label="Punguza (Decrease)"
                                    title="Punguza"
                                >
                                    <Minus size={20} />
                                </button>
                                <span className="text-lg font-black w-6 text-center">{quantity}</span>
                                <button 
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-neutral-50 active:scale-90"
                                    aria-label="Ongeza (Increase)"
                                    title="Ongeza"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3 items-center">
                            <AlertCircle className="text-amber-500 shrink-0" size={18} />
                            <p className="text-[11px] text-text-secondary leading-snug">
                                Lipa bidhaa hii ukifika kwenye duka la <strong>{trader?.business_name}</strong>. Hifadhi hii itadumu kwa saa 24.
                            </p>
                        </div>

                        <button 
                            disabled={reservationMutation.isPending}
                            onClick={handleReserve}
                            className="btn btn-primary w-full h-[64px] text-lg flex items-center justify-center gap-3 shadow-brand-lg mt-4 disabled:opacity-50"
                        >
                            {reservationMutation.isPending ? <Loader2 className="animate-spin" /> : (
                                <>
                                    <span>Kamilisha Uhifadhi (Complete)</span>
                                    <span className="w-1.5 h-1.5 bg-white/40 rounded-full"></span>
                                    <span className="font-mono">KES {parseFloat(selectedProduct.price) * quantity}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}

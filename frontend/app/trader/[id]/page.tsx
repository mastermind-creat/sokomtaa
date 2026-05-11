'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { 
    ChevronLeft,
    ChevronRight,
    MapPin, 
    CheckCircle2, 
    ShoppingBag, 
    Plus, 
    Loader2,
    Store,
    Star,
    Info,
    Phone,
    Share2,
    Calendar,
    Award
} from 'lucide-react';
import { ApiResponse, Trader, Product, Review } from '@/types';
import Image from 'next/image';
import ReservationFlow from '@/components/resident/ReservationFlow';
import ReviewCard from '@/components/shared/ReviewCard';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/hooks/useTranslation';

type Tab = 'products' | 'about' | 'reviews';

export default function TraderStorefrontPage() {
    const { id } = useParams();
    const router = useRouter();
    const [selectedTab, setSelectedTab] = useState<Tab>('products');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const { user } = useAuthStore();
    const { t } = useTranslation();

    // 1. Fetch Trader Details & Products
    const { data: storefrontData, isLoading: isTraderLoading } = useQuery<ApiResponse<{
        trader: Trader;
        products: { data: Product[] };
    }>>({
        queryKey: ['trader', id],
        queryFn: () => api.get(`/traders/${id}`),
    });

    // 2. Fetch Trader Reviews (specifically for the Reviews tab)
    const { data: reviewsData, isLoading: isReviewsLoading } = useQuery<ApiResponse<Review[]>>({
        queryKey: ['trader-reviews', id],
        queryFn: () => api.get(`/traders/${id}/reviews`),
        enabled: selectedTab === 'reviews'
    });

    const trader = storefrontData?.data?.trader;
    const products = storefrontData?.data?.products?.data || [];
    const reviews = reviewsData?.data || [];

    const stats = useMemo(() => {
        if (!trader) return { avg: "0.0", count: 0 };
        return { 
            avg: trader.average_rating || "4.8", // Default placeholder if missing
            count: trader.total_reviews || 127 
        };
    }, [trader]);

    if (isTraderLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-surface">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin" />
                    <Store className="absolute inset-0 m-auto text-brand-600" size={24} />
                </div>
                <p className="mt-4 text-xs font-black text-brand-700 uppercase tracking-widest animate-pulse">Safisha Duka...</p>
            </div>
        );
    }

    if (!trader) return null;

    return (
        <div className="flex flex-col min-h-screen bg-surface pb-32">
            {/* 1. Sticky Header Controls */}
            <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-12 pointer-events-none">
                <button 
                    onClick={() => router.back()}
                    className="w-12 h-12 bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-white shadow-2xl pointer-events-auto active:scale-90 transition-all"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="flex gap-2 pointer-events-auto">
                    <button className="w-12 h-12 bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-white shadow-2xl active:scale-90 transition-all">
                        <Share2 size={20} />
                    </button>
                </div>
            </div>

            {/* 2. Hero Section */}
            <div className="relative h-48 w-full bg-green-950 overflow-hidden">
                {trader.banner_url ? (
                    <Image 
                        src={trader.banner_url} 
                        alt="Banner" 
                        fill
                        className="object-cover opacity-60" 
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-green-800 via-brand-900 to-green-950" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                
                <div className="absolute -bottom-8 left-6 flex items-end gap-6 z-10 w-full px-6">
                    <div className="w-28 h-28 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center border-4 border-white overflow-hidden transition-transform hover:rotate-3 duration-500 shrink-0 relative">
                        {trader.avatar_url ? (
                            <Image 
                                src={trader.avatar_url} 
                                alt={trader.business_name} 
                                fill
                                className="object-cover" 
                            />
                        ) : (
                            <Store size={48} className="text-brand-800" />
                        )}
                    </div>
                </div>
            </div>

            {/* 3. Trader Identity */}
            <section className="px-6 pt-12 pb-6 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-black text-green-950 tracking-tight leading-none">{trader.business_name}</h1>
                            <CheckCircle2 size={24} className="text-brand-500 fill-brand-50 shrink-0" />
                        </div>
                        <p className="text-sm font-bold text-text-muted flex items-center gap-1.5 uppercase tracking-wider">
                            <MapPin size={14} className="text-amber-500" />
                            {trader.market?.name} • Row {trader.stall?.stall_number}
                        </p>
                    </div>
                    <div className={`px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-sm flex items-center gap-2 border ${trader.is_open ? 'bg-green-50 text-green-700 border-green-100' : 'bg-neutral-50 text-neutral-500 border-neutral-100'}`}>
                        <div className={`w-2 h-2 rounded-full ${trader.is_open ? 'bg-green-500 animate-pulse' : 'bg-neutral-400'}`} />
                        {trader.is_open ? 'Open Now' : 'Closed'}
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full shrink-0">
                        <Award size={12} className="text-emerald-600" />
                        <span className="text-[10px] font-black text-emerald-700 uppercase">Verified Trader</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-full shrink-0">
                        <Star size={12} className="text-amber-600" />
                        <span className="text-[10px] font-black text-amber-700 uppercase">High Rated</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full shrink-0">
                        <Info size={12} className="text-blue-600" />
                        <span className="text-[10px] font-black text-blue-700 uppercase">Reserves Accepted</span>
                    </div>
                </div>

                <p className="text-[13px] text-text-secondary leading-relaxed font-medium line-clamp-2">
                    {trader.description || t('storefront.default_description')}
                </p>
            </section>

            {/* 4. Tabbed Navigation */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-xl z-40 px-6 border-b border-gray-100 shadow-sm">
                <div className="flex gap-8">
                    {(['products', 'about', 'reviews'] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setSelectedTab(tab)}
                            className={`py-5 text-xs font-black uppercase tracking-[0.2em] relative transition-colors ${
                                selectedTab === tab ? 'text-brand-600' : 'text-text-muted hover:text-text-primary'
                            }`}
                        >
                            {t(`storefront.${tab}`)}
                            {selectedTab === tab && (
                                <motion.div 
                                    layoutId="activeTab" 
                                    className="absolute bottom-0 left-0 right-0 h-1 bg-brand-600 rounded-full" 
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* 5. Tab Content */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                <AnimatePresence mode="wait">
                    {selectedTab === 'products' && (
                        <motion.div 
                            key="products"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className="grid gap-4"
                            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}
                        >
                            {products.length > 0 ? products.map((product) => (
                                <motion.div 
                                    key={product.id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedProduct(product)}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group cursor-pointer hover:shadow-md transition-all duration-300 flex flex-col"
                                >
                                    <div className="aspect-square bg-neutral-50 relative overflow-hidden">
                                        {product.image_url ? (
                                            <Image 
                                                src={product.image_url} 
                                                alt={product.name} 
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500" 
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-text-muted"><ShoppingBag size={20} /></div>
                                        )}
                                        {/* Availability badge - Pinned top-left */}
                                        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm border border-white/50 z-10">
                                            <p className="text-[8px] font-black text-brand-600 uppercase tracking-tighter">
                                                {product.stock_status === 'available' ? t('common.available') : t('common.low_stock')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-3 flex-1 flex flex-col gap-2">
                                        <div className="space-y-0.5">
                                            <h4 className="font-bold text-green-950 text-[11px] truncate leading-tight group-hover:text-brand-600 transition-colors">{product.name}</h4>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-baseline gap-0.5">
                                                    <span className="text-[7px] font-bold text-text-muted uppercase tracking-tighter">KES</span>
                                                    <span className="text-sm font-black text-green-950 font-mono tracking-tighter">{product.price}</span>
                                                </div>
                                                <span className="text-[7px] text-text-muted lowercase font-bold">/{product.unit}</span>
                                            </div>
                                        </div>
                                        <div className="mt-auto">
                                            <button className="w-full h-9 border-2 border-brand-600 text-brand-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-brand-600 hover:text-white transition-all active:scale-95">
                                                <Plus size={12} /> {t('common.reserve')}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="col-span-2 py-12 text-center space-y-3">
                                    <ShoppingBag size={48} className="mx-auto text-neutral-200" />
                                    <p className="text-sm font-bold text-text-muted uppercase tracking-widest">{t('storefront.no_products') || 'No products yet'}</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {selectedTab === 'about' && (
                        <motion.div 
                            key="about"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className="space-y-8"
                        >
                            <div className="space-y-4">
                                <h3 className="text-lg font-black text-green-950 tracking-tight">{t('storefront.business_desc_title')}</h3>
                                <p className="text-sm text-text-secondary leading-relaxed font-medium">
                                    {trader.description || t('storefront.description_fallback').replace('{market}', trader.market?.name || 'Soko')}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-neutral-50 p-6 rounded-[2rem] border border-gray-100 flex flex-col items-center text-center">
                                    <Calendar className="text-brand-600 mb-2" size={24} />
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{t('storefront.opened_since')}</p>
                                    <h4 className="text-sm font-black text-green-950">Jan 2024</h4>
                                </div>
                                <div className="bg-neutral-50 p-6 rounded-[2rem] border border-gray-100 flex flex-col items-center text-center">
                                    <Award className="text-brand-600 mb-2" size={24} />
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{t('storefront.total_sales')}</p>
                                    <h4 className="text-sm font-black text-green-950">500+ {t('common.orders')}</h4>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                                <h4 className="font-black text-green-950 text-sm tracking-tight uppercase">{t('storefront.contact_info')}</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-brand-600">
                                            <Phone size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-text-muted uppercase tracking-tight">{t('storefront.phone')}</p>
                                            <p className="text-sm font-bold text-green-950">0712 345 678</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                                            <MapPin size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-text-muted uppercase tracking-tight">{t('storefront.location')}</p>
                                            <p className="text-sm font-bold text-green-950">{trader.market?.name}, Stall {trader.stall?.stall_number}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {selectedTab === 'reviews' && (
                        <motion.div 
                            key="reviews"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* Review Overview */}
                            <div className="bg-green-950 p-8 rounded-[3rem] text-white flex items-center justify-between shadow-2xl overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-5xl font-black font-mono tracking-tighter">{stats.avg}</h2>
                                        <span className="text-xs font-bold text-white/60">/ 5.0</span>
                                    </div>
                                    <p className="text-[11px] font-black uppercase tracking-widest text-brand-200 mt-1">{stats.count} {t('storefront.customer_reviews')}</p>
                                 </div>
                                 <div className="flex flex-col gap-1">
                                     {[5,4,3,2,1].map((star) => (
                                         <div key={star} className="flex items-center gap-2">
                                             <span className="text-[8px] font-black opacity-60 w-2">{star}</span>
                                             <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                                                 <div className="h-full bg-brand-500 rounded-full" style={{ width: star > 3 ? `${90 - (5-star)*20}%` : '10%' }} />
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                            </div>

                            {/* Review List */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                    <h3 className="font-black text-green-950 uppercase tracking-tight">Recent Feedback</h3>
                                </div>
                                {isReviewsLoading ? (
                                     <div className="py-12 flex justify-center">
                                         <Loader2 className="animate-spin text-brand-600" />
                                     </div>
                                 ) : reviews.length > 0 ? (
                                     reviews.map((review) => (
                                         <ReviewCard key={review.id} review={review} />
                                     ))
                                 ) : (
                                     <div className="py-12 text-center space-y-2 opacity-40">
                                         <Star size={40} className="mx-auto" />
                                         <p className="text-xs font-black uppercase tracking-widest">{t('storefront.no_reviews')}</p>
                                     </div>
                                 )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 6. Sticky Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-6 lg:pb-10 pointer-events-none">
                <div className="max-w-[480px] mx-auto bg-white/80 backdrop-blur-2xl border border-white p-3 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex gap-3 pointer-events-auto">
                    <a 
                        href={`tel:0712345678`}
                        className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center text-green-950 active:scale-95 transition-all border border-gray-100"
                    >
                        <Phone size={24} />
                    </a>
                    <button 
                        onClick={() => products.length > 0 && setSelectedProduct(products[0])}
                        className="flex-1 h-16 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-brand-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {t('storefront.reserve_item')} <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* 7. Reservation Flow Bottom Sheet */}
            <AnimatePresence>
                {selectedProduct && (
                    <ReservationFlow 
                        product={selectedProduct} 
                        traderId={trader.id}
                        onClose={() => setSelectedProduct(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

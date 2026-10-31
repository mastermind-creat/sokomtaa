'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, ShoppingCart, ShoppingBag, Star, MapPin, Store,
    Package, TrendingUp, Sparkles, ChevronRight, Tag
} from 'lucide-react';
import Image from 'next/image';
import { Product, Trader } from '@/types';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

interface ProductDetailSheetProps {
    product: Product;
    trader?: Trader;
    similarProducts?: Product[];
    onClose: () => void;
    onReserve: (product: Product) => void;
    onAddToCart: (product: Product) => void;
}

export default function ProductDetailSheet({
    product,
    trader,
    similarProducts = [],
    onClose,
    onReserve,
    onAddToCart,
}: ProductDetailSheetProps) {
    const { t } = useTranslation();

    const getActivePrice = (p: Product): number => {
        if (p.active_price != null) return Number(p.active_price);
        if (p.discount_price != null) {
            const now = new Date();
            const startValid = !p.discount_start_date || new Date(p.discount_start_date) <= now;
            const endValid = !p.discount_end_date || new Date(p.discount_end_date) >= now;
            if (startValid && endValid) return Number(p.discount_price);
        }
        return Number(p.price);
    };

    const activePrice = getActivePrice(product);
    const isDiscounted = activePrice < Number(product.price);
    const isOutOfStock = product.stock_status === 'out_of_stock';

    const stockBadge = {
        available: { label: 'In Stock', cls: 'bg-green-50  text-green-700  border-green-100' },
        low: { label: 'Low Stock', cls: 'bg-amber-50  text-amber-700  border-amber-100' },
        out_of_stock: { label: 'Sold Out', cls: 'bg-rose-50   text-rose-700   border-rose-100' },
    }[product.stock_status] ?? { label: product.stock_status, cls: '' };

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />

            {/* Sheet — bottom sheet on mobile, centered modal on desktop */}
            <motion.div
                key="sheet"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                onClick={(e) => e.stopPropagation()}
                className="fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto no-scrollbar bg-white rounded-t-[2.5rem] shadow-2xl
                           lg:inset-x-auto lg:inset-0 lg:m-auto lg:max-h-[85vh] lg:w-full lg:max-w-2xl lg:rounded-[2rem] lg:bottom-auto lg:top-auto"
            >
                {/* Drag handle — mobile only */}
                <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-white z-10 lg:hidden">
                    <div className="w-10 h-1 bg-gray-200 rounded-full" />
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors z-20"
                    aria-label="Close"
                >
                    <X size={16} />
                </button>

                {/* ── Mobile: stacked layout / Desktop: side-by-side ── */}
                <div className="flex flex-col lg:flex-row lg:gap-0">

                    {/* Image — full width on mobile, fixed left column on desktop */}
                    <div className="relative mx-4 mt-4 lg:mx-0 lg:mt-0 aspect-video lg:aspect-auto lg:w-72 lg:shrink-0 rounded-3xl lg:rounded-none lg:rounded-tl-[2rem] lg:rounded-bl-[2rem] overflow-hidden bg-neutral-100 lg:min-h-full">
                        {product.image_url ? (
                            <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-300 min-h-[200px]">
                                <Package size={56} strokeWidth={1} />
                            </div>
                        )}

                        {/* Stock badge */}
                        <div className={cn('absolute top-3 left-3 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider', stockBadge.cls)}>
                            {stockBadge.label}
                        </div>

                        {/* Discount badge */}
                        {isDiscounted && (
                            <div className="absolute top-3 right-3 px-3 py-1 bg-rose-500 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                                Sale
                            </div>
                        )}
                    </div>

                    {/* Right column — scrollable details */}
                    <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar lg:max-h-[85vh]">

                        {/* ── Product Info ──────────────────────────────── */}
                        <div className="px-5 pt-5 pb-4 space-y-3">
                            {/* Category */}
                            {product.category && (
                                <div className="flex items-center gap-1.5">
                                    <Tag size={12} className="text-brand-500" />
                                    <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest">
                                        {product.category.name}
                                    </span>
                                </div>
                            )}

                            {/* Name */}
                            <h2 className="text-2xl font-black text-green-950 leading-tight">
                                {product.name}
                                {product.name_sw && (
                                    <span className="text-base font-bold text-text-muted ml-2">({product.name_sw})</span>
                                )}
                            </h2>

                            {/* Price */}
                            <div className="flex items-baseline gap-2">
                                <span className="text-xs font-bold text-brand-600">KES</span>
                                <span className="text-3xl font-black text-green-950 font-mono">{activePrice.toLocaleString()}</span>
                                <span className="text-sm text-text-muted font-bold">/ {product.unit}</span>
                                {isDiscounted && (
                                    <span className="text-sm text-gray-400 line-through font-mono ml-1">
                                        KES {Number(product.price).toLocaleString()}
                                    </span>
                                )}
                            </div>

                            {/* AI Insight */}
                            {product.ai_insight && (
                                <div className="flex items-start gap-2 bg-brand-50 border border-brand-100 rounded-2xl px-4 py-3">
                                    <Sparkles size={14} className="text-brand-500 mt-0.5 shrink-0" />
                                    <p className="text-[12px] italic text-brand-700 leading-relaxed">{product.ai_insight}</p>
                                </div>
                            )}

                            {/* Description */}
                            {product.description && (
                                <p className="text-sm text-text-secondary leading-relaxed">{product.description}</p>
                            )}

                            {/* Trader info */}
                            {trader && (
                                <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-100 rounded-2xl px-4 py-3">
                                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center overflow-hidden shrink-0">
                                        {trader.avatar_url ? (
                                            <Image src={trader.avatar_url} alt={trader.business_name} width={40} height={40} className="object-cover" />
                                        ) : (
                                            <Store size={18} className="text-brand-600" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-black text-green-950 text-sm truncate">{trader.business_name}</p>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            {trader.market && (
                                                <span className="text-[10px] text-text-muted font-bold flex items-center gap-1">
                                                    <MapPin size={10} className="text-amber-500" />
                                                    {trader.market.name}
                                                </span>
                                            )}
                                            {trader.average_rating > 0 && (
                                                <span className="text-[10px] text-text-muted font-bold flex items-center gap-1">
                                                    <Star size={10} className="text-amber-400 fill-amber-400" />
                                                    {Number(trader.average_rating).toFixed(1)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className={cn(
                                        'ml-auto px-2 py-1 rounded-full text-[9px] font-black uppercase border shrink-0',
                                        trader.is_currently_open
                                            ? 'bg-green-50 text-green-700 border-green-100'
                                            : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                                    )}>
                                        {trader.is_currently_open ? 'Open' : 'Closed'}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── CTA Buttons ───────────────────────────────── */}
                        <div className="px-5 pb-5 flex gap-3">
                            <button
                                onClick={() => { onAddToCart(product); onClose(); }}
                                disabled={isOutOfStock}
                                className={cn(
                                    'flex-1 h-14 rounded-2xl border font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95',
                                    isOutOfStock
                                        ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
                                        : 'bg-brand-50 text-brand-700 border-brand-100 hover:bg-brand-100'
                                )}
                            >
                                <ShoppingCart size={18} />
                                Add to Cart
                            </button>
                            <button
                                onClick={() => { onReserve(product); onClose(); }}
                                disabled={isOutOfStock}
                                className={cn(
                                    'flex-1 h-14 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg',
                                    isOutOfStock
                                        ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                                        : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/30'
                                )}
                            >
                                <ShoppingBag size={18} />
                                Reserve Now
                            </button>
                        </div>

                        {/* ── Similar Products ──────────────────────────── */}
                        {similarProducts.length > 0 && (
                            <div className="px-5 pb-8 border-t border-neutral-100 pt-5">
                                <h3 className="font-black text-green-950 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <TrendingUp size={14} className="text-brand-500" />
                                    Similar Products
                                </h3>
                                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                    {similarProducts.map((p) => {
                                        const sPrice = getActivePrice(p);
                                        return (
                                            <button
                                                key={p.id}
                                                onClick={() => onReserve(p)}
                                                className="flex-none w-36 bg-neutral-50 border border-neutral-100 rounded-2xl overflow-hidden group hover:border-brand-200 transition-all text-left"
                                            >
                                                <div className="aspect-square relative bg-neutral-100 overflow-hidden">
                                                    {p.image_url ? (
                                                        <Image
                                                            src={p.image_url}
                                                            alt={p.name}
                                                            fill
                                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                                            <Package size={28} strokeWidth={1} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-2.5 space-y-1">
                                                    <p className="font-bold text-green-950 text-xs truncate leading-tight">{p.name}</p>
                                                    <div className="flex items-baseline gap-0.5">
                                                        <span className="text-[8px] font-black text-brand-500">KES</span>
                                                        <span className="text-sm font-black text-green-950 font-mono">{sPrice.toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-[9px] text-text-muted font-bold truncate">
                                                        {p.trader?.business_name ?? ''}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                    </div>{/* end right column */}
                </div>{/* end flex row */}
            </motion.div>
        </AnimatePresence>
    );
}

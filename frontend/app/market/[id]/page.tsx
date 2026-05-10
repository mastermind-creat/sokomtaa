'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    MapPin,
    Store,
    Tag,
    Loader2,
    ArrowRight,
    ChevronRight,
    Search,
    LayoutGrid,
    Info,
    ShoppingBag,
    Users,
    BarChart3,
    TrendingDown,
    Star
} from 'lucide-react';
import { ApiResponse, Market, Product, Trader, MarketCategory, Stall } from '@/types';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

export default function MarketDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { t } = useTranslation();
    const [selectedCategory, setSelectedCategory] = React.useState<number | null>(null);
    const [viewMode, setViewMode] = React.useState<'products' | 'stalls' | 'list' | 'compare'>('products');
    const [searchQuery, setSearchQuery] = React.useState('');

    const { data: detailData, isLoading } = useQuery<ApiResponse<{
        market: Market;
        traders: Trader[];
        stalls: Stall[];
        products: any[];
        categories: MarketCategory[];
    }>>({
        queryKey: ['market-detail', id],
        queryFn: () => api.get(`/markets/${id}`),
    });

    const { data: compareData, isLoading: isLoadingCompare } = useQuery<ApiResponse<any[]>>({
        queryKey: ['market-compare', id, searchQuery],
        queryFn: () => api.get(`/markets/${id}/compare`, { params: { q: searchQuery } }),
        enabled: viewMode === 'compare'
    });

    const market = detailData?.data?.market;
    const traders = detailData?.data?.traders || [];
    const stalls = detailData?.data?.stalls || [];
    const products = detailData?.data?.products || [];
    const categories = detailData?.data?.categories || [];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-brand-600" size={40} />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-surface-base w-full flex-1 pb-32">
            {/* Header */}
            <header className="relative h-64 w-full bg-green-900 overflow-hidden">
                {market?.banner_url ? (
                    <img
                        src={market.banner_url}
                        alt={market.name}
                        className="absolute inset-0 w-full h-full object-cover z-0"
                    />
                ) : (
                    <div className="absolute inset-0 bg-noise opacity-20 z-0"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>

                <button
                    onClick={() => router.back()}
                    className="absolute top-12 left-6 w-11 h-11 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white z-20 border border-white/20 active:scale-90 transition-all"
                    aria-label="Back"
                >
                    <ChevronLeft size={24} />
                </button>

                <div className="absolute bottom-6 left-6 right-6 z-20">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md shadow-sm">
                            Community Market
                        </span>
                        {market?.is_active && (
                            <span className="bg-brand-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md shadow-sm">
                                Live Now
                            </span>
                        )}
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight leading-tight">{market?.name}</h1>
                    <div className="flex items-center gap-1 text-white/80 text-xs font-bold mt-1 uppercase tracking-wider">
                        <MapPin size={12} className="text-brand-400" />
                        <span>{market?.county}, {market?.estate}</span>
                    </div>
                </div>
            </header>

            {/* View Selection Tab */}
            <div className="px-6 -mt-6 relative z-30">
                <div className="bg-white p-1.5 rounded-2xl shadow-xl flex gap-1 border border-gray-100">
                    <button
                        onClick={() => setViewMode('products')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            viewMode === 'products' ? "bg-brand-600 text-white shadow-lg shadow-brand-200" : "text-gray-400 hover:text-green-950"
                        )}
                    >
                        <ShoppingBag size={16} /> Products
                    </button>
                    <button
                        onClick={() => setViewMode('stalls')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            viewMode === 'stalls' ? "bg-brand-600 text-white shadow-lg shadow-brand-200" : "text-gray-400 hover:text-green-950"
                        )}
                    >
                        <MapPin size={16} /> Stalls
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            viewMode === 'list' ? "bg-brand-600 text-white shadow-lg shadow-brand-200" : "text-gray-400 hover:text-green-950"
                        )}
                    >
                        <Users size={16} /> Traders
                    </button>
                    <button
                        onClick={() => setViewMode('compare')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            viewMode === 'compare' ? "bg-brand-600 text-white shadow-lg shadow-brand-200" : "text-gray-400 hover:text-green-950"
                        )}
                    >
                        <BarChart3 size={16} /> Compare
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="px-6 mt-8 mb-6">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-brand-600" size={18} />
                    <input
                        className="w-full h-14 pl-12 pr-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:border-brand-300 transition-all"
                        placeholder={
                            viewMode === 'compare' ? "What item do you want to compare prices for?" :
                                viewMode === 'products' ? "Search for fresh items..." :
                                    "Search for traders..."
                        }
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Categories */}
            <section className="px-6 mb-10">
                <h3 className="text-lg font-black text-green-950 mb-4 tracking-tight">Food & Items / Categories</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`flex items-center gap-2 px-4 h-11 rounded-2xl border-2 transition-all font-bold text-xs shrink-0 ${selectedCategory === null ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-neutral-200 text-text-secondary bg-white'
                            }`}
                    >
                        All
                    </button>
                    {categories.map((cat: MarketCategory) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex items-center gap-2 px-4 h-11 rounded-2xl border-2 transition-all font-bold text-xs shrink-0 ${selectedCategory === cat.id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-neutral-200 text-text-secondary bg-white'
                                }`}
                        >
                            <Tag size={14} />
                            {cat.name}
                        </button>
                    ))}
                </div>
            </section>

            {/* Main Content Area */}
            {viewMode === 'products' ? (
                <section className="px-6 pb-20">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black text-green-950 tracking-tight">Available Products</h3>
                        <div className="text-[10px] font-bold text-text-muted italic">
                            Showing {products.length} items
                        </div>
                    </div>

                    {products.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                            {products.map((product: any) => (
                                <div
                                    key={product.id}
                                    className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm flex flex-col active:scale-[0.98] transition-all"
                                    onClick={() => router.push(`/trader/${product.trader_id}`)}
                                >
                                    <div className="aspect-square relative bg-gray-50">
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-200">
                                                <Tag size={48} strokeWidth={1} />
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[9px] font-black text-brand-600 shadow-sm border border-brand-50">
                                            KES {Number(product.price).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="p-2 sm:p-3 flex-1 flex flex-col">
                                        <h4 className="text-[11px] sm:text-xs font-black text-green-950 line-clamp-1">{product.name}</h4>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <div className="flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-text-muted flex-1 min-w-0">
                                                <Store size={8} className="text-brand-500 shrink-0" />
                                                <span className="truncate">{product.trader?.business_name}</span>
                                            </div>
                                            {product.trader?.average_rating > 0 && (
                                                <div className="flex items-center gap-0.5 text-[8px] sm:text-[9px] font-black text-amber-500">
                                                    <Star size={8} fill="currentColor" />
                                                    {Number(product.trader.average_rating).toFixed(1)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-auto pt-1.5 flex items-center justify-between">
                                            <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-1 py-0.5 rounded">
                                                Stall {product.trader?.stall?.stall_number || 'N/A'}
                                            </span>
                                            <ChevronRight size={12} className="text-gray-300" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-16 text-center bg-white rounded-[40px] border-2 border-dashed border-neutral-100 flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-200 mb-4">
                                <Tag size={32} />
                            </div>
                            <h4 className="text-green-950 font-black mb-1">No Products Found</h4>
                            <p className="text-sm font-medium text-neutral-400 max-w-xs">There are no products listed in this market yet.</p>
                        </div>
                    )}
                </section>
            ) : viewMode === 'compare' ? (
                <section className="px-6 pb-20 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-black text-green-950 tracking-tight">Price Comparison</h3>
                        <div className="text-[10px] font-bold text-text-muted italic">
                            Grouped by similar items
                        </div>
                    </div>

                    {isLoadingCompare ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="animate-spin text-brand-600 mb-4" size={32} />
                            <p className="text-sm font-bold text-text-muted">Analyzing market prices...</p>
                        </div>
                    ) : compareData?.data?.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-3xl border border-gray-100">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                <Search size={24} />
                            </div>
                            <h4 className="text-sm font-black text-green-950 uppercase tracking-widest mb-2">No items found</h4>
                            <p className="text-xs text-text-muted font-medium">Try searching for common items like &quote;Eggs&quote;, &quote;Milk&quote;, or &quote;Sugar&quote;.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {compareData?.data?.map((group: any) => (
                                <div key={group.name} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                                    <div className="p-5 border-b border-gray-50 bg-gray-50/30">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-black text-green-950 text-base flex items-center gap-2">
                                                    {group.name}
                                                    <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                        {group.unit}
                                                    </span>
                                                </h4>
                                                <p className="text-[10px] font-bold text-text-muted mt-1 uppercase tracking-tighter">
                                                    {group.category} • {group.traders.length} Vendors
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-black text-brand-600">KES {group.min_price}</div>
                                                <div className="text-[8px] font-black text-text-muted uppercase tracking-widest">Starting Price</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-1 space-y-1">
                                        {group.traders.map((trader: any, idx: number) => (
                                            <div 
                                                key={trader.product_id}
                                                onClick={() => router.push(`/trader/${trader.trader_id}`)}
                                                className={cn(
                                                    "flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-all cursor-pointer active:scale-[0.98]",
                                                    idx === 0 && group.traders.length > 1 ? "bg-amber-50/50 border border-amber-100" : ""
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                                                        {trader.avatar_url ? (
                                                            <img src={trader.avatar_url} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-brand-100 text-brand-600 font-bold text-[10px]">
                                                                {trader.business_name.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-[11px] font-black text-green-950 flex items-center gap-1">
                                                            {trader.business_name}
                                                            {idx === 0 && group.traders.length > 1 && (
                                                                <span className="flex items-center gap-0.5 text-[7px] text-amber-600 font-black uppercase bg-white px-1 py-0.5 rounded shadow-sm shrink-0">
                                                                    <TrendingDown size={6} /> Deal
                                                                </span>
                                                            )}
                                                            {trader.average_rating > 0 && (
                                                                <span className="flex items-center gap-0.5 text-[8px] font-black text-amber-500 ml-1 shrink-0">
                                                                    <Star size={7} fill="currentColor" />
                                                                    {Number(trader.average_rating).toFixed(1)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[7px] font-bold text-text-muted uppercase tracking-widest">
                                                            Stall {trader.stall_number || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={cn(
                                                        "text-[11px] font-black",
                                                        idx === 0 && group.traders.length > 1 ? "text-amber-600" : "text-green-950"
                                                    )}>KES {trader.price}</div>
                                                    <div className="text-[7px] font-bold text-text-muted italic uppercase tracking-tighter">
                                                        per {group.unit}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            ) : viewMode === 'stalls' ? (
                <section className="px-6 pb-20">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black text-green-950 tracking-tight">Market Map / Stalls</h3>
                        <div className="flex gap-3">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-brand-500 rounded-full"></div>
                                <span className="text-[10px] font-bold text-text-muted">Occupied</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {stalls.length > 0 ? (
                            stalls.map((stall: Stall) => (
                                <div
                                    key={stall.id}
                                    onClick={() => stall.trader && router.push(`/trader/${stall.trader.id}`)}
                                    className={`relative aspect-square rounded-2xl border flex flex-col items-center justify-center p-2 transition-all cursor-pointer active:scale-95 ${stall.status === 'occupied'
                                        ? 'bg-brand-50 border-brand-100 text-brand-700 shadow-sm'
                                        : 'bg-white border-neutral-100 text-neutral-200'
                                        }`}
                                >
                                    <div className="text-[8px] font-black opacity-60 mb-1">
                                        {stall.block}-{stall.stall_number}
                                    </div>
                                    <Store size={20} className={stall.status === 'occupied' ? 'text-brand-600' : 'text-neutral-100'} />
                                    {stall.status === 'occupied' && (
                                        <span className="text-[8px] font-black truncate w-full text-center mt-1">
                                            {stall.trader?.business_name}
                                        </span>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full p-16 text-center bg-white rounded-[40px] border-2 border-dashed border-neutral-100">
                                <p className="text-sm font-bold text-neutral-400">No stalls mapped yet.</p>
                            </div>
                        )}
                    </div>
                </section>
            ) : (
                <section className="px-6 space-y-4 pb-20">
                    <h3 className="text-lg font-black text-green-950 mb-4 tracking-tight">Traders Directory</h3>
                    {traders.length > 0 ? (
                        traders.map((trader: Trader) => (
                            <div
                                key={trader.id}
                                onClick={() => router.push(`/trader/${trader.id}`)}
                                className="bg-white p-4 rounded-3xl border border-gray-100 flex gap-4 hover:border-brand-500 transition-all cursor-pointer active:scale-[0.98]"
                            >
                                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-brand-600 shrink-0">
                                    <Store size={24} />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <h4 className="font-black text-green-950 truncate">{trader.business_name}</h4>
                                    <p className="text-[10px] text-text-muted font-bold mt-1 uppercase tracking-tight flex items-center gap-1">
                                        <MapPin size={10} className="text-amber-500" />
                                        Stall {trader.stall?.stall_number || 'N/A'}
                                    </p>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                        <ChevronRight size={16} />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center bg-white rounded-3xl border border-gray-100">
                            <p className="text-sm font-bold text-neutral-400">No traders found.</p>
                        </div>
                    )}
                </section>
            )}

        </div>
    );
}

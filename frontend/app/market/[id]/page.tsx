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
    Search,
    LayoutGrid,
    Info
} from 'lucide-react';
import { ApiResponse, Stall, Trader } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

export default function MarketDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { t } = useTranslation();
    const [selectedCategory, setSelectedCategory] = React.useState<number | null>(null);
    const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('grid');

    const { data: detailData, isLoading } = useQuery<ApiResponse<{
        market: Market;
        traders: Trader[];
        stalls: Stall[];
        categories: MarketCategory[];
    }>>({
        queryKey: ['market', id],
        queryFn: () => api.get(`/markets/${id}`),
    });

    const market = detailData?.data?.market;
    const traders = detailData?.data?.traders || [];
    const stalls = detailData?.data?.stalls || [];
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
                <div className="absolute inset-0 bg-noise opacity-20 z-0"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>

                <button
                    onClick={() => router.back()}
                    className="absolute top-12 left-6 w-11 h-11 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white z-20 border border-white/20 active:scale-90 transition-all"
                    aria-label="Back"
                    title="Back"
                >
                    <ChevronLeft size={24} />
                </button>

                <div className="absolute bottom-6 left-6 right-6 z-20">
                    <span className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 inline-block shadow-sm">
                        Community Market
                    </span>
                    <h1 className="text-3xl font-black text-white tracking-tight leading-tight">{market?.name}</h1>
                    <div className="flex items-center gap-1 text-white/80 text-sm mt-1">
                        <MapPin size={14} />
                        <span>{market?.county}, {market?.estate}</span>
                    </div>
                </div>
            </header>

            {/* Quick Stats / Info */}
            <section className="p-6 -mt-4 relative z-20">
                <div className="card bg-white p-4 flex justify-around shadow-brand-lg">
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Traders</p>
                        <p className="text-xl font-black text-green-950">{market?.traders_count}</p>
                    </div>
                    <div className="w-[1px] bg-border-default"></div>
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Status</p>
                        <p className="text-xl font-black text-brand-600">Open</p>
                    </div>
                </div>
            </section>

            {/* Search and View Toggle */}
            <div className="px-6 mb-8 flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input
                        className="input pl-12 h-14 !rounded-2xl border-neutral-200"
                        placeholder="Find a trader or stall..."
                    />
                </div>
                <button
                    onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                    className="w-14 h-14 bg-white border border-neutral-200 rounded-2xl flex items-center justify-center text-green-950 active:bg-neutral-50 transition-colors shrink-0"
                    title={viewMode === 'list' ? 'Switch to Grid' : 'Switch to List'}
                >
                    {viewMode === 'list' ? <LayoutGrid size={24} /> : <Store size={24} />}
                </button>
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
            {viewMode === 'grid' ? (
                <section className="px-6 pb-20">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black text-green-950 tracking-tight">Market Map / Stalls</h3>
                        <div className="flex gap-3">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-brand-500 rounded-full"></div>
                                <span className="text-[10px] font-bold text-text-muted">Occupied</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-neutral-200 rounded-full"></div>
                                <span className="text-[10px] font-bold text-text-muted">Empty</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                        {stalls.length > 0 ? (
                            stalls.map((stall: Stall) => (
                                <div
                                    key={stall.id}
                                    onClick={() => stall.trader && router.push(`/trader/${stall.trader.id}`)}
                                    className={`relative aspect-square rounded-[24px] border-2 flex flex-col items-center justify-center p-3 transition-all cursor-pointer active:scale-95 group overflow-hidden ${stall.status === 'occupied'
                                        ? 'bg-gradient-to-br from-brand-50 to-white border-brand-100 text-brand-700 shadow-sm hover:border-brand-300 hover:shadow-md'
                                        : 'bg-white border-neutral-100 text-neutral-300 hover:border-neutral-200'
                                        }`}
                                >
                                    {/* Stall Label */}
                                    <div className={`absolute top-2 left-3 text-[9px] font-black uppercase tracking-widest opacity-60 ${stall.status === 'occupied' ? 'text-brand-600' : 'text-neutral-400'
                                        }`}>
                                        {stall.block}-{stall.stall_number}
                                    </div>

                                    {/* Icon / Content */}
                                    {stall.status === 'occupied' ? (
                                        <>
                                            <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600 mb-2 group-hover:scale-110 transition-transform">
                                                <Store size={20} />
                                            </div>
                                            <span className="text-[10px] font-black truncate w-full text-center px-1">
                                                {stall.trader?.business_name || 'Trader'}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-10 h-10 bg-neutral-50 rounded-xl flex items-center justify-center text-neutral-200 mb-2">
                                                <Store size={20} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-tight opacity-40">Empty</span>
                                        </>
                                    )}

                                    {/* Zone Badge */}
                                    <div className="absolute top-2 right-3 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm" title={`Zone ${stall.zone}`}></div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full p-16 text-center bg-white rounded-[40px] border-2 border-dashed border-neutral-100 flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-200 mb-4">
                                    <LayoutGrid size={32} />
                                </div>
                                <h4 className="text-green-950 font-black mb-1">No Stalls Configured</h4>
                                <p className="text-sm font-medium text-neutral-400 max-w-xs">This market building hasn't been mapped yet. Check back soon!</p>
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
                                className="card p-4 flex gap-4 hover:border-brand-500 transition-all cursor-pointer group active:scale-[0.98]"
                            >
                                <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center grow-0 shrink-0 text-brand-600 shadow-inner">
                                    <Store size={28} />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-black text-green-950 truncate pr-2">{trader.business_name}</h4>
                                        <ArrowRight size={18} className="text-text-muted group-hover:text-brand-600 transition-colors" />
                                    </div>
                                    <p className="text-xs text-text-muted font-bold mt-1 uppercase tracking-tight flex items-center gap-1">
                                        <MapPin size={10} className="text-amber-500" />
                                        Stall {trader.stall?.stall_number || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-neutral-100">
                            <Info className="mx-auto text-neutral-300 mb-2" />
                            <p className="text-sm font-bold text-neutral-400">No traders found in this market.</p>
                        </div>
                    )}
                </section>
            )}

        </div>
    );
}

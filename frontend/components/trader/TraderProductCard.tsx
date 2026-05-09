'use client';

import React from 'react';
import Image from 'next/image';
import { 
    MoreVertical, 
    Edit3, 
    Trash2, 
    Package, 
    CheckCircle2, 
    AlertTriangle, 
    XCircle,
    TrendingUp,
    Tag,
    Zap
} from 'lucide-react';
import { Product } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

interface TraderProductCardProps {
    product: Product;
    onEdit: (product: Product) => void;
    onDelete: (id: number) => void;
    onToggleStatus: (id: number, status: string) => void;
    onBoost: (id: number) => void;
    isUpdating?: boolean;
    isBoosting?: boolean;
}

export default function TraderProductCard({ 
    product,
    onEdit, 
    onDelete, 
    onToggleStatus,
    onBoost,
    isUpdating,
    isBoosting
}: TraderProductCardProps) {
    const { t } = useTranslation();
    const [showMenu, setShowMenu] = React.useState(false);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'text-success bg-green-50 border-green-100';
            case 'low': return 'text-warning bg-amber-50 border-amber-100';
            case 'out_of_stock': return 'text-error bg-rose-50 border-rose-100';
            default: return 'text-text-muted bg-neutral-50 border-neutral-100';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'available': return <CheckCircle2 size={12} className="fill-white" />;
            case 'low': return <AlertTriangle size={12} className="fill-white" />;
            case 'out_of_stock': return <XCircle size={12} className="fill-white" />;
            default: return <Package size={12} />;
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-white rounded-[2rem] border border-neutral-100 p-4 shadow-sm hover:shadow-brand-md transition-all duration-300 relative overflow-hidden"
        >
            {/* Image Section */}
            <div className="relative aspect-square w-full rounded-[1.5rem] bg-neutral-100 overflow-hidden mb-4 shadow-inner group-hover:shadow-none transition-shadow">
                {product.image_url ? (
                    <Image 
                        src={product.image_url} 
                        alt={product.name} 
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110" 
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-300 gap-2">
                        <Package size={48} strokeWidth={1} />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">No Image</span>
                    </div>
                )}

                {/* Status Badge Overlay */}
                <div className={cn(
                    "absolute top-3 left-3 px-3 py-1.5 rounded-full border flex items-center gap-1.5 backdrop-blur-md shadow-sm transition-all duration-300",
                    getStatusColor(product.stock_status)
                )}>
                    {getStatusIcon(product.stock_status)}
                    <span className="text-[10px] font-black uppercase tracking-wider">
                        {product.stock_status === 'available' ? 'In Stock' : 
                         product.stock_status === 'low' ? 'Low' : 'Out'}
                    </span>
                </div>

                {/* Boosted Badge */}
                {product.is_boosted && (
                    <div className="absolute top-3 right-3 px-3 py-1.5 bg-amber-500 text-white rounded-full flex items-center gap-1.5 shadow-lg shadow-amber-500/20 z-10 animate-pulse">
                        <Zap size={12} className="fill-white" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Boosted</span>
                    </div>
                )}

                {/* Reservation Count Overlay */}
                <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/60 backdrop-blur-md text-white rounded-full flex items-center gap-1.5 shadow-sm">
                    <TrendingUp size={12} className="text-brand-400" />
                    <span className="text-[10px] font-black tracking-tight">{product.total_reservations || 0}</span>
                </div>
            </div>

            {/* Content Section */}
            <div className="px-1 space-y-3">
                <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                        <h3 className="font-black text-green-950 text-lg leading-tight truncate tracking-tight group-hover:text-brand-700 transition-colors">
                            {product.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <Tag size={12} className="text-brand-500" />
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest truncate">
                                {product.category?.name || 'Uncategorized'}
                            </span>
                        </div>
                    </div>

                    <div className="relative">
                        <button 
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 bg-neutral-50 rounded-xl text-neutral-400 hover:text-green-950 hover:bg-neutral-100 transition-all active:scale-90"
                        >
                            <MoreVertical size={20} />
                        </button>

                        <AnimatePresence>
                            {showMenu && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-10" 
                                        onClick={() => setShowMenu(false)} 
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-2xl shadow-2xl border border-neutral-100 z-20 py-2 overflow-hidden"
                                    >
                                        <button 
                                            onClick={() => { onEdit(product); setShowMenu(false); }}
                                            className="w-full px-4 py-3 text-left flex items-center gap-3 text-sm font-bold text-green-950 hover:bg-neutral-50 transition-colors"
                                        >
                                            <Edit3 size={18} className="text-brand-600" />
                                            Edit Product
                                        </button>
                                        <button 
                                            onClick={() => { onBoost(product.id); setShowMenu(false); }}
                                            className="w-full px-4 py-3 text-left flex items-center gap-3 text-sm font-bold text-amber-600 hover:bg-amber-50 transition-colors"
                                        >
                                            <Zap size={18} />
                                            Boost Visibility (KES 20)
                                        </button>
                                        <button 
                                            onClick={() => { onDelete(product.id); setShowMenu(false); }}
                                            className="w-full px-4 py-3 text-left flex items-center gap-3 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                            Delete
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="pt-2 flex justify-between items-end border-t border-neutral-50">
                    <div>
                        <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-0.5">Price / Unit</p>
                        <div className="font-mono text-xl font-black text-green-950 flex items-baseline gap-1">
                            <span className="text-[10px] font-bold text-brand-600">KES</span>
                            {Number(product.price).toLocaleString()}
                            <span className="text-[10px] font-bold text-text-muted">/{product.unit}</span>
                        </div>
                    </div>

                    <div className="relative">
                        <select 
                            value={product.stock_status}
                            onChange={(e) => onToggleStatus(product.id, e.target.value)}
                            disabled={isUpdating}
                            className={cn(
                                "text-[10px] font-black uppercase tracking-[0.15em] px-3 py-2.5 rounded-xl border-2 appearance-none transition-all cursor-pointer shadow-sm disabled:opacity-50 min-w-[110px] text-center",
                                product.stock_status === 'available' ? 'border-brand-100 bg-brand-50 text-brand-700' : 
                                product.stock_status === 'low' ? 'border-amber-100 bg-amber-50 text-amber-700' : 
                                'border-rose-100 bg-rose-50 text-rose-700'
                            )}
                        >
                            <option value="available">In Stock</option>
                            <option value="low">Low Stock</option>
                            <option value="out_of_stock">Sold Out</option>
                        </select>
                        {isUpdating && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-xl">
                                <div className="w-3 h-3 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

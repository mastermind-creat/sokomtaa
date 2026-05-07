'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse } from '@/types';
import { 
    Clock, 
    ShoppingBag,
    User,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Reservation {
    id: number;
    reservation_code: string;
    status: 'pending' | 'paid' | 'ready' | 'completed' | 'cancelled';
    quantity: number;
    total_amount: number;
    product: { name: string; image_url: string | null };
    resident: { name: string; phone: string };
    created_at: string;
}

export default function PriorityOrderList() {
    const { data: resData, isLoading } = useQuery<ApiResponse<Reservation[]> | Reservation[]>({
        queryKey: ['trader-priority-orders'],
        queryFn: () => api.get('/trader/reservations?status=paid,ready')
    });

    if (isLoading) {
        return (
            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-50 h-full min-h-[500px]">
                <div className="w-48 h-6 bg-gray-100 animate-pulse rounded-lg mb-8" />
                <div className="space-y-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-24 bg-gray-50 animate-pulse rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    const priorityOrders = Array.isArray(resData) ? resData : resData?.data || [];

    return (
        <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-sm border border-gray-50 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-black text-green-950 tracking-tight">Immediate Attention</h3>
                    <p className="text-text-secondary text-xs font-bold uppercase tracking-widest mt-1">Ready for fulfillment</p>
                </div>
                <div className="w-10 h-10 bg-brand-50 text-brand-700 rounded-xl flex items-center justify-center font-black text-sm">
                    {priorityOrders.length}
                </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar max-h-[600px] pr-2">
                <AnimatePresence mode="popLayout">
                    {priorityOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300 mb-4 transition-transform hover:rotate-12">
                                <ShoppingBag size={40} />
                            </div>
                            <h4 className="font-black text-green-950">Hakuna order mpya</h4>
                            <p className="text-text-secondary text-xs mt-1">Orders requiring action will appear here.</p>
                        </div>
                    ) : (
                        priorityOrders.map((order, index) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="group bg-gray-50 hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 border border-transparent hover:border-brand-100 rounded-[2rem] p-5 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="flex items-center gap-5 relative z-10">
                                    <div className="w-14 h-14 bg-white rounded-2xl overflow-hidden shadow-inner leading-none shrink-0 border border-gray-100 group-hover:scale-105 transition-transform">
                                        {order.product.image_url ? (
                                            <img src={order.product.image_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-200 bg-gray-50">
                                                <ShoppingBag size={24} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="text-sm font-black text-green-950 truncate group-hover:text-brand-700 transition-colors uppercase">
                                                {order.product.name}
                                            </h4>
                                            <span className="text-[10px] font-black text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg uppercase whitespace-nowrap">
                                                {order.status}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 mt-2">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-gray-400 shrink-0">
                                                    <User size={10} />
                                                </div>
                                                <span className="text-[10px] font-bold text-text-secondary truncate">{order.resident.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-gray-400 shrink-0">
                                                    <Clock size={10} />
                                                </div>
                                                <span className="text-[10px] font-bold text-text-secondary"># {order.reservation_code}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-white opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all shadow-md">
                                        <ArrowRight size={18} className="text-brand-600" />
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            <button className="mt-8 w-full py-4 border-2 border-dashed border-gray-100 hover:border-brand-200 hover:bg-brand-50/30 rounded-2xl text-xs font-black uppercase tracking-[0.2em] text-text-muted hover:text-brand-600 transition-all active:scale-[0.98]">
                View All Orders
            </button>
        </div>
    );
}

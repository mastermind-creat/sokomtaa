'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package, Clock, CheckCircle2, XCircle, ShoppingBag,
    Phone, ChevronRight, AlertCircle, RefreshCw, Filter
} from 'lucide-react';
import api from '@/lib/api';
import { ApiResponse } from '@/types';
import { useUIStore } from '@/store/uiStore';
import { useTranslation } from '@/hooks/useTranslation';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

type ReservationStatus = 'pending' | 'paid' | 'ready' | 'completed' | 'cancelled' | 'expired';

interface ReservationItem {
    id: number;
    reservation_code: string;
    status: ReservationStatus;
    quantity: number;
    unit_price: string;
    total_amount: string;
    pickup_deadline: string | null;
    notes: string | null;
    created_at: string;
    resident: {
        id: number;
        name: string;
        phone: string;
    };
    product: {
        id: number;
        name: string;
        unit: string;
        image_url: string | null;
    };
}

interface OrderStats {
    pending: number;
    paid: number;
    ready: number;
    completed_this_week: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_TABS: { key: ReservationStatus | 'all'; label: string; icon: React.ReactNode }[] = [
    { key: 'pending', label: 'New', icon: <AlertCircle className="w-4 h-4" /> },
    { key: 'paid',    label: 'Paid', icon: <CheckCircle2 className="w-4 h-4" /> },
    { key: 'ready',   label: 'Ready', icon: <Package className="w-4 h-4" /> },
    { key: 'completed', label: 'Done', icon: <CheckCircle2 className="w-4 h-4" /> },
    { key: 'all',     label: 'All', icon: <ShoppingBag className="w-4 h-4" /> },
];

const STATUS_CONFIG: Record<ReservationStatus, { label: string; color: string; bg: string }> = {
    pending:   { label: 'New',       color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200' },
    paid:      { label: 'Paid',      color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
    ready:     { label: 'Ready',     color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
    completed: { label: 'Completed', color: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200' },
    cancelled: { label: 'Cancelled', color: 'text-red-700',    bg: 'bg-red-50 border-red-200' },
    expired:   { label: 'Expired',   color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
};

function formatDeadline(deadline: string | null): string {
    if (!deadline) return '—';
    const d = new Date(deadline);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    const diffM = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (diffMs < 0) return 'Expired';
    if (diffH < 1) return `${diffM}m left`;
    if (diffH < 24) return `${diffH}h ${diffM}m left`;
    return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({ order, onMarkReady, onMarkComplete, isUpdating }: {
    order: ReservationItem;
    onMarkReady: (id: number) => void;
    onMarkComplete: (id: number) => void;
    isUpdating: boolean;
}) {
    const cfg = STATUS_CONFIG[order.status];
    const deadlineStr = formatDeadline(order.pickup_deadline);
    const isUrgent = order.pickup_deadline && new Date(order.pickup_deadline).getTime() - Date.now() < 2 * 60 * 60 * 1000;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-2xl border ${isUrgent ? 'border-red-200 shadow-red-50' : 'border-gray-100'} shadow-sm overflow-hidden`}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <span className="font-mono text-xs font-bold text-text-secondary tracking-widest">{order.reservation_code}</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                </span>
            </div>

            {/* Body */}
            <div className="px-5 pb-4 space-y-3">
                {/* Customer */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold text-sm">{order.resident.name.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-sm text-text-primary truncate">{order.resident.name}</p>
                        <a href={`tel:${order.resident.phone}`} className="text-xs text-text-secondary flex items-center gap-1 hover:text-primary transition-colors">
                            <Phone className="w-3 h-3" />
                            {order.resident.phone}
                        </a>
                    </div>
                </div>

                {/* Product */}
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <div>
                        <p className="font-bold text-text-primary text-sm">{order.product.name}</p>
                        <p className="text-xs text-text-secondary">
                            {order.quantity} {order.product.unit} × KES {parseFloat(order.unit_price).toFixed(0)}
                        </p>
                    </div>
                    <p className="font-black text-primary text-lg">KES {parseFloat(order.total_amount).toFixed(0)}</p>
                </div>

                {/* Deadline */}
                {order.pickup_deadline && (
                    <div className={`flex items-center gap-2 text-xs font-medium ${isUrgent ? 'text-red-600' : 'text-text-secondary'}`}>
                        <Clock className="w-3.5 h-3.5" />
                        Pickup deadline: {deadlineStr}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="border-t border-gray-100 flex">
                <Link
                    href={`/trader/reservations/${order.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-semibold text-text-secondary hover:text-primary hover:bg-gray-50 transition-colors"
                >
                    Details <ChevronRight className="w-4 h-4" />
                </Link>

                {order.status === 'paid' && (
                    <button
                        onClick={() => onMarkReady(order.id)}
                        disabled={isUpdating}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-bold text-white bg-primary hover:bg-primary-light transition-colors disabled:opacity-50"
                    >
                        <Package className="w-4 h-4" />
                        Mark Ready
                    </button>
                )}
                {order.status === 'ready' && (
                    <button
                        onClick={() => onMarkComplete(order.id)}
                        disabled={isUpdating}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark Complete
                    </button>
                )}
            </div>
        </motion.div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function OrderSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
            <div className="px-5 pt-4 pb-2 flex justify-between">
                <div className="h-3 w-32 bg-gray-200 rounded" />
                <div className="h-6 w-16 bg-gray-200 rounded-full" />
            </div>
            <div className="px-5 pb-4 space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-200" />
                    <div className="space-y-1.5">
                        <div className="h-3.5 w-28 bg-gray-200 rounded" />
                        <div className="h-3 w-20 bg-gray-200 rounded" />
                    </div>
                </div>
                <div className="h-16 bg-gray-100 rounded-xl" />
            </div>
            <div className="border-t border-gray-100 h-12 bg-gray-50" />
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TraderOrdersPage() {
    const { t } = useTranslation();
    const { setPageTitle } = useUIStore();

    React.useEffect(() => {
        setPageTitle('Orders');
    }, [setPageTitle]);

    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<ReservationStatus | 'all'>('paid');

    // Fetch orders
    const { data: ordersData, isLoading } = useQuery({
        queryKey: ['trader-orders', activeTab],
        queryFn: async () => {
            const params = activeTab !== 'all' ? `?status=${activeTab}` : '';
            const res = await api.get<never, ApiResponse<{ data: ReservationItem[]; total: number }>>(`/trader/reservations${params}`);
            return res.data;
        },
        refetchInterval: 30_000, // Poll every 30s
    });

    // Fetch quick stats
    const { data: stats } = useQuery({
        queryKey: ['trader-order-stats'],
        queryFn: async () => {
            const res = await api.get<never, ApiResponse<OrderStats>>('/trader/reservations/stats');
            return res.data;
        },
        refetchInterval: 30_000,
    });

    // Update status mutation
    const { mutate: updateStatus, isPending: isUpdating } = useMutation({
        mutationFn: async ({ id, status }: { id: number; status: string }) => {
            return api.patch(`/reservations/${id}/status`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trader-orders'] });
            queryClient.invalidateQueries({ queryKey: ['trader-order-stats'] });
        },
    });

    const orders = Array.isArray(ordersData) ? ordersData : (ordersData as any)?.data ?? [];

    return (
        <div className="min-h-screen bg-transparent">
            {/* Page Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10 -mx-4 md:-mx-8 -mt-6 mb-6 px-4 md:px-8 py-4">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-end mb-2">
                        <button
                            onClick={() => queryClient.invalidateQueries({ queryKey: ['trader-orders'] })}
                            className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 shadow-sm"
                        >
                            <RefreshCw className="w-4 h-4 text-text-secondary" />
                        </button>
                    </div>

                    {/* Quick Stats Bar */}
                    <div className="grid grid-cols-4 gap-2 mb-2">
                        {[
                            { label: 'New', value: stats?.pending ?? 0, color: 'text-amber-600' },
                            { label: 'Paid', value: stats?.paid ?? 0, color: 'text-blue-600' },
                            { label: 'Ready', value: stats?.ready ?? 0, color: 'text-green-600' },
                            { label: 'Done', value: stats?.completed_this_week ?? 0, color: 'text-primary' },
                        ].map((s) => (
                            <div key={s.label} className="text-center py-1">
                                <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Status Tabs */}
                    <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-px">
                        {STATUS_TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${
                                    activeTab === tab.key
                                        ? 'border-brand-600 text-brand-700'
                                        : 'border-transparent text-text-secondary hover:text-text-primary'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                                {tab.key === 'paid' && (stats?.paid ?? 0) > 0 && (
                                    <span className="ml-0.5 bg-brand-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg shadow-brand-200">
                                        {stats?.paid}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Order List */}
            <div className="max-w-3xl mx-auto">
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => <OrderSkeleton key={i} />)}
                    </div>
                ) : orders.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20"
                    >
                        <div className="w-24 h-24 bg-white rounded-[32px] shadow-sm border border-gray-50 flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag className="w-10 h-10 text-gray-200" />
                        </div>
                        <h3 className="font-black text-green-950 text-xl mb-2">No orders here</h3>
                        <p className="text-text-secondary text-sm font-medium">
                            {activeTab === 'paid'
                                ? 'No paid orders waiting to be processed.'
                                : `No ${activeTab} orders at the moment.`}
                        </p>
                    </motion.div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {orders.map((order: ReservationItem) => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    onMarkReady={(id) => updateStatus({ id, status: 'ready' })}
                                    onMarkComplete={(id) => updateStatus({ id, status: 'completed' })}
                                    isUpdating={isUpdating}
                                />
                            ))}
                        </div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );

}

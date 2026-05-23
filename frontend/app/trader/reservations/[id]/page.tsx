'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Phone, Package, Clock,
    Copy, User, MessageSquare, Truck, Info, AlertCircle
} from 'lucide-react';
import api from '@/lib/api';
import { ApiResponse } from '@/types';

import { useUIStore } from '@/store/uiStore';
import { useTranslation } from '@/hooks/useTranslation';

interface ReservationDetail {
    id: number;
    reservation_code: string;
    status: 'pending' | 'paid' | 'ready' | 'completed' | 'cancelled' | 'expired';
    delivery_option: boolean;
    delivery_status: string | null; // 'pending_assignment' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | null
    quantity: number;
    unit_price: string;
    total_amount: string;
    service_fee: string;
    trader_amount?: number; // unit_price × quantity — excludes resident service fee
    notes: string | null;
    pickup_deadline: string | null;
    picked_up_at: string | null;
    created_at: string;
    resident: { id: number; name: string; phone: string; };
    product: { id: number; name: string; unit: string; image_url: string | null; };
    payment?: { mpesa_transaction_id: string | null; status: string; paid_at: string | null; };
}

const STATUS_CONFIG = {
    pending:   { label: 'New',       color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200' },
    paid:      { label: 'Paid',      color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200' },
    ready:     { label: 'Ready',     color: 'text-green-700',  bg: 'bg-green-50',   border: 'border-green-200' },
    completed: { label: 'Completed', color: 'text-gray-600',   bg: 'bg-gray-50',    border: 'border-gray-200' },
    cancelled: { label: 'Cancelled', color: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-200' },
    expired:   { label: 'Expired',   color: 'text-orange-700', bg: 'bg-orange-50',  border: 'border-orange-200' },
};

function DetailRow({ icon, label, value, mono = false }: {
    icon: React.ReactNode; label: string; value: string | null | undefined; mono?: boolean;
}) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
            <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 text-text-secondary mt-0.5">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-0.5">{label}</p>
                <p className={`text-sm font-semibold text-text-primary ${mono ? 'font-mono' : ''}`}>{value}</p>
            </div>
        </div>
    );
}

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const { setPageTitle } = useUIStore();
    const [copied, setCopied] = React.useState(false);

    const { data: orderRes, isLoading, isError, error } = useQuery<ApiResponse<ReservationDetail>>({
        queryKey: ['trader-order', params.id],
        queryFn: () => api.get(`/reservations/${params.id}`),
        retry: 1,
    });

    const order = orderRes?.data;

    const { mutate: updateStatus, isPending } = useMutation({
        mutationFn: async (status: string) => {
            return api.patch(`/reservations/${params.id}/status`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trader-order', params.id] });
            queryClient.invalidateQueries({ queryKey: ['trader-orders'] });
        },
    });

    React.useEffect(() => {
        if (order) {
            setPageTitle(`Order #${order.reservation_code}`);
        } else {
            setPageTitle('Order Detail');
        }
    }, [order, setPageTitle]);

    const copyCode = () => {
        if (!order?.reservation_code) return;
        navigator.clipboard.writeText(order.reservation_code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isLoading) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse space-y-4">
                <div className="h-8 w-40 bg-gray-200 rounded-xl" />
                <div className="h-48 bg-gray-100 rounded-2xl" />
                <div className="h-32 bg-gray-100 rounded-2xl" />
            </div>
        );
    }

    if (isError || !order) {
        const errMsg = (error as any)?.message || (error as any)?.error || 'Could not load order details.';
        return (
            <div className="max-w-2xl mx-auto px-4 py-8">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-text-secondary mb-6 hover:text-text-primary transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-black text-red-800 mb-1">Failed to load order</p>
                        <p className="text-xs text-red-600">{errMsg}</p>
                        <button
                            onClick={() => router.back()}
                            className="mt-3 text-xs font-bold text-brand-600 underline underline-offset-2"
                        >
                            Go back to orders list
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const cfg = STATUS_CONFIG[order.status];
    const deadline = order.pickup_deadline ? new Date(order.pickup_deadline) : null;

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-text-secondary" />
                </button>
                <div className={`px-4 py-1.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border} text-xs font-black uppercase tracking-widest`}>
                    {cfg.label}
                </div>
            </div>

            {/* Order Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                            <Package className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-0.5">Order Code</p>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black text-green-950 font-mono tracking-tighter">#{order.reservation_code}</span>
                                <button onClick={copyCode} className="text-brand-600 hover:text-brand-700 transition-colors">
                                    <Copy className="w-4 h-4" />
                                </button>
                                {copied && <span className="text-[10px] font-bold text-success">Copied!</span>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <DetailRow icon={<User className="w-4 h-4" />} label="Resident" value={order.resident.name} />
                    <DetailRow icon={<Phone className="w-4 h-4" />} label="Phone" value={order.resident.phone} />
                    <DetailRow icon={<Package className="w-4 h-4" />} label="Product" value={`${order.quantity}x ${order.product.name}`} />
                    <DetailRow icon={<Clock className="w-4 h-4" />} label="Pickup Deadline" value={deadline ? deadline.toLocaleString() : 'No deadline'} />
                    <DetailRow icon={<MessageSquare className="w-4 h-4" />} label="Notes" value={order.notes || 'No notes provided'} />
                    
                    <div className="pt-4 mt-4 border-t border-gray-50 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-text-secondary">Amount Received</p>
                            <p className="text-[10px] text-text-muted font-medium">{order.quantity} × KES {parseFloat(order.unit_price).toFixed(2)}</p>
                        </div>
                        <p className="text-2xl font-black text-green-950">
                            KES {(order.trader_amount ?? parseFloat(order.unit_price) * order.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            {(() => {
                // A delivery order that a rider has actively accepted — trader hands off control
                const riderHasControl = order.delivery_option &&
                    order.delivery_status &&
                    ['assigned', 'picked_up', 'in_transit'].includes(order.delivery_status);

                const riderDelivered = order.delivery_option &&
                    order.delivery_status === 'delivered';

                if (riderHasControl) {
                    return (
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                            <Truck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-black text-blue-800">Rider In Control</p>
                                <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">
                                    A delivery rider has accepted and is handling this order. You will be notified automatically once the delivery is completed.
                                </p>
                            </div>
                        </div>
                    );
                }

                if (riderDelivered) {
                    return (
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
                            <Info className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-black text-green-800">Delivered by Rider</p>
                                <p className="text-xs text-green-600 mt-0.5">This order was successfully delivered by a rider.</p>
                            </div>
                        </div>
                    );
                }

                return (
                    <div className="grid grid-cols-1 gap-3">
                        {order.status === 'paid' && (
                            <button
                                onClick={() => updateStatus('ready')}
                                disabled={isPending}
                                className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black text-base shadow-lg shadow-brand-900/10 hover:bg-brand-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isPending ? 'Updating...' : 'Mark as Ready for Pickup'}
                            </button>
                        )}
                        {order.status === 'ready' && !order.delivery_option && (
                            <button
                                onClick={() => updateStatus('completed')}
                                disabled={isPending}
                                className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-base shadow-lg shadow-green-900/10 hover:bg-green-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isPending ? 'Updating...' : 'Confirm Handover / Completed'}
                            </button>
                        )}
                        {order.status === 'ready' && order.delivery_option && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                                <Truck className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-black text-amber-800">Awaiting Rider</p>
                                    <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
                                        This order is in the delivery pool. A rider will accept it shortly.
                                    </p>
                                </div>
                            </div>
                        )}
                        {['pending', 'paid', 'ready'].includes(order.status) && (
                            <button
                                onClick={() => updateStatus('cancelled')}
                                disabled={isPending}
                                className="w-full py-4 border border-red-200 text-red-600 rounded-2xl font-bold text-sm hover:bg-red-50 transition-colors"
                            >
                                Cancel Order
                            </button>
                        )}
                    </div>
                );
            })()}
        </div>
    );
}

'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Phone, Package, CheckCircle2, Clock,
    AlertTriangle, Copy, MapPin, User, CreditCard, MessageSquare
} from 'lucide-react';
import api from '@/lib/api';
import { ApiResponse } from '@/types';
import Link from 'next/link';

import { useUIStore } from '@/store/uiStore';
import { useTranslation } from '@/hooks/useTranslation';

interface ReservationDetail {
    id: number;
    reservation_code: string;
    status: 'pending' | 'paid' | 'ready' | 'completed' | 'cancelled' | 'expired';
    quantity: number;
    unit_price: string;
    total_amount: string;
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

    const { data: order, isLoading } = useQuery({
        queryKey: ['trader-order', params.id],
        queryFn: async () => {
            const res = await api.get<never, ApiResponse<ReservationDetail>>(`/reservations/${params.id}`);
            return res.data;
        },
    });

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
            setPageTitle(`${t('common.order')} #${order.reservation_code}`);
        } else {
            setPageTitle(t('common.order_detail') || 'Order Detail');
        }
    }, [order, setPageTitle, t]);

    const copyCode = () => {
        if (!order?.reservation_code) return;
        navigator.clipboard.writeText(order.reservation_code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isLoading || !order) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse space-y-4">
                <div className="h-8 w-40 bg-gray-200 rounded-xl" />
                <div className="h-48 bg-gray-100 rounded-2xl" />
                <div className="h-32 bg-gray-100 rounded-2xl" />
            </div>
        );
    }

    const cfg = STATUS_CONFIG[order.status];
    const deadline = order.pickup_deadline ? new Date(order.pickup_deadline) : null;
    const isOverdue = deadline && deadline < new Date();

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
            {/* ... content ... */}
        </div>
    );
}
}

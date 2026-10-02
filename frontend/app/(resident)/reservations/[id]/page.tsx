'use client';

/**
 * Reservation detail page.
 *
 * Opens a WebSocket to the Go_Gateway for rider position updates ONLY when the
 * reservation has an active Boda Rider delivery in progress. Closes the socket
 * when the delivery is completed or the component unmounts.
 *
 * Requirements: 11.1
 */

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    MapPin,
    Package,
    Clock,
    CheckCircle2,
    Loader2,
    Radio,
    Bike,
} from 'lucide-react';
import { useRiderTracking } from '@/hooks/useRiderTracking';
import api from '@/lib/api';
import { ApiResponse } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Reservation {
    id: number;
    reservation_code: string;
    status: 'pending' | 'paid' | 'ready' | 'completed' | 'cancelled' | 'expired';
    total_amount: string;
    quantity: number;
    unit_price: string;
    pickup_deadline: string | null;
    picked_up_at: string | null;
    delivery_type?: 'pickup' | 'rider';
    assigned_rider_id?: string | null;
    product: {
        id: number;
        name: string;
        unit: string;
        image_url?: string;
    };
    trader: {
        id: number;
        business_name: string;
        stall_number?: string;
    };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A delivery is "active" when the reservation is paid/ready AND a rider is
 *  assigned. The WebSocket should be open during this window only. */
function isActiveRiderDelivery(reservation: Reservation): boolean {
    return (
        reservation.delivery_type === 'rider' &&
        !!reservation.assigned_rider_id &&
        ['paid', 'ready'].includes(reservation.status)
    );
}

function statusLabel(status: Reservation['status']): string {
    const map: Record<Reservation['status'], string> = {
        pending: 'Awaiting Payment',
        paid: 'Paid — Preparing',
        ready: 'Ready for Pickup / Delivery',
        completed: 'Completed',
        cancelled: 'Cancelled',
        expired: 'Expired',
    };
    return map[status] ?? status;
}

function statusColor(status: Reservation['status']): string {
    const map: Record<Reservation['status'], string> = {
        pending: 'text-amber-600 bg-amber-50',
        paid: 'text-blue-600 bg-blue-50',
        ready: 'text-green-600 bg-green-50',
        completed: 'text-green-700 bg-green-100',
        cancelled: 'text-red-600 bg-red-50',
        expired: 'text-neutral-500 bg-neutral-100',
    };
    return map[status] ?? 'text-neutral-600 bg-neutral-50';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReservationDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [reservation, setReservation] = useState<Reservation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Only pass the rider ID when there is an active delivery; null otherwise
    // closes the WebSocket inside useRiderTracking.
    const activeRiderId =
        reservation && isActiveRiderDelivery(reservation)
            ? (reservation.assigned_rider_id ?? null)
            : null;

    const { position, isConnected, isTrackingUnavailable } =
        useRiderTracking(activeRiderId);

    // ── Fetch reservation ──────────────────────────────────────────────────
    useEffect(() => {
        if (!id) return;

        setIsLoading(true);
        api.get<ApiResponse<Reservation>>(`/reservations/${id}`)
            .then((res) => {
                setReservation(res.data.data);
            })
            .catch(() => {
                setError('Could not load reservation. Please check your connection.');
            })
            .finally(() => setIsLoading(false));
    }, [id]);

    // ── Loading ────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-brand-600" size={32} />
            </div>
        );
    }

    if (error || !reservation) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
                <p className="text-red-500 font-bold text-center">{error ?? 'Reservation not found.'}</p>
                <button
                    onClick={() => router.back()}
                    className="px-6 py-3 bg-brand-600 text-white rounded-2xl font-black text-sm"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const hasActiveRider = isActiveRiderDelivery(reservation);

    return (
        <div className="min-h-screen bg-neutral-50 pb-24">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-neutral-100 px-4 py-4 flex items-center gap-3">
                <button
                    aria-label="Go back"
                    onClick={() => router.back()}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-neutral-100 transition-colors"
                >
                    <ArrowLeft size={20} className="text-green-950" />
                </button>
                <h1 className="font-black text-green-950 text-lg">Reservation Detail</h1>
            </div>

            <div className="px-4 py-6 space-y-4 max-w-xl mx-auto">
                {/* Reservation code card */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[2rem] p-6 border border-neutral-100 shadow-sm"
                >
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">
                        Reservation Code
                    </p>
                    <h2 className="text-3xl font-black text-green-950 font-mono tracking-tight">
                        {reservation.reservation_code}
                    </h2>

                    <div className="mt-4 flex items-center gap-2">
                        <span
                            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${statusColor(reservation.status)}`}
                        >
                            {statusLabel(reservation.status)}
                        </span>
                    </div>
                </motion.div>

                {/* Product & trader */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white rounded-[2rem] p-6 border border-neutral-100 shadow-sm space-y-3"
                >
                    <div className="flex items-center gap-2 text-text-muted">
                        <Package size={16} />
                        <span className="text-xs font-black uppercase tracking-widest">Order Details</span>
                    </div>
                    <div className="space-y-2">
                        <p className="font-black text-green-950 text-lg">{reservation.product.name}</p>
                        <p className="text-sm text-text-secondary">
                            {reservation.quantity} × KES {reservation.unit_price} /{reservation.product.unit}
                        </p>
                        <p className="text-base font-black text-green-950">
                            Total: KES {reservation.total_amount}
                        </p>
                    </div>
                    <div className="pt-2 border-t border-neutral-100 flex items-center gap-2">
                        <MapPin size={14} className="text-brand-600" />
                        <span className="text-sm text-text-secondary">
                            {reservation.trader.business_name}
                            {reservation.trader.stall_number
                                ? ` · Stall ${reservation.trader.stall_number}`
                                : ''}
                        </span>
                    </div>
                </motion.div>

                {/* Pickup deadline */}
                {reservation.pickup_deadline && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-amber-50 rounded-[2rem] p-5 border border-amber-100 flex items-center gap-3"
                    >
                        <Clock size={18} className="text-amber-600 shrink-0" />
                        <div>
                            <p className="text-xs font-black text-amber-700 uppercase tracking-widest">
                                {reservation.delivery_type === 'rider' ? 'Delivery by' : 'Collect by'}
                            </p>
                            <p className="text-sm font-bold text-amber-900">
                                {new Date(reservation.pickup_deadline).toLocaleString()}
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* ── Rider tracking section ─────────────────────────────────── */}
                {hasActiveRider && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-white rounded-[2rem] p-6 border border-neutral-100 shadow-sm space-y-3"
                    >
                        <div className="flex items-center gap-2">
                            <Bike size={16} className="text-brand-600" />
                            <span className="text-xs font-black uppercase tracking-widest text-text-muted">
                                Live Rider Tracking
                            </span>
                            {/* Connection indicator */}
                            <span
                                aria-label={isConnected ? 'Connected' : 'Disconnected'}
                                className={`ml-auto w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-neutral-300'}`}
                            />
                        </div>

                        {isTrackingUnavailable ? (
                            /* Tracking unavailable banner — Requirement 11.4 */
                            <div
                                role="status"
                                aria-live="polite"
                                className="flex items-center gap-3 bg-amber-50 rounded-2xl px-4 py-3 border border-amber-100"
                            >
                                <Radio size={16} className="text-amber-500 shrink-0 animate-pulse" />
                                <p className="text-xs font-bold text-amber-800">
                                    Live tracking temporarily unavailable
                                </p>
                            </div>
                        ) : position ? (
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-green-950">
                                    Rider is on the way
                                </p>
                                <p className="text-xs text-text-muted font-mono">
                                    {/* Coordinate display for debugging; replace with map widget if needed */}
                                    Lon {position[0].toFixed(4)}, Lat {position[1].toFixed(4)}
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-text-muted">
                                <Loader2 size={14} className="animate-spin" />
                                <p className="text-xs font-bold">Waiting for rider position…</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Completed state */}
                {reservation.status === 'completed' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-50 rounded-[2rem] p-6 border border-green-100 flex items-center gap-4"
                    >
                        <CheckCircle2 size={32} className="text-green-600 shrink-0" />
                        <div>
                            <p className="font-black text-green-900">Order Completed</p>
                            {reservation.picked_up_at && (
                                <p className="text-xs text-green-700 mt-0.5">
                                    {new Date(reservation.picked_up_at).toLocaleString()}
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

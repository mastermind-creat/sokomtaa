'use client';

import { useState, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { ApiResponse, PayPalCreateOrderResponse, PayPalPaymentStatus } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

export type PayPalStatus =
    | 'idle'
    | 'creating'
    | 'awaiting_approval'
    | 'capturing'
    | 'polling'
    | 'completed'
    | 'failed'
    | 'timeout';

export interface UsePayPalReturn {
    status: PayPalStatus;
    error: string | null;
    orderId: string | null;
    approveUrl: string | null;
    amountKes: number | null;
    amountUsd: number | null;
    createOrder: (reservationIds: number[]) => Promise<void>;
    captureOrder: (orderId: string) => Promise<void>;
    pollStatus: (orderId: string) => void;
    stopPolling: () => void;
    reset: () => void;
}

// Bilingual error messages keyed by API error code
const ERROR_MESSAGES: Record<string, string> = {
    PAYMENT_FAILED: 'Malipo ya PayPal hayakufanikiwa. Jaribu tena. / PayPal payment failed. Please try again.',
    VALIDATION_ERROR: 'Hifadhi moja au zaidi hazipatikani. / One or more reservations are unavailable.',
    UNAUTHENTICATED: 'Tafadhali ingia kwanza. / Please log in first.',
    NOT_FOUND: 'Malipo hayapatikani. / Payment record not found.',
    SERVER_ERROR: 'Hitilafu imetokea. Jaribu tena. / Something went wrong. Try again.',
};

const MAX_POLL_INTERVALS = 100; // 100 × 3 s = 300 s (5 minutes)
const POLL_INTERVAL_MS = 3000;

function resolveErrorMessage(err: unknown): string {
    const code = (err as { code?: string })?.code;
    const message = (err as { message?: string })?.message;
    if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
    if (message) return message;
    return ERROR_MESSAGES.SERVER_ERROR;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePayPal(): UsePayPalReturn {
    const [status, setStatus] = useState<PayPalStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [approveUrl, setApproveUrl] = useState<string | null>(null);
    const [amountKes, setAmountKes] = useState<number | null>(null);
    const [amountUsd, setAmountUsd] = useState<number | null>(null);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pollCountRef = useRef(0);

    // ── stopPolling ─────────────────────────────────────────────────────────────
    const stopPolling = useCallback(() => {
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        pollCountRef.current = 0;
    }, []);

    // ── reset ───────────────────────────────────────────────────────────────────
    const reset = useCallback(() => {
        stopPolling();
        setStatus('idle');
        setError(null);
        setOrderId(null);
        setApproveUrl(null);
        setAmountKes(null);
        setAmountUsd(null);
    }, [stopPolling]);

    // ── pollStatus ──────────────────────────────────────────────────────────────
    const pollStatus = useCallback((id: string) => {
        stopPolling();
        pollCountRef.current = 0;
        setStatus('polling');

        intervalRef.current = setInterval(async () => {
            pollCountRef.current += 1;

            // Timeout after MAX_POLL_INTERVALS (5 minutes)
            if (pollCountRef.current > MAX_POLL_INTERVALS) {
                stopPolling();
                setStatus('timeout');
                return;
            }

            try {
                const res = await api.get<ApiResponse<PayPalPaymentStatus>>(
                    `/payments/paypal/status/${id}`
                );
                const data: PayPalPaymentStatus = (res as unknown as ApiResponse<PayPalPaymentStatus>).data;

                if (data.status === 'completed') {
                    stopPolling();
                    setStatus('completed');
                } else if (data.status === 'failed') {
                    stopPolling();
                    setStatus('failed');
                    setError(ERROR_MESSAGES.PAYMENT_FAILED);
                }
                // 'pending' — keep polling
            } catch {
                // Network blip — keep polling, don't abort
            }
        }, POLL_INTERVAL_MS);
    }, [stopPolling]);

    // ── captureOrder ────────────────────────────────────────────────────────────
    const captureOrder = useCallback(async (id: string) => {
        setStatus('capturing');
        setError(null);

        try {
            await api.post('/payments/paypal/capture-order', { order_id: id });
            // After capture, poll until backend confirms completed
            pollStatus(id);
        } catch (err) {
            setStatus('failed');
            setError(resolveErrorMessage(err));
        }
    }, [pollStatus]);

    // ── createOrder ─────────────────────────────────────────────────────────────
    const createOrder = useCallback(async (reservationIds: number[]) => {
        setStatus('creating');
        setError(null);

        try {
            const res = await api.post<ApiResponse<PayPalCreateOrderResponse>>(
                '/payments/paypal/create-order',
                { reservation_ids: reservationIds, currency: 'KES' }
            );
            const data: PayPalCreateOrderResponse = (res as unknown as ApiResponse<PayPalCreateOrderResponse>).data;

            setOrderId(data.order_id);
            setApproveUrl(data.approve_url);
            setAmountKes(data.amount_kes);
            setAmountUsd(data.amount_usd);
            setStatus('awaiting_approval');
        } catch (err) {
            setStatus('failed');
            setError(resolveErrorMessage(err));
        }
    }, []);

    return {
        status,
        error,
        orderId,
        approveUrl,
        amountKes,
        amountUsd,
        createOrder,
        captureOrder,
        pollStatus,
        stopPolling,
        reset,
    };
}

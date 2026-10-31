'use client';

import { useState, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { ApiResponse } from '@/types';

type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

interface MpesaStatusResponse {
    status: PaymentStatus;
    mpesa_transaction_id?: string;
    amount: string;
    paid_at?: string;
}

export const useMpesa = () => {
    const [isPolling, setIsPolling] = useState(false);
    const [status, setStatus] = useState<PaymentStatus | null>(null);
    const [error, setError] = useState<string | null>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const stopPolling = useCallback(() => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        setIsPolling(false);
    }, []);

    const pollStatus = useCallback(async (
        checkoutRequestId: string,
        onComplete?: (status: PaymentStatus) => void
    ) => {
        setIsPolling(true);
        setStatus('pending');
        setError(null);

        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

        let attempts = 0;
        const maxAttempts = 20; // ~1 minute (3s intervals)

        pollIntervalRef.current = setInterval(async () => {
            attempts++;

            try {
                const response = await api.get<ApiResponse<MpesaStatusResponse>>(
                    `/payments/mpesa/status/${checkoutRequestId}`
                );
                const currentStatus = response.data.status;

                if (currentStatus === 'completed' || currentStatus === 'failed') {
                    // Update state first, then stop polling, then call callback
                    setStatus(currentStatus);
                    stopPolling();
                    onComplete?.(currentStatus);
                    return;
                }
            } catch (err) {
                console.error('Polling error:', err);
            }

            if (attempts >= maxAttempts) {
                setError('TIMED OUT. If you paid, please check your orders in a moment.');
                stopPolling();
                onComplete?.('failed');
            }
        }, 3000);
    }, [stopPolling]);

    const initiateStk = async (
        phoneNumber: string,
        type: 'reservation' | 'market_fee' | 'wallet_topup' | 'product_boost',
        targetIdOrIds: number | number[],
        onComplete?: (status: PaymentStatus) => void
    ) => {
        setIsPolling(true);
        setError(null);
        setStatus(null);

        try {
            const payload: Record<string, unknown> = {
                phone_number: phoneNumber,
                type,
            };

            if (type === 'reservation') {
                // Always send as array so the backend sums exactly the intended reservations
                payload.target_ids = Array.isArray(targetIdOrIds) ? targetIdOrIds : [targetIdOrIds];
            } else if (Array.isArray(targetIdOrIds)) {
                payload.target_ids = targetIdOrIds;
            } else {
                payload.target_id = targetIdOrIds;
            }

            const response = await api.post<ApiResponse<{ checkout_request_id: string }>>(
                '/payments/mpesa/stkpush',
                payload
            );

            const checkoutId = (response as any).data.checkout_request_id;
            pollStatus(checkoutId, onComplete);
            return checkoutId;
        } catch (err: unknown) {
            const apiError = err as { response?: { data?: { message?: string } } };
            setError(apiError.response?.data?.message || 'Failed to send payment request.');
            setIsPolling(false);
            throw err;
        }
    };

    return {
        initiateStk,
        pollStatus,
        isPolling,
        status,
        error,
        stopPolling,
    };
};

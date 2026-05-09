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

    const pollStatus = useCallback(async (checkoutRequestId: string) => {
        setIsPolling(true);
        setStatus('pending');
        setError(null);

        // Clear existing interval if any
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

        let attempts = 0;
        const maxAttempts = 20; // ~1 minute of polling (3s intervals)

        pollIntervalRef.current = setInterval(async () => {
            attempts++;
            
            try {
                const response = await api.get<ApiResponse<MpesaStatusResponse>>(`/payments/mpesa/status/${checkoutRequestId}`);
                const currentStatus = response.data.status;

                if (currentStatus === 'completed' || currentStatus === 'failed') {
                    setStatus(currentStatus);
                    stopPolling();
                }

                if (attempts >= maxAttempts) {
                    setError('TIMED OUT. If you paid, please check your orders in a moment.');
                    stopPolling();
                }
            } catch (err) {
                console.error('Polling error:', err);
                // We continue polling on error unless it's a 404
            }
        }, 3000);
    }, [stopPolling]);
 
    const initiateStk = async (phoneNumber: string, type: 'reservation' | 'market_fee', targetId: number) => {
        setIsPolling(true);
        setError(null);
        try {
            const response = await api.post<ApiResponse<{ checkout_request_id: string }>>('/payments/mpesa/stkpush', {
                phone_number: phoneNumber,
                type,
                target_id: targetId
            });
            
            const checkoutId = response.data.checkout_request_id;
            pollStatus(checkoutId);
            return checkoutId;
        } catch (err: unknown) {
            const apiError = err as { response?: { data?: { message?: string } } };
            setError(apiError.response?.data?.message || 'Failed to send request');
            setIsPolling(false);
            throw err;
        }
    };

    return {
        initiateStk,
        isPolling,
        status,
        error,
        stopPolling
    };
};

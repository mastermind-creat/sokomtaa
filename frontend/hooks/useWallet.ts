'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse } from '@/types';

export interface Wallet {
    id: number;
    trader_id?: number;
    balance: number;
    currency: string;
    is_active: boolean;
    frequency?: 'daily' | 'weekly' | 'monthly';
    last_deduction?: string;
    total_credits?: number;
    total_debits?: number;
    pending_withdrawals?: number;
    mpesa_number?: string;
}

export interface WalletTransaction {
    id: number;
    wallet_id: number;
    amount: number;
    type: 'credit' | 'debit';
    status: 'completed' | 'pending' | 'failed';
    balance_after?: number;
    description: string;
    reference_type: string | null;
    reference_id: string | null;
    created_at: string;
}

export function useWallet() {
    const queryClient = useQueryClient();

    const { data: walletData, isLoading: walletLoading } = useQuery<ApiResponse<Wallet>>({
        queryKey: ['wallet'],
        queryFn: () => api.get('/trader/wallet'),
    });

    const { data: transactionsData, isLoading: transactionsLoading } = useQuery<ApiResponse<{ data: WalletTransaction[] }>>({
        queryKey: ['wallet-transactions'],
        queryFn: () => api.get('/trader/wallet/transactions'),
    });

    const updateFrequency = useMutation({
        mutationFn: (frequency: 'daily' | 'weekly' | 'monthly') =>
            api.post('/trader/wallet/frequency', { frequency }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wallet'] });
        }
    });

    const requestWithdrawal = useMutation({
        mutationFn: (data: { amount: number; mpesa_phone: string }) =>
            api.post('/trader/wallet/withdraw', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wallet'] });
            queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
        }
    });

    return {
        wallet: walletData?.data,
        transactions: transactionsData?.data?.data || [],
        walletLoading,
        transactionsLoading,
        updateFrequency,
        requestWithdrawal,
    };
}

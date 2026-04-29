'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse } from '@/types';

export interface Wallet {
    id: number;
    trader_id: number;
    balance: number;
    currency: string;
    is_active: boolean;
    frequency?: 'daily' | 'weekly';
    last_deduction?: string;
}

export interface WalletTransaction {
    id: number;
    wallet_id: number;
    amount: number;
    type: 'credit' | 'debit';
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
        mutationFn: (frequency: 'daily' | 'weekly') => 
            api.post('/trader/wallet/frequency', { frequency }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wallet'] });
        }
    });

    return {
        wallet: walletData?.data,
        transactions: transactionsData?.data?.data || [],
        walletLoading,
        transactionsLoading,
        updateFrequency
    };
}

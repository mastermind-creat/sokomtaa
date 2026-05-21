import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export interface RiderWalletTransaction {
    id: number;
    amount: number;
    fee: number;
    net_amount: number;
    mpesa_number: string;
    mpesa_conversation_id: string | null;
    mpesa_transaction_id: string | null;
    status: 'processing' | 'completed' | 'failed';
    failure_reason: string | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}

export function useRiderWallet() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    // The backend doesn't have a /delivery/wallet endpoint currently, but we can rely on 
    // the user.deliveryProfile.earnings_balance from the general /delivery/profile response or use AuthStore.
    // However, to keep it simple, we just get history and use the profile from the API for balance.

    const { data: profileData, isLoading: profileLoading } = useQuery({
        queryKey: ['deliveryProfile'],
        queryFn: async () => {
            const res = await api.get('/delivery/profile');
            return res.data?.data || null;
        },
        enabled: !!user && user.role === 'delivery',
        refetchInterval: 15000,
    });

    const { data: withdrawalsData, isLoading: withdrawalsLoading } = useQuery({
        queryKey: ['riderWithdrawals'],
        queryFn: async () => {
            const res = await api.get('/delivery/wallet/withdrawals');
            return res.data?.data?.data || [];
        },
        enabled: !!user && user.role === 'delivery',
    });

    const requestWithdrawal = useMutation({
        mutationFn: async (data: { amount: number; mpesa_number?: string }) => {
            const res = await api.post('/delivery/wallet/withdraw', data);
            return res.data;
        },
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['riderWithdrawals'] });
            queryClient.invalidateQueries({ queryKey: ['deliveryProfile'] });
            queryClient.invalidateQueries({ queryKey: ['auth_user'] });
            toast.success(res.message || 'Withdrawal requested successfully');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to request withdrawal');
            throw err.response?.data;
        }
    });

    return {
        profile: profileData,
        withdrawals: withdrawalsData || [],
        isLoading: profileLoading || withdrawalsLoading,
        requestWithdrawal,
    };
}

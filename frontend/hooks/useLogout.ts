'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUIStore } from '@/store/uiStore';

export const useLogout = () => {
    const router = useRouter();
    const { token, logout: logoutStore } = useAuthStore.getState();
    const queryClient = useQueryClient();
    const { setIsGlobalLoading } = useUIStore();

    const logout = async () => {
        // 1. Capture token before clearing state
        const authToken = token || localStorage.getItem('sokomtaa_token');

        // 2. Immediate UI feedback
        setIsGlobalLoading(true);

        // 3. Clear all local state (Instant)
        logoutStore();
        queryClient.clear();
        localStorage.removeItem('sokomtaa_token');

        // 4. Redirect immediately
        router.replace('/login');

        // 5. Cleanup background tasks
        setIsGlobalLoading(false);

        // 6. Background backend revocation (don't await)
        if (authToken) {
            api.post('/auth/logout', {}, {
                headers: { Authorization: `Bearer ${authToken}` }
            }).catch(() => {
                // Silently fail if revocation fails (token might be already invalid)
            });
        }
    };

    return { logout };
};

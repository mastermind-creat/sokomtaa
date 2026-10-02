'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { Loader2 } from 'lucide-react';

export default function ResidentLayout({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        } else if (user?.role !== 'resident' && user?.role !== 'delivery') {
            if (user?.role === 'trader') router.push('/trader/dashboard');
            else if (user?.role === 'admin') router.push('/admin/dashboard');
            else router.push('/');
        }
    }, [user, isAuthenticated, router]);

    if (!isAuthenticated || (user?.role !== 'resident' && user?.role !== 'delivery')) {
        return (
            <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
                <Loader2 size={40} className="animate-spin text-brand-600" />
            </div>
        );
    }

    return (
        <DashboardLayout title="My Dashboard">
            {children}
        </DashboardLayout>
    );
}

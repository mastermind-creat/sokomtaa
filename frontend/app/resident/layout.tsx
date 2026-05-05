'use client';

import React from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useTranslation } from '@/hooks/useTranslation';

export default function ResidentLayout({ children }: { children: React.ReactNode }) {
    const { t } = useTranslation();
    
    return (
        <DashboardLayout title="My Dashboard">
            {children}
        </DashboardLayout>
    );
}

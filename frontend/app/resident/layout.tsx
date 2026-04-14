'use client';

import React from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useTranslation } from '@/hooks/useTranslation';

export default function ResidentLayout({ children }: { children: React.ReactNode }) {
    const { t } = useTranslation();
    
    return (
        <DashboardLayout title={t('res.my_market') || 'Soko Mtaa'}>
            {children}
        </DashboardLayout>
    );
}

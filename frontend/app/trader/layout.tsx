'use client';

import React from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useTranslation } from '@/hooks/useTranslation';

export default function TraderLayout({ children }: { children: React.ReactNode }) {
    const { t } = useTranslation();
    
    return (
        <DashboardLayout>
            {children}
        </DashboardLayout>
    );
}

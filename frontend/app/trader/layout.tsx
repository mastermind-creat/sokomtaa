'use client';

import React from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';

export default function TraderLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardLayout>
            {children}
        </DashboardLayout>
    );
}

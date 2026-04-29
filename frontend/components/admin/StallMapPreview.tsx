'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse } from '@/types';
import MarketSchematicMap, { Stall } from '../map/MarketSchematicMap';

interface StallMapPreviewProps {
    marketId?: number | null;
    isAdmin?: boolean;
}

export default function StallMapPreview({ marketId, isAdmin }: StallMapPreviewProps) {
    const { data: stalls } = useQuery<Stall[]>({
        queryKey: ['admin-stalls-preview', marketId],
        queryFn: async () => {
            const res = await api.get<never, ApiResponse<Stall[]>>('/admin/stalls', {
                params: { market_id: marketId }
            });
            return res.data ?? [];
        },
        enabled: !isAdmin || !!marketId
    });

    return (
        <div className="h-[500px] w-full">
            <MarketSchematicMap
                stalls={stalls ?? []}
                onStallClick={() => {}} // No-op in preview mode; full interaction on /admin/map
            />
        </div>
    );
}

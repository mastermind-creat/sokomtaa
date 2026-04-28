'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse } from '@/types';
import MarketSchematicMap, { Stall } from '../map/MarketSchematicMap';

export default function StallMapPreview() {
    const { data: stalls } = useQuery<Stall[]>({
        queryKey: ['admin-stalls-preview'],
        queryFn: async () => {
            const res = await api.get<any, ApiResponse<Stall[]>>('/admin/stalls');
            return res.data ?? [];
        }
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

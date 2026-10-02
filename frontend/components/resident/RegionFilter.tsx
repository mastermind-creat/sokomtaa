"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, Region } from '@/types';
import { MapPin, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

interface RegionFilterProps {
    onSelectRegion: (regionId: number | null) => void;
    selectedRegionId: number | null;
}

export default function RegionFilter({ onSelectRegion, selectedRegionId }: RegionFilterProps) {
    const { data: regionData, isLoading } = useQuery<ApiResponse<Region[]>>({
        queryKey: ['public-regions'],
        queryFn: () => api.get('/regions'),
    });

    const regions = Array.isArray(regionData) ? regionData : (regionData?.data || []);

    if (isLoading) {
        return (
            <div className="flex gap-4 overflow-x-auto px-6 py-2 no-scrollbar animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-2 min-w-[100px]">
                        <div className="w-full h-12 bg-neutral-100 rounded-2xl" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex gap-4 overflow-x-auto px-6 py-2 no-scrollbar snap-x snap-mandatory">
            <button 
                onClick={() => onSelectRegion(null)}
                className={`flex items-center gap-2 px-6 h-12 rounded-2xl transition-all snap-center whitespace-nowrap border-2 ${
                    selectedRegionId === null 
                        ? 'bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-900/20' 
                        : 'bg-white border-gray-100 text-text-secondary hover:border-brand-300'
                }`}
            >
                <Globe size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">All Regions</span>
            </button>

            {regions.map((region) => (
                <button 
                    key={region.id}
                    onClick={() => onSelectRegion(region.id)}
                    className={`flex items-center gap-2 px-6 h-12 rounded-2xl transition-all snap-center whitespace-nowrap border-2 ${
                        selectedRegionId === region.id 
                            ? 'bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-900/20' 
                            : 'bg-white border-gray-100 text-text-secondary hover:border-brand-300'
                    }`}
                >
                    <MapPin size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{region.name}</span>
                </button>
            ))}
        </div>
    );
}

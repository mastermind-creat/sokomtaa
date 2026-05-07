'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductSkeleton() {
    return (
        <div className="bg-white rounded-[2rem] border border-neutral-100 p-4 space-y-4 shadow-sm animate-pulse">
            <div className="relative aspect-square w-full rounded-[1.5rem] bg-neutral-100 overflow-hidden" />
            
            <div className="space-y-3 px-1">
                <div className="flex justify-between items-start gap-4">
                    <Skeleton className="h-6 w-3/4 rounded-lg" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                </div>
                
                <Skeleton className="h-4 w-1/3 rounded-md" />
                
                <div className="pt-2 flex justify-between items-end">
                    <div className="space-y-1">
                        <Skeleton className="h-3 w-8 rounded" />
                        <Skeleton className="h-6 w-16 rounded-lg" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-xl" />
                </div>
            </div>
        </div>
    );
}

'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
        label: string;
    };
    color: string;
    description?: string;
    variant?: 'full' | 'compact';
}

export function StatCard({ title, value, icon: Icon, trend, color, description, variant = 'full' }: StatCardProps) {
    const isCompact = variant === 'compact';

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={cn(
                "bg-white rounded-[1.5rem] shadow-sm border border-neutral-100 flex flex-col group transition-all h-full",
                isCompact ? "p-3 pb-4" : "p-6"
            )}
        >
            <div className={cn(
                "flex justify-between items-start",
                isCompact ? "mb-2" : "mb-4"
            )}>
                <div className={cn(
                    "flex items-center justify-center rounded-2xl shadow-lg transition-transform group-hover:scale-110",
                    isCompact ? "w-9 h-9" : "w-12 h-12",
                    color
                )}>
                    <Icon className="text-white" size={isCompact ? 18 : 24} />
                </div>
                {trend && !isCompact && (
                    <div className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                        trend.isPositive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                    )}>
                        <span>{trend.isPositive ? '↑' : '↓'} {trend.value}%</span>
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col">
                <p className={cn(
                    "text-text-muted font-black uppercase tracking-widest leading-tight truncate mb-1",
                    isCompact ? "text-[8px]" : "text-xs"
                )}>
                    {title}
                </p>
                <div className="flex items-baseline gap-2">
                    <h3 className={cn(
                        "font-black text-green-950 tracking-tighter truncate",
                        isCompact ? "text-lg" : "text-3xl"
                    )}>
                        {value}
                    </h3>
                </div>
                
                {!isCompact && description && (
                    <p className="text-text-secondary text-xs mt-2 font-medium line-clamp-2">{description}</p>
                )}
                
                {!isCompact && trend && (
                    <p className="text-[10px] text-text-muted mt-1 font-bold uppercase tracking-tighter">
                        {trend.label}
                    </p>
                )}
            </div>

            {!isCompact && (
                <div className="mt-4 pt-4 border-t border-neutral-50 flex justify-end">
                    <div className="h-1 bg-neutral-50 rounded-full flex-1 overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: trend ? `${Math.min(trend.value * 2, 100)}%` : '40%' }}
                            className={cn("h-full opacity-40", color)}
                        />
                    </div>
                </div>
            )}
        </motion.div>
    );
}

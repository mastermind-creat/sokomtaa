'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

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
}

export function StatCard({ title, value, icon: Icon, trend, color, description }: StatCardProps) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-full group transition-all"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} shadow-lg transition-transform group-hover:scale-110`}>
                    <Icon className="text-white" size={24} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        trend.isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                        <span>{trend.isPositive ? '↑' : '↓'} {trend.value}%</span>
                    </div>
                )}
            </div>

            <div>
                <p className="text-text-muted text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-black text-green-950 tracking-tight">{value}</h3>
                </div>
                {description && (
                    <p className="text-text-secondary text-xs mt-2 font-medium">{description}</p>
                )}
                {trend && (
                    <p className="text-[10px] text-text-muted mt-1 font-bold uppercase tracking-tighter">
                        {trend.label}
                    </p>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
                <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: '100%' }}
                    className="h-1 bg-gray-50 rounded-full overflow-hidden"
                >
                    <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: trend ? `${Math.min(trend.value * 2, 100)}%` : '40%' }}
                        className={`h-full ${color.replace('bg-', 'bg-opacity-40 ')}`}
                    />
                </motion.div>
            </div>
        </motion.div>
    );
}

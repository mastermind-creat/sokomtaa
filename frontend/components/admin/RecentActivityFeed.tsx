'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse } from '@/types';
import { 
    UserPlus, 
    AlertCircle, 
    CheckCircle, 
    ChevronRight,
    Clock,
    User,
    LucideIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActivityItem {
    id: string;
    type: string;
    title: string;
    description: string;
    user: string;
    time: string;
    status: string;
    icon: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
    UserPlus,
    AlertCircle,
    CheckCircle,
    User
};

export default function RecentActivityFeed() {
    const { data: activities, isLoading } = useQuery({
        queryKey: ['admin-activity'],
        queryFn: async () => {
            const res = await api.get<never, ApiResponse<ActivityItem[]>>('/admin/activity');
            return res.data;
        },
        refetchInterval: 30000 // Poll every 30 seconds
    });

    if (isLoading) {
        return (
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50 h-full min-h-[500px] flex flex-col">
                <div className="w-24 h-6 bg-gray-100 animate-pulse rounded-lg mb-8" />
                <div className="space-y-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex gap-4">
                            <div className="w-12 h-12 bg-gray-100 animate-pulse rounded-2xl" />
                            <div className="flex-1 space-y-2">
                                <div className="w-3/4 h-4 bg-gray-100 animate-pulse rounded-lg" />
                                <div className="w-1/2 h-3 bg-gray-100 animate-pulse rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2.5rem] p-7 lg:p-10 shadow-sm border border-gray-50 h-full flex flex-col sticky top-24">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-green-950 tracking-tight">Recent Activity</h3>
                <div className="px-3 py-1 bg-brand-50 rounded-full text-[10px] font-black uppercase tracking-widest text-brand-700">
                    Live Updates
                </div>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar max-h-[600px] pr-2">
                <AnimatePresence mode="popLayout">
                    {activities?.map((activity, index) => {
                        const IconComponent = ICON_MAP[activity.icon] || Clock;
                        return (
                            <motion.div
                                key={activity.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="group cursor-pointer"
                            >
                                <div className="flex gap-5 relative">
                                    {/* Line connector */}
                                    {index !== (activities?.length - 1) && (
                                        <div className="absolute left-[23.5px] top-12 bottom-[-24px] w-[1px] bg-gray-100 group-hover:bg-brand-100 transition-colors" />
                                    )}

                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110 shadow-sm ${
                                        activity.type === 'complaint_filed' ? 'bg-red-50 text-red-600' : 
                                        activity.type === 'fee_payment' ? 'bg-green-50 text-brand-600' : 
                                        'bg-brand-50 text-brand-700'
                                    }`}>
                                        <IconComponent size={20} strokeWidth={2.5} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-sm font-black text-green-950 truncate">{activity.title}</p>
                                            <span className="text-[10px] font-bold text-text-muted whitespace-nowrap ml-2">{activity.time}</span>
                                        </div>
                                        <p className="text-xs text-text-secondary font-medium leading-relaxed mb-1 line-clamp-1">
                                            {activity.description}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{activity.user}</span>
                                        </div>
                                    </div>

                                    <div className="hidden group-hover:flex items-center">
                                        <ChevronRight size={16} className="text-brand-500" />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            <button className="mt-8 w-full py-4 bg-gray-50 hover:bg-gray-100 rounded-2xl text-xs font-black uppercase tracking-[0.2em] text-text-secondary transition-all active:scale-[0.98]">
                View Full Audit Log
            </button>
        </div>
    );
}

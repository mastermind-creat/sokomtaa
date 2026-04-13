'use client';

import React from 'react';
import { Megaphone, Calendar, AlertTriangle, Info, Clock, Pin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { ApiResponse } from '@/types';

interface Notice {
    id: number;
    title: string;
    title_sw: string;
    content: string;
    content_sw: string;
    type: 'general' | 'event' | 'maintenance' | 'promotion' | 'urgent';
    is_pinned: boolean;
    created_at: string;
}

export default function NoticeFeed({ marketId }: { marketId: number }) {
    const { data: noticeData, isLoading } = useQuery<ApiResponse<any>>({
        queryKey: ['notices', marketId],
        queryFn: () => api.get('/notices', { params: { market_id: marketId } }),
        enabled: !!marketId,
    });

    const notices = noticeData?.data?.data || [];

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'urgent': return 'bg-color-error/10 text-color-error border-color-error/20';
            case 'maintenance': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'event': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-brand-50 text-brand-700 border-brand-100';
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'urgent': return <AlertTriangle size={16} />;
            case 'maintenance': return <Clock size={16} />;
            case 'event': return <Calendar size={16} />;
            default: return <Info size={16} />;
        }
    };

    if (isLoading || notices.length === 0) return null;

    return (
        <section className="px-6 mb-10 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
                <Megaphone size={20} className="text-brand-600" />
                <h2 className="text-xl text-green-900 font-black">Matangazo (Notices)</h2>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar snap-x">
                {notices.map((notice: Notice) => (
                    <motion.div 
                        key={notice.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-[85vw] max-w-sm shrink-0 snap-start relative"
                    >
                        <div className={`p-5 rounded-[32px] border-2 h-full shadow-lg ${getTypeStyles(notice.type)}`}>
                            {notice.is_pinned && (
                                <div className="absolute top-4 right-4 text-xs font-black uppercase tracking-widest flex items-center gap-1 opacity-60">
                                    <Pin size={12} /> Pinned
                                </div>
                            )}
                            
                            <div className="flex items-center gap-2 mb-3">
                                <span className="p-2 rounded-xl bg-white/40 border border-white/40">
                                    {getIcon(notice.type)}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                                    {notice.type}
                                </span>
                            </div>

                            <h3 className="font-black text-lg leading-tight mb-2 tracking-tight">
                                {notice.title_sw || notice.title}
                            </h3>
                            
                            <p className="text-sm font-medium leading-relaxed opacity-90 line-clamp-2">
                                {notice.content_sw || notice.content}
                            </p>

                            <div className="mt-4 flex items-center justify-between opacity-60">
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    {new Date(notice.created_at).toLocaleDateString()}
                                </span>
                                <button className="text-[10px] font-black uppercase tracking-widest underline decoration-2 underline-offset-4">
                                    Read More
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}

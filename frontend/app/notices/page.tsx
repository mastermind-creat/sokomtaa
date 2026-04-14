'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
    Bell, 
    Calendar, 
    AlertCircle, 
    Info, 
    Megaphone, 
    MapPin, 
    ChevronRight,
    Loader2,
    Pin,
    ArrowUpRight,
    Clock,
    User
} from 'lucide-react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { motion } from 'framer-motion';
import { ApiResponse } from '@/types';

interface Notice {
    id: number;
    title: string;
    title_sw?: string;
    content: string;
    content_sw?: string;
    type: 'general' | 'event' | 'maintenance' | 'promotion' | 'urgent';
    audience: string;
    expires_at?: string;
    is_pinned: boolean;
    created_at: string;
}

export default function NoticeBoardPage() {
    const { data: noticesData, isLoading } = useQuery<ApiResponse<{ data: Notice[] }>>({
        queryKey: ['notices'],
        queryFn: () => api.get('/notices', { params: { market_id: 1 } }), // Default market for now
    });

    const notices = noticesData?.data?.data || [];

    const getNoticeIcon = (type: string) => {
        switch (type) {
            case 'urgent': return <AlertCircle className="text-red-600" size={20} />;
            case 'event': return <Calendar className="text-blue-600" size={20} />;
            case 'maintenance': return <Info className="text-amber-600" size={20} />;
            default: return <Megaphone className="text-brand-600" size={20} />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'urgent': return 'bg-red-50 border-red-100 text-red-700';
            case 'event': return 'bg-blue-50 border-blue-100 text-blue-700';
            case 'maintenance': return 'bg-amber-50 border-amber-100 text-amber-700';
            default: return 'bg-brand-50 border-brand-100 text-brand-700';
        }
    };

    return (
        <DashboardLayout title="Matangazo (Notice Board)">
            <div className="space-y-6 pb-20">
                
                {/* 1. Hero Notice Preview (Pinned) */}
                {notices.filter(n => n.is_pinned).map(pinned => (
                    <div key={pinned.id} className="bg-green-950 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-brand-500 p-2 rounded-xl">
                                <Pin size={18} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-300">Taarifa ya Muhimu</span>
                        </div>
                        <h2 className="text-2xl font-black tracking-tight mb-3 leading-tight">{pinned.title}</h2>
                        <p className="text-sm text-brand-100 leading-relaxed font-medium line-clamp-3 opacity-90">
                            {pinned.content}
                        </p>
                        <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-brand-300">
                                <Clock size={12} />
                                Posted {new Date(pinned.created_at).toLocaleDateString()}
                            </div>
                            <button className="flex items-center gap-1.5 text-[10px] font-black uppercase text-brand-400">
                                SOMA ZAIDI <ArrowUpRight size={14} />
                            </button>
                        </div>
                    </div>
                ))}

                {/* 2. List Header */}
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-black uppercase tracking-widest text-green-950">Matangazo ya Soko</h3>
                    <div className="flex gap-2">
                        <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-text-muted border border-gray-100 shadow-sm">
                            <MapPin size={18} />
                        </button>
                    </div>
                </div>

                {/* 3. Notice List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="py-20 flex justify-center">
                            <Loader2 className="animate-spin text-brand-600" />
                        </div>
                    ) : notices.length > 0 ? (
                        notices.map((notice) => (
                            <motion.div 
                                key={notice.id}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-brand-sm group active:scale-[0.98] transition-all"
                            >
                                <div className="flex gap-5">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${getTypeColor(notice.type)}`}>
                                        {getNoticeIcon(notice.type)}
                                    </div>
                                    <div className="flex-1 space-y-2 py-1">
                                        <div className="flex items-center justify-between">
                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${getTypeColor(notice.type)}`}>
                                                {notice.type}
                                            </span>
                                            <div className="flex items-center gap-1 text-[9px] font-black text-text-muted uppercase">
                                                <User size={10} /> Market Admin
                                            </div>
                                        </div>
                                        <h4 className="font-black text-green-950 text-sm leading-tight">{notice.title}</h4>
                                        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                                            {notice.content}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-dashed border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-text-muted text-[10px] font-bold">
                                        <Clock size={12} />
                                        {new Date(notice.created_at).toLocaleDateString()}
                                    </div>
                                    <button className="text-[10px] font-black text-brand-600 uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                                        Soma (Read) <ChevronRight size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="py-20 text-center space-y-4 opacity-40">
                             <Megaphone size={48} className="mx-auto" />
                             <p className="text-xs font-black uppercase tracking-widest">Bado hakuna matangazo leo</p>
                        </div>
                    )}
                </div>

                {/* 4. Support Banner */}
                <div className="bg-blue-50 p-8 rounded-[3rem] border border-blue-100 flex items-center justify-between">
                    <div className="space-y-1">
                        <h4 className="text-lg font-black text-blue-950">Unahitaji Msaada?</h4>
                        <p className="text-[11px] text-blue-800 leading-relaxed font-bold uppercase tracking-tight">Kituo cha huduma kiko wazi saa 8am - 5pm</p>
                    </div>
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-blue-600 border border-blue-100">
                        <Bell size={24} className="animate-swing" />
                    </div>
                </div>
            </div>
            
            <style jsx global>{`
                @keyframes swing {
                    0%, 100% { transform: rotate(0deg); }
                    20% { transform: rotate(15deg); }
                    40% { transform: rotate(-10deg); }
                    60% { transform: rotate(5deg); }
                    80% { transform: rotate(-5deg); }
                }
                .animate-swing {
                    animation: swing 2s ease-in-out infinite;
                    transform-origin: top center;
                }
            `}</style>
        </DashboardLayout>
    );
}

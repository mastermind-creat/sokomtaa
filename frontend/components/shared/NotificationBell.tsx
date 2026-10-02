'use client';

import React from 'react';
import { Bell, BellDot, X, CheckCircle, Package, AlertTriangle, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiResponse } from '@/types';

interface Notification {
    id: number;
    title: string;
    body: string;
    type: 'reservation' | 'payment' | 'complaint' | string;
    is_read: boolean;
    created_at: string;
}

export default function NotificationBell() {
    const [isOpen, setIsOpen] = React.useState(false);
    const queryClient = useQueryClient();

    const { data: notifData } = useQuery<ApiResponse<{ data: Notification[] }>>({
        queryKey: ['notifications'],
        queryFn: () => api.get('/notifications'),
        refetchInterval: 30000, // Check every 30s
    });

    const markReadMutation = useMutation({
        mutationFn: (id: number) => api.patch(`/notifications/${id}/read`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });

    const notifications = notifData?.data?.data || [];
    const unreadCount = notifications.filter((n: Notification) => !n.is_read).length;

    const getIcon = (type: string) => {
        switch (type) {
            case 'reservation': return <Package className="text-brand-600" size={18} />;
            case 'payment': return <CheckCircle className="text-green-600" size={18} />;
            case 'complaint': return <AlertTriangle className="text-amber-600" size={18} />;
            default: return <AlertCircle className="text-blue-600" size={18} />;
        }
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 bg-white/80 backdrop-blur-md rounded-xl border border-border-default shadow-sm hover:bg-neutral-50 active:scale-95 transition-all"
                aria-label="Taarifa (Notifications)"
            >
                {unreadCount > 0 ? (
                    <BellDot className="text-brand-600 animate-[pulse_2s_infinite]" size={24} />
                ) : (
                    <Bell className="text-text-secondary" size={24} />
                )}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-color-error text-white text-[10px] font-black h-5 w-5 flex items-center justify-center rounded-full border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div 
                            key="notif-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] md:bg-transparent md:backdrop-blur-none z-[80]" 
                            onClick={() => setIsOpen(false)} 
                        />
                        <motion.div 
                            key="notif-dropdown"
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="fixed md:absolute inset-x-0 bottom-0 md:bottom-auto md:left-auto md:right-0 md:mt-3 w-full md:w-96 bg-white rounded-t-[2.5rem] md:rounded-3xl shadow-2xl border border-gray-100 z-[90] flex flex-col max-h-[80vh] md:max-h-[600px] overflow-hidden"
                        >
                            <div className="p-6 pb-4 bg-brand-600 text-white flex flex-col md:flex-row md:justify-between md:items-center shrink-0 z-10">
                                <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-3 md:hidden" />
                                <div className="flex justify-between items-center w-full">
                                    <h3 className="font-black tracking-tight text-lg">Notifications</h3>
                                    <button 
                                        onClick={() => setIsOpen(false)}
                                        className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                                        aria-label="Close"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto min-h-0 no-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-16 text-center text-text-muted">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Bell className="opacity-20" size={32} />
                                        </div>
                                        <p className="text-xs font-black uppercase tracking-[0.2em]">No new notifications</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-50">
                                        {notifications.map((n: Notification) => (
                                            <div 
                                                key={n.id} 
                                                className={`p-5 flex gap-4 hover:bg-gray-50 transition-colors cursor-pointer ${!n.is_read ? 'bg-brand-50/30' : ''}`}
                                                onClick={() => !n.is_read && markReadMutation.mutate(n.id)}
                                            >
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                                                    !n.is_read ? 'bg-white border border-brand-100' : 'bg-gray-50'
                                                }`}>
                                                    {getIcon(n.type)}
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className={`text-sm tracking-tight ${!n.is_read ? 'font-black text-green-950' : 'font-bold text-gray-700'}`}>
                                                            {n.title}
                                                        </p>
                                                        {!n.is_read && <div className="w-2 h-2 bg-brand-600 rounded-full" />}
                                                    </div>
                                                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                                                        {n.body}
                                                    </p>
                                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest pt-1">
                                                        {new Date(n.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {notifications.length > 0 && (
                                <div className="p-4 pb-6 md:pb-4 bg-gray-50 border-t border-gray-100 pb-[calc(16px+env(safe-area-inset-bottom))] shrink-0">
                                    <button className="w-full h-12 bg-white text-green-950 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm hover:bg-brand-50 transition-all">
                                        View All Activity
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

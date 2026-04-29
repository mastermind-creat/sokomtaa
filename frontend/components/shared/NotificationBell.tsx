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
                        <div 
                            key="notif-backdrop"
                            className="fixed inset-0 z-[80]" 
                            onClick={() => setIsOpen(false)} 
                        />
                        <motion.div 
                            key="notif-dropdown"
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-border-disabled z-[90] overflow-hidden"
                        >
                            <div className="p-4 bg-brand-600 text-white flex justify-between items-center">
                                <h3 className="font-black tracking-tight">Taarifa (Notifications)</h3>
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                    aria-label="Funga (Close)"
                                    title="Funga"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="max-h-[70vh] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-12 text-center text-text-muted">
                                        <Bell className="mx-auto mb-2 opacity-20" size={40} />
                                        <p className="text-xs font-bold uppercase tracking-widest">Huna taarifa mpya</p>
                                    </div>
                                ) : (
                                    notifications.map((n: Notification) => (
                                        <div 
                                            key={n.id}
                                            onClick={() => !n.is_read && markReadMutation.mutate(n.id)}
                                            className={`p-4 border-b border-border-default flex gap-3 transition-colors cursor-pointer ${n.is_read ? 'bg-white opacity-60' : 'bg-brand-50 hover:bg-brand-100'}`}
                                        >
                                            <div className="shrink-0 mt-1">
                                                {getIcon(n.type)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-green-950 truncate">{n.title}</p>
                                                <p className="text-xs text-text-secondary leading-relaxed mt-0.5">{n.body}</p>
                                                <p className="text-[10px] text-text-muted font-bold mt-2 uppercase">
                                                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <button className="w-full p-3 bg-neutral-50 text-[10px] font-black text-brand-700 uppercase tracking-widest border-t border-border-default hover:bg-neutral-100">
                                Angalia Zote (View All)
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

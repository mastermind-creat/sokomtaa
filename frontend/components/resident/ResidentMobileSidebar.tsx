'use client';

import React from 'react';
import { 
    X,
    Home, 
    Search, 
    Ticket, 
    User, 
    MapPin,
    Heart,
    HelpCircle,
    LogOut
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useLogout';
import { Logo } from '../shared/Logo';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse } from '@/types';

interface MenuCounts {
    active_reservations: number;
    watchlist: number;
    unread_notifications: number;
}

interface ResidentMobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ResidentMobileSidebar({ isOpen, onClose }: ResidentMobileSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useTranslation();
    const { logout } = useLogout();

    // Fetch dynamic menu counts
    const { data: menuCountsRaw } = useQuery({
        queryKey: ['resident-menu-counts-mobile'],
        queryFn: async () => {
            const res = await api.get<never, ApiResponse<MenuCounts>>('/resident/menu-counts');
            return res.data;
        },
        refetchInterval: 60000 // Refetch every minute
    });
    const counts = menuCountsRaw?.data;

    const menuItems = [
        { icon: Home, label: t('common.dashboard'), path: '/resident/dashboard', badge: null },
        { icon: Search, label: t('nav.discover'), path: '/search', badge: null },
        { icon: Ticket, label: t('nav.reservations'), path: '/reservations', badge: counts?.active_reservations || null },
        { icon: Heart, label: t('common.watchlist'), path: '/watchlist', badge: counts?.watchlist || null },
        { icon: MapPin, label: t('common.markets'), path: '/market/map', badge: null },
    ];

    const handleNavigate = (path: string) => {
        router.push(path);
        onClose();
    };

    return (
        <AnimatePresence>
            {/* Backdrop */}
            {isOpen && (
                <motion.div 
                    key="resident-sidebar-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
                />
            )}

            {/* Drawer Content */}
            {isOpen && (
                <motion.div 
                    key="resident-sidebar-drawer"
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#FAFAF8] z-[70] flex flex-col shadow-2xl lg:hidden"
                >
                        <div className="p-6 flex items-center justify-between border-b border-gray-100">
                            <Link href="/" onClick={onClose} className="active:scale-95 transition-transform">
                                <Logo variant="light" width={110} />
                            </Link>
                            <button 
                                onClick={onClose}
                                className="w-10 h-10 rounded-xl bg-white text-gray-400 flex items-center justify-center border border-gray-100 active:scale-90 transition-transform"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto w-full no-scrollbar px-4 py-6 space-y-6">
                            <div className="space-y-1">
                                <h4 className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{t('sidebar.discovery')}</h4>
                                {menuItems.map((item) => {
                                    const isActive = pathname === item.path;
                                    return (
                                        <button
                                            key={item.path}
                                            onClick={() => handleNavigate(item.path)}
                                            className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all ${
                                                isActive 
                                                    ? 'bg-white text-green-950 shadow-lg border border-gray-100' 
                                                    : 'text-text-secondary active:bg-white'
                                            }`}
                                        >
                                            <item.icon size={18} className={isActive ? 'text-brand-600' : 'text-gray-400'} />
                                            <span className={`text-sm font-bold tracking-tight ${isActive ? 'text-green-950 font-black' : ''}`}>
                                                {item.label}
                                            </span>
                                            {item.badge && (
                                                <div className="ml-auto px-2 py-0.5 rounded-lg text-[10px] font-black bg-brand-600 text-white">
                                                    {item.badge}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => handleNavigate('/profile')}
                                    className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all mt-4 ${
                                        pathname === '/profile' 
                                            ? 'bg-white text-green-950 shadow-lg border border-gray-100' 
                                            : 'text-text-secondary active:bg-white'
                                    }`}
                                >
                                    <User size={18} className={pathname === '/profile' ? 'text-brand-600' : 'text-gray-400'} />
                                    <span className={`text-sm font-bold tracking-tight ${pathname === '/profile' ? 'text-green-950 font-black' : ''}`}>
                                        {t('common.profile')}
                                    </span>
                                </button>
                            </div>

                            {/* Support Area */}
                            <div className="p-4 bg-gradient-to-br from-brand-600 to-brand-800 rounded-3xl text-white shadow-lg relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <HelpCircle size={60} />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1.5">Need help?</p>
                                <p className="text-xs font-bold leading-tight mb-3">Having trouble with your reservation?</p>
                                <button 
                                    onClick={() => handleNavigate('/help')}
                                    className="w-full py-2.5 bg-white text-brand-700 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                                >
                                    Visit Help Center
                                </button>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-white">
                             <button 
                                onClick={logout}
                                className="w-full h-12 flex items-center justify-center gap-3 p-3 rounded-2xl text-rose-600 bg-rose-50 border border-rose-100 shadow-sm font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95"
                             >
                                <LogOut size={16} /> Sign Out
                             </button>
                        </div>
                    </motion.div>
            )}
        </AnimatePresence>
    );
}

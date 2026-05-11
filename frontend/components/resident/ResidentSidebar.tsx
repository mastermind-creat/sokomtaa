'use client';

import React from 'react';
import { 
    Home, 
    Search, 
    Ticket, 
    User, 
    Settings,
    ChevronRight,
    MapPin,
    Heart,
    HelpCircle
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useLogout';
import { Logo } from '../shared/Logo';
import { LanguageToggle } from '../shared/LanguageToggle';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse } from '@/types';

interface MenuCounts {
    active_reservations: number;
    watchlist: number;
    unread_notifications: number;
}

export default function ResidentSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const { logout } = useLogout();
    const { t } = useTranslation();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch dynamic menu counts
    const { data: menuCountsRaw } = useQuery({
        queryKey: ['resident-menu-counts'],
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

    // Helper to check if a path is active, but only after mounting to avoid hydration mismatch
    const getActiveState = (path: string) => {
        if (!mounted) return false;
        return pathname === path;
    };

    return (
        <aside className="hidden lg:flex flex-col w-[280px] h-screen bg-[#FAFAF8] border-r border-gray-100 sticky top-0 left-0 overflow-y-auto no-scrollbar">
            {/* Logo Area */}
            <div className="p-8 pb-10">
                <div 
                    onClick={() => router.push('/')} 
                    className="cursor-pointer active:scale-95 transition-transform"
                >
                    <Logo variant="light" width={160} />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1">
                <p className="px-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4">{t('sidebar.discovery')}</p>
                {menuItems.map((item) => {
                    const isActive = getActiveState(item.path);
                    return (
                        <button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group active:scale-[0.98] ${
                                isActive 
                                    ? 'bg-white text-green-950 shadow-xl shadow-gray-200/50 border border-gray-100' 
                                    : 'text-text-secondary hover:bg-white/50'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <item.icon 
                                    size={20} 
                                    className={isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-brand-600 transition-colors'} 
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                <span className={`text-sm font-bold tracking-tight ${isActive ? 'text-green-950 font-black' : ''}`}>
                                    {item.label}
                                </span>
                            </div>
                            {item.badge && (
                                <div className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-brand-600 text-white">
                                    {item.badge}
                                </div>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Support Area */}
            <div className="px-6 pb-4">
                <div className="p-5 bg-gradient-to-br from-brand-600 to-brand-800 rounded-3xl text-white shadow-lg shadow-brand-200 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-500">
                        <HelpCircle size={80} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">Need help?</p>
                    <p className="text-sm font-bold leading-tight mb-4">Having trouble with your reservation?</p>
                    <button 
                        onClick={() => router.push('/help')}
                        className="w-full py-3 bg-white text-brand-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-50 transition-colors"
                    >
                        Visit Help Center
                    </button>
                </div>
            </div>

            {/* Footer Area */}
            <div className="p-6 space-y-4">
                <button 
                    onClick={() => router.push('/profile')}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl text-text-secondary hover:bg-white transition-all font-bold text-sm"
                >
                    <User size={20} className="text-gray-400" />
                    {t('common.profile')}
                </button>
                
                <div className="p-4 bg-white/50 rounded-3xl space-y-4 border border-gray-100">
                    <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{t('common.language')}</p>
                        <LanguageToggle />
                    </div>
                    
                    <button 
                        onClick={logout}
                        className="w-full h-12 flex items-center justify-center p-3 rounded-2xl bg-rose-50 text-rose-600 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-100 active:scale-95 transition-all"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </aside>
    );
}

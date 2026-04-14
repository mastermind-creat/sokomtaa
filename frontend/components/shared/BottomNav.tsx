'use client';

import React from 'react';
import { Search, MapPin, User, LayoutDashboard, Ticket } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/hooks/useTranslation';

export default function BottomNav() {
    const { user } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useTranslation();

    const tabs = [
        { icon: Search, label: t('nav.discover'), path: '/', roles: ['resident', 'trader', 'admin'] },
        { icon: MapPin, label: t('common.markets'), path: '/market/map', roles: ['resident', 'trader', 'admin'] },
        { 
            icon: LayoutDashboard, 
            label: t('nav.dawati'), 
            path: user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'trader' ? '/trader/dashboard' : '/resident/dashboard', 
            roles: ['resident', 'trader', 'admin'] 
        },
        { 
            icon: Ticket, 
            label: t('nav.reservations'), 
            path: user?.role === 'trader' ? '/trader/reservations' : '/reservations', 
            roles: ['resident', 'trader', 'admin'] 
        },
        { icon: User, label: t('common.profile'), path: '/profile', roles: ['resident', 'trader', 'admin'] },
    ];

    const activeTabs = tabs.filter(tab => !tab.roles || tab.roles.includes(user?.role || 'resident'));

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-t border-gray-100 flex items-center justify-around px-2 z-50 safe-bottom shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
            {activeTabs.map((tab) => {
                const isActive = pathname === tab.path || (tab.path !== '/' && pathname.startsWith(tab.path));
                return (
                    <button
                        key={tab.path}
                        onClick={() => router.push(tab.path)}
                        className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-all active:scale-90 ${
                            isActive ? 'text-brand-600' : 'text-gray-400'
                        }`}
                    >
                        <tab.icon 
                            size={22} 
                            strokeWidth={isActive ? 2.5 : 2} 
                            className={`transition-all ${isActive ? 'scale-110' : ''}`} 
                        />
                        <span className={`text-[10px] font-bold uppercase tracking-wider leading-none transition-all ${
                            isActive ? 'opacity-100' : 'opacity-60'
                        }`}>
                            {tab.label}
                        </span>
                        {isActive && (
                            <div className="absolute top-1 w-1 h-1 bg-brand-600 rounded-full" />
                        )}
                    </button>
                );
            })}
        </nav>
    );
}

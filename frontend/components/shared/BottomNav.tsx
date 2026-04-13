'use client';

import React from 'react';
import { Search, MapPin, User, LayoutDashboard, Store, Ticket, BarChart3 } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageToggle } from './LanguageToggle';
import { Logo } from './Logo';

export default function BottomNav() {
    const { user } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useTranslation();

    const tabs = [
        { icon: Search, label: t('nav.discover'), path: '/', roles: ['resident', 'trader', 'admin'] },
        { icon: MapPin, label: t('common.markets'), path: '/market/map', roles: ['resident', 'trader', 'admin'] },
        { icon: LayoutDashboard, label: t('nav.dawati'), path: '/admin/dashboard', roles: ['admin'] },
        { icon: LayoutDashboard, label: t('nav.dawati'), path: '/trader/dashboard', roles: ['trader'] },
        { icon: LayoutDashboard, label: t('nav.dawati'), path: '/resident/dashboard', roles: ['resident'] },
        { icon: BarChart3, label: t('common.analytics'), path: '/trader/analytics', roles: ['trader'] },
        { icon: Ticket, label: t('nav.reservations'), path: '/reservations', roles: ['resident', 'trader', 'admin'] },
        { icon: Store, label: t('common.stalls'), path: '/admin/stalls', roles: ['admin'] },
        { icon: User, label: t('common.verification'), path: '/admin/traders', roles: ['admin'] },
        { icon: MapPin, label: t('common.allocations'), path: '/admin/allocations', roles: ['admin'] },
        { icon: Ticket, label: t('common.fees'), path: '/admin/fees', roles: ['admin'] },
        { icon: User, label: t('common.profile'), path: '/profile', roles: ['resident', 'trader', 'admin'] },
    ];

    const activeTabs = tabs
        .filter(tab => !tab.roles || tab.roles.includes(user?.role || 'resident'))
        .map(tab => {
            if (user?.role === 'trader' && tab.path === '/reservations') {
                return { ...tab, path: '/trader/dashboard/reservations' };
            }
            return tab;
        });

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[rgba(255,255,255,0.92)] backdrop-blur-[20px] border-t border-border-default flex items-center justify-around px-2 z-50 safe-bottom shadow-float lg:order-first lg:static lg:h-screen lg:w-72 lg:flex-col lg:justify-between lg:gap-4 lg:py-10 lg:px-6 lg:border-t-0 lg:border-r lg:bg-white lg:shadow-xl lg:backdrop-blur-none transition-all duration-300">
            {/* Desktop Logo */}
            <div
                onClick={() => router.push('/')}
                className="hidden lg:flex items-center gap-3 mb-10 px-4 cursor-pointer active:scale-95 transition-all"
            >
                <Logo variant="light" width={180} />
            </div>

            <div className="flex w-full items-center justify-around lg:flex-col lg:gap-4 lg:w-full">
                {activeTabs.map((tab) => {
                    const isActive = pathname === tab.path;
                    return (
                        <button
                            key={tab.path}
                            onClick={() => router.push(tab.path)}
                            className={`flex flex-col lg:flex-row lg:w-full items-center lg:justify-start justify-center gap-1 lg:gap-4 w-16 lg:w-full h-full lg:h-14 pt-1 lg:pt-0 lg:px-5 lg:rounded-2xl transition-all active:scale-95 ${isActive
                                    ? 'text-brand-600 font-bold border-t-2 lg:border-t-0 lg:bg-brand-50 lg:border-l-4 border-brand-600'
                                    : 'text-text-muted hover:text-text-secondary lg:hover:bg-gray-50'
                                }`}
                        >
                            <tab.icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} className="lg:shrink-0 transition-all" />
                            <span className="text-[10px] lg:text-base uppercase lg:capitalize tracking-widest lg:tracking-normal leading-none font-semibold">
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Language Toggle for Desktop */}
            <div className="hidden lg:flex w-full px-4 pt-10 border-t border-gray-100 flex-col gap-4">
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest">{t('common.language')}</p>
                <LanguageToggle />
            </div>
        </nav>
    );
}

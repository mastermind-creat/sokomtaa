'use client';

import React from 'react';
import { Search, MapPin, User, LayoutDashboard, Store, Ticket } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function BottomNav() {
    const { user } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    const tabs = [
        { icon: Search, label: 'Gundua', path: '/', roles: ['resident', 'trader', 'admin'] },
        { icon: MapPin, label: 'Ramani', path: '/market/map', roles: ['resident', 'trader', 'admin'] },
        { icon: Ticket, label: 'Uhifadhi', path: '/reservations', roles: ['resident', 'trader'] },
        { icon: LayoutDashboard, label: 'Dawati', path: '/trader/dashboard', roles: ['trader'] },
        { icon: Store, label: 'Stall', path: '/admin/stalls', roles: ['admin'] },
        { icon: User, label: 'Wasifu', path: '/profile', roles: ['resident', 'trader', 'admin'] },
    ];

    const activeTabs = tabs
        .filter(tab => !tab.roles || tab.roles.includes(user?.role || 'resident'))
        .map(tab => {
            // Special handling for trader reservations path to avoid route conflict
            if (user?.role === 'trader' && tab.path === '/reservations') {
                return { ...tab, path: '/dashboard/reservations' };
            }
            return tab;
        });

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[rgba(255,255,255,0.92)] backdrop-blur-[20px] border-t border-border-default flex items-center justify-around px-2 max-w-[480px] mx-auto z-50 safe-bottom shadow-float lg:order-first lg:static lg:h-screen lg:w-64 lg:flex-col lg:justify-start lg:gap-4 lg:pt-8 lg:px-6 lg:border-t-0 lg:border-r lg:bg-transparent lg:shadow-none lg:backdrop-blur-none">
            {activeTabs.map((tab) => {
                const isActive = pathname === tab.path;
                return (
                    <button
                        key={tab.path}
                        onClick={() => router.push(tab.path)}
                        className={`flex flex-col lg:flex-row lg:w-full items-center lg:justify-start justify-center gap-1 lg:gap-4 w-16 lg:w-full h-full lg:h-12 pt-1 lg:pt-0 lg:px-4 lg:rounded-xl transition-all active:scale-95 ${
                            isActive 
                            ? 'text-brand-600 font-black border-t-2 lg:border-t-0 lg:bg-brand-50 lg:border-l-4 border-brand-600' 
                            : 'text-text-muted hover:text-text-secondary lg:hover:bg-neutral-50'
                        }`}
                    >
                        <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} className="lg:shrink-0" />
                        <span className="text-[9px] lg:text-sm uppercase lg:capitalize tracking-widest lg:tracking-normal leading-none lg:font-bold">
                            {tab.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
}

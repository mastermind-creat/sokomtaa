'use client';

import React from 'react';
import { Search, MapPin, User, LayoutDashboard, Ticket, Wallet } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/hooks/useTranslation';

export default function BottomNav() {
    const { user } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useTranslation();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const tabs = [
        { 
            icon: Search, 
            label: t('nav.discover'), 
            path: user?.role === 'resident' ? '/resident' : '/', 
            roles: ['resident', 'trader', 'admin'] 
        },
        { icon: MapPin, label: t('common.markets'), path: '/resident/markets', roles: ['resident', 'trader', 'admin'] },
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

    const deliveryTabs = [
        { 
            icon: LayoutDashboard, 
            label: "Deck", 
            path: '/delivery/dashboard'
        },
        { icon: Wallet, label: 'Wallet', path: '/delivery/wallet' },
        { icon: User, label: t('common.profile'), path: '/profile' },
    ];

    const activeTabs = user?.role === 'delivery' 
        ? deliveryTabs 
        : tabs.filter(tab => !tab.roles || tab.roles.includes(user?.role || 'resident'));

    const getActiveState = (path: string) => {
        if (!mounted) return false;
        return pathname === path || (path !== '/' && pathname.startsWith(path));
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-[72px] bg-white/90 backdrop-blur-xl border-t border-gray-100 flex items-center justify-around px-1 z-50 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
            {activeTabs.map((tab) => {
                const isActive = getActiveState(tab.path);
                return (
                    <button
                        key={tab.path}
                        onClick={() => router.push(tab.path)}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 h-full transition-all active:scale-90 ${
                            isActive ? 'text-brand-600' : 'text-gray-400'
                        }`}
                    >
                        <tab.icon 
                            size={20} 
                            strokeWidth={isActive ? 2.5 : 2} 
                            className={`transition-all ${isActive ? 'scale-110' : ''}`} 
                        />
                        <span className={`text-[8px] font-black uppercase tracking-normal leading-none truncate w-full text-center px-0.5 transition-all ${
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

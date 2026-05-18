'use client';

import React from 'react';
import { 
    Navigation, 
    MapPin,
    User, 
    HelpCircle,
    FileText,
    Loader2,
    ShoppingBag,
    ClipboardList,
    Shield
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useLogout';
import { Logo } from '../shared/Logo';
import { LanguageToggle } from '../shared/LanguageToggle';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface MenuItem {
    icon: any;
    label: string;
    path: string;
    badge?: number | string | null;
}

export default function DeliverySidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const { logout } = useLogout();
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const [mounted, setMounted] = React.useState(false);
    const [isNavigating, setIsNavigating] = React.useState<string | null>(null);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    React.useEffect(() => {
        setIsNavigating(null);
    }, [pathname]);

    const handleNavigate = (path: string) => {
        if (pathname === path) return;
        setIsNavigating(path);
        router.push(path);
    };

    // Fetch dynamic rider stats for sidebar badges and current balance indicator
    const { data: stats } = useQuery({
        queryKey: ['rider-sidebar-stats'],
        queryFn: () => api.get<never, { data: any }>('/delivery/stats').then(res => res.data),
        enabled: !!user && user.role === 'delivery',
        refetchInterval: 15000 // Refresh every 15 seconds
    });

    const kycStatus = stats?.profile?.verification_status;
    const vehicleType = stats?.profile?.vehicle_type || 'motorcycle';
    const riderTitle = vehicleType === 'motorcycle' 
        ? 'Boda Rider' 
        : vehicleType === 'bicycle' 
            ? 'Bicycle Rider' 
            : vehicleType === 'foot' 
                ? 'Foot Delivery' 
                : vehicleType === 'handcart' 
                    ? 'Handcart Rider' 
                    : `${vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)} Rider`;

    const vehicleLabel = vehicleType === 'motorcycle' 
        ? 'Boda Boda' 
        : vehicleType === 'bicycle' 
            ? 'Bicycle' 
            : vehicleType === 'foot' 
                ? 'On Foot' 
                : vehicleType === 'handcart' 
                    ? 'Handcart' 
                    : vehicleType;

    const menuItems: MenuItem[] = [
        { icon: Navigation, label: 'Delivery Deck', path: '/delivery/dashboard', badge: stats?.active_deliveries || null },
        { icon: ShoppingBag, label: 'Marketplace', path: '/resident', badge: null },
        { icon: ClipboardList, label: 'My Orders', path: '/reservations', badge: null },
        ...((kycStatus === 'not_submitted' || kycStatus === 'rejected')
            ? [{ icon: Shield, label: 'Upload KYC Docs', path: '/delivery/kyc', badge: '!' as string }]
            : []),
        { icon: HelpCircle, label: 'Help Center', path: '/help', badge: null },
    ];

    const getActiveState = (path: string) => {
        if (!mounted) return false;
        return pathname === path;
    };

    return (
        <aside className="hidden lg:flex flex-col w-[280px] h-screen bg-[#FAFAF8] border-r border-gray-100 sticky top-0 left-0 overflow-y-auto no-scrollbar">
            {/* Logo Area */}
            <div className="p-8 pb-10">
                <div 
                    onClick={() => handleNavigate('/delivery/dashboard')} 
                    className="cursor-pointer active:scale-95 transition-transform"
                >
                    <Logo variant="light" width={160} />
                </div>
            </div>

            {/* Rider Identity Card */}
            <div className="px-6 mb-6">
                <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 font-black text-sm uppercase shrink-0">
                            {user?.name ? user.name[0] : 'R'}
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-sm font-black text-green-950 truncate uppercase leading-tight">{user?.name}</h4>
                            <span className="inline-block text-[9px] font-black uppercase tracking-widest text-brand-600 mt-0.5">{riderTitle}</span>
                        </div>
                    </div>
                    {stats?.profile && (
                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                            <div>
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider block">Wallet Balance</span>
                                <span className="text-sm font-black text-green-950">KES {Number(stats.profile.earnings_balance).toLocaleString()}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider block">Vehicle</span>
                                <span className="text-[10px] font-black text-brand-600 uppercase truncate max-w-[80px] block">{vehicleLabel}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 space-y-1">
                <p className="px-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4">Operations</p>
                {menuItems.map((item) => {
                    const isActive = getActiveState(item.path);
                    return (
                        <button
                            key={item.path}
                            onClick={() => handleNavigate(item.path)}
                            disabled={isNavigating !== null}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group active:scale-[0.98] ${
                                isActive 
                                    ? 'bg-white text-green-950 shadow-xl shadow-gray-200/50 border border-gray-100' 
                                    : 'text-text-secondary hover:bg-white/50'
                            } ${isNavigating === item.path ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            <div className="flex items-center gap-4">
                                {isNavigating === item.path ? (
                                    <Loader2 size={20} className="animate-spin text-brand-600" />
                                ) : (
                                    <item.icon 
                                        size={20} 
                                        className={isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-brand-600 transition-colors'} 
                                        strokeWidth={isActive ? 2.5 : 2}
                                    />
                                )}
                                <span className={`text-sm font-bold tracking-tight ${isActive ? 'text-green-950 font-black' : ''}`}>
                                    {item.label}
                                </span>
                            </div>
                            {item.badge !== null && item.badge !== undefined && (
                                <div className="px-2.5 py-0.5 rounded-lg text-[9px] font-black bg-brand-600 text-white uppercase tracking-wider">
                                    {item.badge}
                                </div>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Help and Quick Support Deck */}
            <div className="px-6 pb-4">
                <div className="p-5 bg-gradient-to-br from-brand-600 to-brand-800 rounded-3xl text-white shadow-lg shadow-brand-200 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-500">
                        <HelpCircle size={80} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">Need help?</p>
                    <p className="text-sm font-bold leading-tight mb-4">Questions about your payouts or order deliveries?</p>
                    <button 
                        onClick={() => handleNavigate('/help')}
                        disabled={isNavigating !== null}
                        className="relative z-10 w-full py-3 bg-white text-brand-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-50 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isNavigating === '/help' ? <Loader2 size={16} className="animate-spin" /> : null}
                        Visit Help Center
                    </button>
                </div>
            </div>

            {/* Footer Sign Out */}
            <div className="p-6 space-y-4">
                <button 
                    onClick={() => handleNavigate('/profile')}
                    disabled={isNavigating !== null}
                    className="w-full flex items-center justify-center gap-4 p-4 rounded-2xl text-text-secondary hover:bg-white transition-all font-bold text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isNavigating === '/profile' ? (
                        <Loader2 size={20} className="animate-spin text-brand-600" />
                    ) : (
                        <User size={20} className="text-gray-400" />
                    )}
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

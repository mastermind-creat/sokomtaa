'use client';

import React from 'react';
import { 
    X,
    Navigation, 
    User, 
    HelpCircle,
    LogOut,
    Loader2,
    ShoppingBag,
    ClipboardList,
    Shield,
    ShieldCheck,
    Wallet
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

interface MenuItem {
    icon: any;
    label: string;
    path: string;
    badge?: number | string | null;
}

interface DeliveryMobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DeliveryMobileSidebar({ isOpen, onClose }: DeliveryMobileSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useTranslation();
    const { logout } = useLogout();
    const { user } = useAuthStore();
    const [isNavigating, setIsNavigating] = React.useState<string | null>(null);

    React.useEffect(() => {
        setIsNavigating(null);
    }, [pathname]);

    // Fetch dynamic rider stats for sidebar badges and current balance indicator
    const { data: stats } = useQuery({
        queryKey: ['rider-mobile-sidebar-stats'],
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
        { icon: Wallet, label: 'Earnings Wallet', path: '/delivery/wallet', badge: null },
        { icon: ShoppingBag, label: 'Marketplace', path: '/resident', badge: null },
        { icon: ClipboardList, label: 'My Orders', path: '/reservations', badge: null },
        ...((kycStatus === 'not_submitted' || kycStatus === 'rejected')
            ? [{ icon: Shield, label: 'Upload KYC Docs', path: '/delivery/kyc', badge: '!' as string }]
            : []),
    ];

    const handleNavigate = (path: string) => {
        if (pathname === path) {
            onClose();
            return;
        }
        setIsNavigating(path);
        router.push(path);
    };

    return (
        <AnimatePresence>
            {/* Backdrop */}
            {isOpen && (
                <motion.div 
                    key="delivery-sidebar-backdrop"
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
                    key="delivery-sidebar-drawer"
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#FAFAF8] z-[70] flex flex-col shadow-2xl lg:hidden"
                >
                    <div className="p-6 flex items-center justify-between border-b border-gray-100">
                        <Link href="/delivery/dashboard" onClick={onClose} className="active:scale-95 transition-transform">
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
                        {/* Rider Identity Card */}
                        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 font-black text-sm uppercase shrink-0">
                                    {user?.name ? user.name[0] : 'R'}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <h4 className="text-sm font-black text-green-950 truncate uppercase leading-tight">{user?.name}</h4>
                                        {kycStatus === 'verified' && (
                                            <ShieldCheck size={14} className="text-brand-600 shrink-0" />
                                        )}
                                    </div>
                                    <span className="inline-block text-[9px] font-black uppercase tracking-widest text-brand-600 mt-0.5">{riderTitle}</span>
                                </div>
                            </div>
                            {stats?.profile && (
                                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                                    <div>
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider block">Balance</span>
                                        <span className="text-sm font-black text-green-950">KES {Number(stats.profile.earnings_balance).toLocaleString()}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider block">Vehicle</span>
                                        <span className="text-[10px] font-black text-brand-600 uppercase truncate max-w-[80px] block">{vehicleLabel}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <h4 className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Operations</h4>
                            {menuItems.map((item) => {
                                const isActive = pathname === item.path;
                                return (
                                    <button
                                        key={item.path}
                                        onClick={() => handleNavigate(item.path)}
                                        disabled={isNavigating !== null}
                                        className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all ${
                                            isActive 
                                                ? 'bg-white text-green-950 shadow-lg border border-gray-100' 
                                                : 'text-text-secondary active:bg-white'
                                        } ${isNavigating === item.path ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isNavigating === item.path ? (
                                            <Loader2 size={18} className="animate-spin text-brand-600" />
                                        ) : (
                                            <item.icon size={18} className={isActive ? 'text-brand-600' : 'text-gray-400'} />
                                        )}
                                        <span className={`text-sm font-bold tracking-tight ${isActive ? 'text-green-950 font-black' : ''}`}>
                                            {item.label}
                                        </span>
                                        {item.badge !== null && item.badge !== undefined && (
                                            <div className="ml-auto px-2 py-0.5 rounded-lg text-[9px] font-black bg-brand-600 text-white uppercase tracking-wider">
                                                {item.badge}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                            
                            <button
                                onClick={() => handleNavigate('/profile')}
                                disabled={isNavigating !== null}
                                className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all mt-4 ${
                                    pathname === '/profile' 
                                        ? 'bg-white text-green-950 shadow-lg border border-gray-100' 
                                        : 'text-text-secondary active:bg-white'
                                } ${isNavigating === '/profile' ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isNavigating === '/profile' ? (
                                    <Loader2 size={18} className="animate-spin text-brand-600" />
                                ) : (
                                    <User size={18} className={pathname === '/profile' ? 'text-brand-600' : 'text-gray-400'} />
                                )}
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
                            <p className="text-xs font-bold leading-tight mb-3">Questions about payouts or deliveries?</p>
                            <button 
                                onClick={() => handleNavigate('/help')}
                                disabled={isNavigating !== null}
                                className="relative z-10 w-full py-2.5 bg-white text-brand-700 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform cursor-pointer flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isNavigating === '/help' ? <Loader2 size={14} className="animate-spin" /> : null}
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

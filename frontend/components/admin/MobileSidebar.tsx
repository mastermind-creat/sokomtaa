'use client';

import React from 'react';
import { 
    X,
    LayoutDashboard, 
    Store, 
    Users, 
    MapPin, 
    FileText, 
    Settings,
    ChevronRight,
    BarChart3,
    Map as MapIcon,
    UsersRound,
    GanttChartSquare,
    ShieldCheck,
    LogOut,
    Terminal,
    MessageSquare,
    CreditCard,
    Ticket,
    ShoppingBag,
    Star,
    Bell
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

const Building2 = ({ size, className, strokeWidth }: { size?: number; className?: string; strokeWidth?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
        <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
        <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
        <path d="M10 6h4" />
        <path d="M10 10h4" />
        <path d="M10 14h4" />
        <path d="M10 18h4" />
    </svg>
);

interface MenuCounts {
    applications: number;
    complaints: number;
    traders_pending: number;
    fees_overdue: number;
    riders_pending: number;
}

interface MenuItem {
    icon: any;
    label: string;
    path: string;
    badge?: number | string | null;
}

interface MenuSection {
    title: string;
    items: MenuItem[];
}

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useTranslation();
    const { logout } = useLogout();
    const { user } = useAuthStore();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch dynamic menu counts
    const { data: menuCountsRaw } = useQuery({
        queryKey: ['admin-menu-counts-mobile'],
        queryFn: async () => {
            const res = await api.get<never, ApiResponse<MenuCounts>>('/admin/menu-counts');
            return res.data;
        },
        enabled: !!user && user.role === 'admin',
        refetchInterval: 60000 // Refetch every minute
    });
    const counts = menuCountsRaw;

    const menuSections: MenuSection[] = [
        {
            title: 'Operations',
            items: [
                { icon: LayoutDashboard, label: t('admin.dashboard_title'), path: '/admin/dashboard' },
                { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
                { icon: MapIcon, label: t('common.market_map') || 'Market Map', path: '/admin/map' },
            ]
        },
        {
            title: 'Infrastructure',
            items: [
                { icon: MapPin, label: 'Regions & Centers', path: '/admin/locations' },
                { icon: MapPin, label: 'Markets', path: '/admin/markets' },
                { icon: Store, label: 'Stalls', path: '/admin/stalls' },
                { icon: GanttChartSquare, label: 'Allocations', path: '/admin/allocations' },
            ]
        },
        {
            title: 'Traders & Users',
            items: [
                { icon: FileText, label: 'Applications', path: '/admin/applications', badge: counts?.applications },
                { icon: Users, label: 'Traders', path: '/admin/traders', badge: counts?.traders_pending },
                { icon: UsersRound, label: 'User Management', path: '/admin/users', badge: counts?.riders_pending },
            ]
        },
        {
            title: 'Commerce',
            items: [
                { icon: Ticket, label: 'Fees', path: '/admin/fees' },
                { icon: CreditCard, label: 'Payment History', path: '/admin/payments' },
                { icon: ShoppingBag, label: 'Reservations', path: '/admin/reservations' },
                { icon: Star, label: 'Reviews', path: '/admin/reviews' },
                { icon: FileText, label: 'System Reports', path: '/admin/reports' },
            ]
        },
        {
            title: 'Communication',
            items: [
                { icon: MessageSquare, label: 'Complaints', path: '/admin/complaints', badge: counts?.complaints },
                { icon: Bell, label: 'Notifications', path: '/admin/notices' },
            ]
        },
        {
            title: 'System',
            items: [
                { icon: ShieldCheck, label: 'Audit Log', path: '/admin/audit-log' },
                { icon: Terminal, label: 'Maintenance', path: '/admin/maintenance' },
                { icon: Settings, label: 'Settings', path: '/admin/settings' },
            ]
        }
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
                    key="mobile-sidebar-backdrop"
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
                    key="mobile-sidebar-drawer"
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[70] flex flex-col shadow-2xl lg:hidden"
                >
                        <div className="p-6 flex items-center justify-between border-b border-neutral-100">
                            <Link href="/" onClick={onClose} className="active:scale-95 transition-transform">
                                <Logo variant="light" width={110} />
                            </Link>
                            <button 
                                onClick={onClose}
                                className="w-10 h-10 rounded-xl bg-neutral-50 text-neutral-400 flex items-center justify-center active:scale-90 transition-transform"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 no-scrollbar">
                            {menuSections.map((section, idx) => (
                                <div key={idx} className="space-y-3">
                                    <h4 className="px-3 text-[10px] font-black text-neutral-400 uppercase tracking-widest">{section.title}</h4>
                                    <div className="space-y-1">
                                        {section.items.map((item) => {
                                            const isActive = mounted && pathname === item.path;
                                            return (
                                                <button
                                                    key={item.path}
                                                    onClick={() => handleNavigate(item.path)}
                                                    className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all ${
                                                        isActive 
                                                            ? 'bg-green-950 text-white shadow-lg' 
                                                            : 'text-neutral-600 active:bg-neutral-50'
                                                    }`}
                                                >
                                                    <item.icon size={18} className={isActive ? 'text-brand-400' : 'text-neutral-400'} />
                                                    <span className={`text-sm font-bold tracking-tight ${isActive ? 'text-white' : ''}`}>
                                                        {item.label}
                                                    </span>
                                                    
                                                    {item.badge ? (
                                                        <div className={`ml-auto px-2 py-0.5 rounded-md text-[8px] font-black ${
                                                            isActive ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-700'
                                                        }`}>
                                                            {item.badge}
                                                        </div>
                                                    ) : isActive && (
                                                        <ChevronRight size={14} className="ml-auto opacity-40 text-white" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-neutral-100 bg-neutral-50/50">
                             <button 
                                onClick={logout}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl text-rose-600 bg-white border border-rose-100 shadow-sm font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95"
                             >
                                <LogOut size={16} /> Sign Out
                             </button>
                        </div>
                    </motion.div>
            )}
        </AnimatePresence>
    );
}

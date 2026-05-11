'use client';

import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Store,
    Users,
    MapPin,
    Ticket,
    MessageSquare,
    FileText,
    Bell,
    Settings,
    ChevronRight,
    ChevronDown,
    BarChart3,
    Map as MapIcon,
    CreditCard,
    ShoppingBag,
    Star,
    UsersRound,
    ShieldCheck,
    GanttChartSquare,
    Terminal
} from 'lucide-react';

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
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useLogout';
import { Logo } from '../shared/Logo';
import { LanguageToggle } from '../shared/LanguageToggle';
import { motion, AnimatePresence } from 'framer-motion';
import NProgress from 'nprogress';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse } from '@/types';

interface MenuCounts {
    applications: number;
    complaints: number;
    traders_pending: number;
    fees_overdue: number;
}

export default function AdminSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const { logout } = useLogout();
    const { t } = useTranslation();
    const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Stop loader when pathname changes (navigation complete)
    useEffect(() => {
        NProgress.done();
        setNavigatingTo(null);
    }, [pathname]);

    const navigate = (path: string) => {
        if (path === pathname) return;
        setNavigatingTo(path);
        NProgress.start();
        router.push(path);
    };

    // Track which sections are expanded
    const [expandedSections, setExpandedSections] = useState<string[]>(['Operations']);

    // Fetch dynamic menu counts
    const { data: menuCountsRaw } = useQuery({
        queryKey: ['admin-menu-counts'],
        queryFn: async () => {
            const res = await api.get<never, ApiResponse<MenuCounts>>('/admin/menu-counts');
            return res.data;
        },
        refetchInterval: 60000 // Refetch every minute
    });
    const counts = menuCountsRaw?.data;


    const menuSections = [
        {
            title: 'Operations',
            icon: LayoutDashboard,
            items: [
                { icon: LayoutDashboard, label: t('admin.dashboard_title'), path: '/admin/dashboard' },
                { icon: BarChart3, label: t('Analytics') || 'Analytics', path: '/admin/analytics' },
                { icon: MapIcon, label: t('Market_map') || 'Market Map', path: '/admin/map' },
            ]
        },
        {
            title: 'Infrastructure',
            icon: Building2,
            items: [
                { icon: MapPin, label: t('Markets'), path: '/admin/markets' },
                { icon: Store, label: t('Stalls'), path: '/admin/stalls' },
                { icon: GanttChartSquare, label: 'Allocations', path: '/admin/allocations' },
            ]
        },
        {
            title: 'Traders & Users',
            icon: Users,
            items: [
                { icon: FileText, label: 'Applications', path: '/admin/applications', badge: counts?.applications || 0 },
                { icon: Users, label: t('Traders'), path: '/admin/traders', badge: counts?.traders_pending || 0 },
                { icon: UsersRound, label: 'User Management', path: '/admin/users' },
            ]
        },
        {
            title: 'Commerce',
            icon: CreditCard,
            items: [
                { icon: Ticket, label: t('Fees'), path: '/admin/fees' },
                { icon: CreditCard, label: 'Payment History', path: '/admin/payments' },
                { icon: ShoppingBag, label: 'Reservations', path: '/admin/reservations' },
                { icon: Star, label: 'Reviews', path: '/admin/reviews' },
            ]
        },
        {
            title: 'Communication',
            icon: MessageSquare,
            items: [
                { icon: MessageSquare, label: t('Complaints'), path: '/admin/complaints', badge: counts?.complaints || 0 },
                { icon: Bell, label: t('Notifications'), path: '/admin/notices' },
            ]
        },
        {
            title: 'System',
            icon: Settings,
            items: [
                { icon: ShieldCheck, label: 'Audit Log', path: '/admin/audit-log' },
                { icon: Terminal, label: 'Maintenance', path: '/admin/maintenance' },
                { icon: Settings, label: t('Settings'), path: '/admin/settings' },
            ]
        }
    ];

    const getActiveState = (path: string) => {
        if (!mounted) return false;
        return pathname === path;
    };

    // Automatically expand the section that contains the current active route
    useEffect(() => {
        if (!mounted) return;
        const activeSection = menuSections.find(section =>
            section.items.some(item => pathname === item.path)
        );
        if (activeSection && !expandedSections.includes(activeSection.title)) {
            setExpandedSections(prev => [...prev, activeSection.title]);
        }
    }, [pathname]);

    const toggleSection = (title: string) => {
        setExpandedSections(prev =>
            prev.includes(title)
                ? prev.filter(t => t !== title)
                : [...prev, title]
        );
    };

    return (
        <aside className="hidden lg:flex flex-col w-[300px] h-screen bg-white border-r border-neutral-100 sticky top-0 left-0 overflow-hidden">
            {/* Logo Area */}
            <div className="p-8 pb-6">
                <div
                    onClick={() => router.push('/')}
                    className="cursor-pointer active:scale-95 transition-transform"
                >
                    <Logo variant="light" width={140} />
                </div>
            </div>

            {/* Scrollable Navigation */}
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar pb-10">
                {menuSections.map((section, sIdx) => {
                    const isExpanded = expandedSections.includes(section.title);
                    const isAnyItemActive = section.items.some(item => getActiveState(item.path));

                    return (
                        <div key={sIdx} className="space-y-1">
                            <button
                                onClick={() => toggleSection(section.title)}
                                className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all ${isAnyItemActive && !isExpanded
                                        ? 'bg-brand-50 text-brand-700'
                                        : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                        {section.title}
                                    </span>
                                    {isAnyItemActive && !isExpanded && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-600" />
                                    )}
                                </div>
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>

                            <AnimatePresence initial={false}>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: 'circOut' }}
                                        className="overflow-hidden space-y-1 ml-2"
                                    >
                                        {section.items.map((item) => {
                                            const isActive = getActiveState(item.path);
                                            const isNavigating = navigatingTo === item.path;
                                            return (
                                                <button
                                                    key={item.path}
                                                    onClick={() => navigate(item.path)}
                                                    disabled={isNavigating}
                                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group active:scale-[0.98] ${isActive
                                                            ? 'bg-green-950 text-white shadow-lg shadow-green-900/20'
                                                            : isNavigating
                                                                ? 'bg-brand-50 text-brand-700'
                                                                : 'text-neutral-600 hover:bg-neutral-50 hover:pl-5'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <item.icon
                                                            size={16}
                                                            className={isActive ? 'text-brand-400' : isNavigating ? 'text-brand-600 animate-pulse' : 'text-neutral-400 group-hover:text-green-950 transition-colors'}
                                                            strokeWidth={isActive || isNavigating ? 2.5 : 2}
                                                        />
                                                        <span className={`text-[13px] font-bold tracking-tight ${isActive ? 'text-white' : isNavigating ? 'text-brand-700' : ''}`}>
                                                            {item.label}
                                                        </span>
                                                    </div>
                                                    {isNavigating ? (
                                                        <div className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
                                                    ) : item.badge ? (
                                                        <div className={`px-2 py-0.5 rounded-md text-[8px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-700'
                                                            }`}>
                                                            {item.badge}
                                                        </div>
                                                    ) : null}
                                                </button>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="p-6 border-t border-neutral-50 bg-neutral-50/30">
                <div className="p-4 bg-white rounded-3xl border border-neutral-100 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{t('common.language')}</p>
                        <LanguageToggle />
                    </div>

                    <button
                        onClick={logout}
                        className="w-full h-14 flex items-center justify-center p-3 rounded-2xl bg-rose-50 text-rose-600 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-100 active:scale-95 transition-all"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </aside>
    );
}



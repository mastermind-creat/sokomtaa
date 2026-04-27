'use client';

import React from 'react';
import { 
    X,
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
    BarChart3,
    Map as MapIcon,
    CreditCard,
    ShoppingBag,
    Star,
    UsersRound,
    SquareChartGantt,
    ShieldCheck,
    LogOut
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/store/authStore';
import { Logo } from '../shared/Logo';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useTranslation();
    const { logout } = useAuthStore();

    const menuSections = [
        {
            title: 'Operations',
            items: [
                { icon: LayoutDashboard, label: t('admin.dashboard_title'), path: '/admin/dashboard' },
                { icon: MapIcon, label: t('common.market_map') || 'Market Map', path: '/admin/map' },
                { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
            ]
        },
        {
            title: 'Market',
            items: [
                { icon: MapPin, label: 'Markets', path: '/admin/markets' },
                { icon: Store, label: 'Stalls', path: '/admin/stalls' },
                { icon: SquareChartGantt, label: 'Allocations', path: '/admin/allocations' },
            ]
        },
        {
            title: 'Users',
            items: [
                { icon: FileText, label: 'Applications', path: '/admin/applications' },
                { icon: Users, label: 'Traders', path: '/admin/traders' },
                { icon: UsersRound, label: 'Users', path: '/admin/users' },
            ]
        },
        {
            title: 'Audit & System',
            items: [
                { icon: ShieldCheck, label: 'Audit Log', path: '/admin/audit-log' },
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
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
                    />

                    {/* Drawer Content */}
                    <motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[70] flex flex-col shadow-2xl lg:hidden"
                    >
                        <div className="p-6 flex items-center justify-between border-b border-neutral-100">
                            <Logo variant="light" width={110} />
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
                                            const isActive = pathname === item.path;
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
                                                    {isActive && <ChevronRight size={14} className="ml-auto opacity-40 text-white" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-neutral-100 bg-neutral-50/50">
                             <button 
                                onClick={() => logout()}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl text-red-600 bg-white border border-red-100 shadow-sm font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95"
                             >
                                <LogOut size={16} /> Sign Out
                             </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

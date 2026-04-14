'use client';

import React from 'react';
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
    Search
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { Logo } from '../shared/Logo';
import { LanguageToggle } from '../shared/LanguageToggle';

export default function AdminSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useTranslation();

    const menuItems = [
        { icon: LayoutDashboard, label: t('admin.dashboard_title'), path: '/admin/dashboard', badge: null },
        { icon: MapPin, label: t('common.markets'), path: '/admin/markets', badge: null },
        { icon: Store, label: t('common.stalls'), path: '/admin/stalls', badge: null },
        { icon: Users, label: t('common.traders'), path: '/admin/traders', badge: 12 }, // Mock badge
        { icon: MapPin, label: t('common.allocations'), path: '/admin/allocations', badge: null },
        { icon: Ticket, label: t('common.fees'), path: '/admin/fees', badge: '!' },
        { icon: MessageSquare, label: t('common.complaints'), path: '/admin/complaints', badge: 5 },
        { icon: Bell, label: t('common.notifications'), path: '/admin/notices', badge: null },
        { icon: FileText, label: t('common.reports'), path: '/admin/reports', badge: null },
    ];

    return (
        <aside className="hidden lg:flex flex-col w-[280px] h-screen bg-white border-r border-gray-100 sticky top-0 left-0 overflow-y-auto no-scrollbar">
            {/* Logo Area */}
            <div className="p-8 pb-10">
                <div 
                    onClick={() => router.push('/admin/dashboard')} 
                    className="cursor-pointer active:scale-95 transition-transform"
                >
                    <Logo variant="light" width={160} />
                </div>
                <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-brand-50 rounded-xl border border-brand-100">
                    <div className="w-2 h-2 bg-brand-600 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-700">{t('sidebar.portal_status')}</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1">
                <p className="px-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4">{t('sidebar.main_menu')}</p>
                {menuItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group active:scale-[0.98] ${
                                isActive 
                                    ? 'bg-green-950 text-white shadow-xl shadow-green-900/20' 
                                    : 'text-text-secondary hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <item.icon 
                                    size={20} 
                                    className={isActive ? 'text-brand-400' : 'text-gray-400 group-hover:text-green-950 transition-colors'} 
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                <span className={`text-sm font-bold tracking-tight ${isActive ? 'text-white' : ''}`}>
                                    {item.label}
                                </span>
                            </div>
                            {item.badge && (
                                <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                                    isActive ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-700'
                                }`}>
                                    {item.badge}
                                </div>
                            )}
                            {!item.badge && isActive && (
                                <ChevronRight size={14} className="text-white/40" />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Footer Area */}
            <div className="p-6 mt-auto space-y-4">
                <button 
                    onClick={() => router.push('/admin/settings')}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl text-text-secondary hover:bg-gray-50 transition-all font-bold text-sm"
                >
                    <Settings size={20} className="text-gray-400" />
                    {t('common.settings')}
                </button>
                
                <div className="p-4 bg-gray-50 rounded-3xl space-y-3">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{t('common.language')}</p>
                    <LanguageToggle />
                </div>
            </div>
        </aside>
    );
}

'use client';

import React from 'react';
import { 
    LayoutDashboard, 
    Package, 
    Ticket, 
    BarChart3, 
    CreditCard, 
    Settings,
    ChevronRight,
    Store,
    User,
    Power
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/store/authStore';
import { Logo } from '../shared/Logo';
import { LanguageToggle } from '../shared/LanguageToggle';
import { motion } from 'framer-motion';

export default function TraderSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuthStore();
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = React.useState(true); // Mock state

    const menuItems = [
        { icon: LayoutDashboard, label: t('nav.dawati'), path: '/trader/dashboard', badge: null },
        { icon: Package, label: t('trader.manage_products'), path: '/trader/products', badge: null },
        { icon: Ticket, label: t('nav.reservations'), path: '/trader/reservations', badge: 3 }, // Mock badge
        { icon: CreditCard, label: t('common.fees'), path: '/trader/payments', badge: 'Due' },
        { icon: BarChart3, label: t('common.analytics'), path: '/trader/analytics', badge: null },
    ];

    return (
        <aside className="hidden lg:flex flex-col w-[280px] h-screen bg-white border-r border-gray-100 sticky top-0 left-0 overflow-y-auto no-scrollbar">
            {/* Logo & Profile Summary */}
            <div className="p-8 pb-6">
                <div 
                    onClick={() => router.push('/trader/dashboard')} 
                    className="cursor-pointer active:scale-95 transition-transform mb-10"
                >
                    <Logo variant="light" width={160} />
                </div>

                <div className="p-5 bg-gray-50 rounded-[2rem] border border-gray-100 relative overflow-hidden group">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center font-black text-brand-700 overflow-hidden">
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <User size={24} />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-green-950 truncate">Baba Mboga Ltd</p>
                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest flex items-center gap-1">
                                <Store size={10} /> Stall A42
                            </p>
    const [isOpen, setIsOpen] = React.useState(true);

    return (
        <aside className="hidden lg:flex flex-col w-[280px] h-screen bg-white border-r border-gray-100 sticky top-0 left-0">
            {/* Logo */}
            <div className="p-8 pb-2">
                <div onClick={() => router.push('/trader/dashboard')} className="cursor-pointer">
                    <Logo variant="light" width={140} />
                </div>
            </div>

            {/* Trader Context Card */}
            <div className="p-6 pb-0">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-200">
                        <Store size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-green-950 tracking-tight leading-tight">M-Pesa Store</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t('sidebar.business_summary')}</span>
                        </div>
                    </div>
                </div>

                {/* Status Toggle Area */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-green-950 uppercase tracking-widest">{t('trader.shop_status')}</span>
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${isOpen ? 'bg-brand-100 text-brand-700' : 'bg-red-50 text-red-700'}`}>
                            <div className={`w-1 h-1 rounded-full ${isOpen ? 'bg-brand-600' : 'bg-red-600'} animate-pulse`} />
                            <span className="text-[8px] font-black uppercase tracking-tight">{isOpen ? t('trader.open') : t('trader.closed')}</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-full h-10 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-brand-300 transition-all flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={12} className={isOpen ? 'text-brand-600' : 'text-red-500'} />
                        {t('trader.update_status')}
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1 mt-4">
                <p className="px-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4">Biashara Yako</p>
                {menuItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group active:scale-[0.98] ${
                                isActive 
                                    ? 'bg-brand-600 text-white shadow-xl shadow-brand-900/20' 
                                    : 'text-text-secondary hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <item.icon 
                                    size={20} 
                                    className={isActive ? 'text-brand-200' : 'text-gray-400 group-hover:text-brand-600 transition-colors'} 
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
                        </button>
                    );
                })}
            </nav>

            {/* Footer Area */}
            <div className="p-6 mt-auto space-y-4">
                <button 
                    onClick={() => router.push('/trader/settings')}
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

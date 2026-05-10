'use client';

import React from 'react';
import { 
    LayoutDashboard, 
    Package, 
    Ticket, 
    BarChart3, 
    CreditCard, 
    Settings,
    Store,
    RefreshCw,
    MessageSquare,
    LucideIcon
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/store/authStore';
import { Logo } from '../shared/Logo';
import { LanguageToggle } from '../shared/LanguageToggle';

interface SidebarLinkProps {
    href: string;
    icon: LucideIcon;
    label: string;
    active: boolean;
    count?: number | string;
}

const SidebarLink = ({ href, icon: Icon, label, active, count }: SidebarLinkProps) => {
    const router = useRouter();
    return (
        <button
            onClick={() => router.push(href)}
            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group active:scale-[0.98] ${
                active 
                    ? 'bg-brand-600 text-white shadow-xl shadow-brand-900/20' 
                    : 'text-text-secondary hover:bg-gray-50'
            }`}
        >
            <div className="flex items-center gap-4">
                <Icon 
                    size={20} 
                    className={active ? 'text-brand-200' : 'text-gray-400 group-hover:text-brand-600 transition-colors'} 
                    strokeWidth={active ? 2.5 : 2}
                />
                <span className={`text-sm font-bold tracking-tight ${active ? 'text-white' : ''}`}>
                    {label}
                </span>
            </div>
            {count && (
                <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                    active ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-700'
                }`}>
                    {count}
                </div>
            )}
        </button>
    );
};

export default function TraderSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = React.useState(true);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const getActiveState = (href: string) => {
        if (!mounted) return false;
        if (href === '/trader/products') return pathname.startsWith('/trader/products');
        return pathname === href;
    };

    return (
        <aside className="hidden lg:flex flex-col w-[280px] h-screen bg-white border-r border-gray-100 sticky top-0 left-0 overflow-y-auto no-scrollbar">
            {/* Logo Area */}
            <div className="p-8 pb-2">
                <div onClick={() => router.push('/')} className="cursor-pointer">
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
                        <h2 className="text-lg font-black text-green-950 tracking-tight leading-tight">M-Pesa Store</h2>
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
                        className="w-full h-10 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-brand-300 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                        <RefreshCw size={12} className={isOpen ? 'text-brand-600' : 'text-red-500'} />
                        {t('trader.update_status')}
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 space-y-8 py-6 px-3">
                {/* Core Dash */}
                <div>
                    <p className="px-3 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4">Takwimu na Uhifadhi</p>
                    <div className="space-y-1">
                        <SidebarLink href="/trader/dashboard" icon={LayoutDashboard} label={t('nav.dawati')} active={getActiveState('/trader/dashboard')} />
                        <SidebarLink href="/trader/products" icon={Package} label={t('sidebar.products_stock')} active={getActiveState('/trader/products')} />
                        <SidebarLink href="/trader/reservations" icon={Ticket} label={t('sidebar.order_history')} active={getActiveState('/trader/reservations')} count={3} />
                    </div>
                </div>

                {/* Finance & Management */}
                <div>
                    <p className="px-3 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4">{t('sidebar.store_mgmt')}</p>
                    <div className="space-y-1">
                        <SidebarLink href="/trader/wallet" icon={CreditCard} label={t('sidebar.my_wallet') || 'Wallet Yangu'} active={getActiveState('/trader/wallet')} />
                        <SidebarLink href="/trader/analytics" icon={BarChart3} label={t('sidebar.store_analytics')} active={getActiveState('/trader/analytics')} />
                        <SidebarLink href="/trader/reviews" icon={MessageSquare} label={t('sidebar.reviews')} active={getActiveState('/trader/reviews')} />
                    </div>
                </div>
            </div>

            {/* Footer Area */}
            <div className="p-6 space-y-4 border-t border-gray-100">
                <button 
                    onClick={() => router.push('/trader/profile')}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl text-text-secondary hover:bg-gray-50 transition-all font-bold text-sm"
                >
                    <Settings size={20} className="text-gray-400" />
                    {t('common.settings')}
                </button>
                
                <div className="p-4 bg-gray-50 rounded-3xl space-y-4">
                    <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{t('common.language')}</p>
                        <LanguageToggle />
                    </div>
                    
                    <button 
                        onClick={() => {
                            const { logout } = useAuthStore.getState();
                            logout();
                            router.push('/login');
                        }}
                        className="w-full h-12 flex items-center justify-center p-3 rounded-2xl bg-rose-50 text-rose-600 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-100 active:scale-95 transition-all"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </aside>
    );
}

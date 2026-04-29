'use client';

import React from 'react';
import { 
    X,
    LayoutDashboard, 
    Package, 
    Ticket, 
    BarChart3, 
    CreditCard, 
    Settings,
    ChevronRight,
    Store,
    RefreshCw,
    MessageSquare,
    LogOut
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/store/authStore';
import { Logo } from '../shared/Logo';
import { motion, AnimatePresence } from 'framer-motion';

interface TraderMobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function TraderMobileSidebar({ isOpen, onClose }: TraderMobileSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useTranslation();
    const { logout } = useAuthStore();
    const [isStoreOpen, setIsStoreOpen] = React.useState(true);

    const menuSections = [
        {
            title: 'Takwimu na Uhifadhi',
            items: [
                { icon: LayoutDashboard, label: t('nav.dawati'), path: '/trader/dashboard' },
                { icon: Package, label: t('sidebar.products_stock'), path: '/trader/products' },
                { icon: Ticket, label: t('sidebar.order_history'), path: '/trader/reservations' },
            ]
        },
        {
            title: t('sidebar.store_mgmt') || 'Store Management',
            items: [
                { icon: CreditCard, label: t('sidebar.my_wallet') || 'Wallet Yangu', path: '/trader/wallet' },
                { icon: BarChart3, label: t('sidebar.store_analytics'), path: '/trader/analytics' },
                { icon: MessageSquare, label: t('sidebar.reviews'), path: '/trader/reviews' },
                { icon: Settings, label: t('common.settings'), path: '/profile' },
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
                    key="trader-sidebar-backdrop"
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
                    key="trader-sidebar-drawer"
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[70] flex flex-col shadow-2xl lg:hidden"
                >
                        <div className="p-6 flex items-center justify-between border-b border-gray-100">
                            <Logo variant="light" width={110} />
                            <button 
                                onClick={onClose}
                                className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center active:scale-90 transition-transform"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto w-full no-scrollbar px-4 py-6 space-y-6">
                            {/* Trader Context */}
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white">
                                        <Store size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black text-green-950">M-Pesa Store</h2>
                                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t('sidebar.business_summary')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mb-3 border-t border-gray-200/50 pt-3">
                                    <span className="text-[10px] font-black text-green-950 uppercase tracking-widest">Status</span>
                                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${isStoreOpen ? 'bg-brand-100 text-brand-700' : 'bg-red-50 text-red-700'}`}>
                                        <div className={`w-1 h-1 rounded-full ${isStoreOpen ? 'bg-brand-600' : 'bg-red-600'} animate-pulse`} />
                                        <span className="text-[8px] font-black uppercase tracking-tight">{isStoreOpen ? t('trader.open') : t('trader.closed')}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsStoreOpen(!isStoreOpen)}
                                    className="w-full h-10 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-brand-300 transition-all flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <RefreshCw size={12} className={isStoreOpen ? 'text-brand-600' : 'text-red-500'} />
                                    {t('trader.update_status')}
                                </button>
                            </div>

                            {/* Menu Sections */}
                            {menuSections.map((section, idx) => (
                                <div key={idx} className="space-y-3">
                                    <h4 className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">{section.title}</h4>
                                    <div className="space-y-1">
                                        {section.items.map((item) => {
                                            // Handle exact match for dashboard, startsWith for others
                                            const isActive = item.path === '/trader/dashboard' || item.path === '/profile' 
                                                ? pathname === item.path 
                                                : pathname.startsWith(item.path);
                                            
                                            return (
                                                <button
                                                    key={item.path}
                                                    onClick={() => handleNavigate(item.path)}
                                                    className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all ${
                                                        isActive 
                                                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' 
                                                            : 'text-text-secondary active:bg-gray-50'
                                                    }`}
                                                >
                                                    <item.icon size={18} className={isActive ? 'text-brand-200' : 'text-gray-400'} />
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

                        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                             <button 
                                onClick={() => {
                                    logout();
                                    router.push('/login');
                                }}
                                className="w-full h-12 flex items-center justify-center gap-3 p-3 rounded-2xl text-rose-600 bg-white border border-rose-100 shadow-sm font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 hover:bg-rose-50"
                             >
                                <LogOut size={16} /> Sign Out
                             </button>
                        </div>
                    </motion.div>
            )}
        </AnimatePresence>
    );
}

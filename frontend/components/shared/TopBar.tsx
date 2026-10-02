'use client';

import React from 'react';
import { Search, LogOut, ChevronDown, User as UserIcon, Menu, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageToggle } from './LanguageToggle';
import NotificationBell from './NotificationBell';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useLogout } from '@/hooks/useLogout';
import { useCartStore } from '@/store/cartStore';
import CartFlow from '@/components/resident/CartFlow';

import { Logo } from './Logo';

interface TopBarProps {
    title?: string;
    onMenuToggle?: () => void;
}

export default function TopBar({ title: propTitle, onMenuToggle }: TopBarProps) {
    const { user } = useAuthStore();
    const { logout } = useLogout();
    const { pageTitle } = useUIStore();
    const { t } = useTranslation();
    const router = useRouter();
    const [isProfileOpen, setIsProfileOpen] = React.useState(false);
    const [isCartOpen, setIsCartOpen] = React.useState(false);
    const { items, getTotalItems } = useCartStore();

    // Header title priority: static title prop > store title > translation default
    const displayTitle = propTitle || pageTitle || t('common.dashboard');

    return (
        <header className="sticky top-0 z-40 w-full h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 lg:px-10 flex items-center justify-between transition-all duration-300">
            {/* Left: Title / Breadcrumb / Mobile Logo */}
            <div className="flex items-center gap-3 lg:gap-4 flex-1">
                {/* Mobile Menu Trigger */}
                <button 
                    onClick={onMenuToggle}
                    className="lg:hidden w-12 h-12 flex items-center justify-center bg-brand-50 text-brand-700 rounded-xl active:scale-90 transition-transform flex-shrink-0"
                >
                    <Menu size={24} />
                </button>

                {/* Mobile Logo */}
                <Link href="/" className="lg:hidden active:scale-95 transition-transform">
                    <Logo variant="icon" width={32} height={32} />
                </Link>

                <h2 className="text-xl font-black text-green-950 tracking-tight hidden md:block">
                    {displayTitle}
                </h2>
                
                {/* Desktop Navbar Links */}
                <div className="hidden lg:flex items-center gap-6 ml-4">
                    <div className="w-[1px] h-6 bg-gray-200" />
                    <Link 
                        href="/" 
                        className="text-sm font-bold text-text-secondary hover:text-brand-600 transition-colors flex items-center gap-2"
                    >
                        Home
                    </Link>
                </div>

                <div className="w-[1px] h-6 bg-gray-200 hidden md:block lg:hidden" />
                <div className="relative group max-w-md hidden sm:block w-64 lg:w-96 ml-auto lg:ml-0">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder={t('common.search_placeholder')}
                        className="w-full h-11 pl-11 pr-4 bg-gray-50 border-transparent focus:bg-white focus:border-brand-100 rounded-xl text-sm font-medium transition-all placeholder:text-gray-400 outline-none"
                    />
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 lg:gap-4">
                <div className="hidden lg:block">
                    <LanguageToggle />
                </div>
                <NotificationBell />

                {user?.role === 'resident' && (
                    <button 
                        onClick={() => setIsCartOpen(true)}
                        className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-gray-500 hover:text-brand-600"
                    >
                        <ShoppingCart size={20} />
                        {items.length > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-brand-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm">
                                {getTotalItems()}
                            </span>
                        )}
                    </button>
                )}

                <div className="w-[1px] h-6 bg-gray-200" />

                {/* Profile Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-2 lg:gap-3 p-1 hover:bg-gray-50 rounded-2xl transition-all active:scale-95"
                    >
                        <div className="w-9 h-9 lg:w-10 lg:h-10 bg-brand-50 text-brand-700 rounded-xl flex items-center justify-center font-black shadow-sm relative overflow-hidden">
                            {user?.avatar_url ? (
                                <Image src={user.avatar_url} alt={user.name || ''} fill className="object-cover rounded-xl" />
                            ) : (
                                <UserIcon size={18} />
                            )}
                        </div>
                        <div className="text-left hidden lg:block">
                            <p className="text-xs font-black text-green-950 leading-none mb-1">{user?.name}</p>
                            <p className="text-[10px] text-brand-600 font-bold uppercase tracking-widest">{user?.role}</p>
                        </div>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 hidden md:block ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isProfileOpen && (
                            <motion.div 
                                key="profile-backdrop"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-10" 
                                onClick={() => setIsProfileOpen(false)} 
                            />
                        )}
                        {isProfileOpen && (
                            <motion.div 
                                key="profile-dropdown"
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-20"
                            >
                                <button 
                                    onClick={() => {
                                        setIsProfileOpen(false);
                                        router.push('/profile');
                                    }}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl text-sm font-bold text-gray-700 transition-colors"
                                >
                                    <UserIcon size={18} /> {t('common.profile')}
                                </button>
                                <div className="h-[1px] bg-gray-100 my-2 mx-2" />
                                <button 
                                    onClick={logout}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-xl text-sm font-bold text-red-600 transition-colors"
                                >
                                    <LogOut size={18} /> {t('common.logout')}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence>
                {isCartOpen && <CartFlow onClose={() => setIsCartOpen(false)} />}
            </AnimatePresence>
        </header>
    );
}

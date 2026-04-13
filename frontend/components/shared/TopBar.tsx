'use client';

import React from 'react';
import { Search, Bell, LogOut, ChevronDown, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageToggle } from './LanguageToggle';
import NotificationBell from './NotificationBell';
import { motion, AnimatePresence } from 'framer-motion';

import { Logo } from './Logo';

interface TopBarProps {
    title?: string;
}

export default function TopBar({ title }: TopBarProps) {
    const { user, logout } = useAuthStore();
    const { t } = useTranslation();
    const [isProfileOpen, setIsProfileOpen] = React.useState(false);

    return (
        <header className="sticky top-0 z-40 w-full h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 lg:px-10 flex items-center justify-between transition-all duration-300">
            {/* Left: Title / Breadcrumb / Mobile Logo */}
            <div className="flex items-center gap-4 flex-1">
                {/* Mobile Logo */}
                <div className="lg:hidden">
                    <Logo variant="icon" width={36} height={36} />
                </div>

                <h2 className="text-xl font-black text-green-950 tracking-tight hidden md:block">
                    {title || t('common.dashboard')}
                </h2>
                <div className="w-[1px] h-6 bg-gray-200 hidden md:block" />
                <div className="relative group max-w-md w-64 lg:w-96">
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

                <div className="w-[1px] h-6 bg-gray-200 ml-2" />

                {/* Profile Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-3 p-1.5 pr-3 hover:bg-gray-50 rounded-2xl transition-all active:scale-95"
                    >
                        <div className="w-10 h-10 bg-brand-50 text-brand-700 rounded-xl flex items-center justify-center font-black shadow-sm">
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <UserIcon size={20} />
                            )}
                        </div>
                        <div className="text-left hidden sm:block">
                            <p className="text-xs font-black text-green-950 leading-none mb-1">{user?.name}</p>
                            <p className="text-[10px] text-brand-600 font-bold uppercase tracking-widest">{user?.role}</p>
                        </div>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isProfileOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)} />
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-20"
                                >
                                    <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl text-sm font-bold text-gray-700 transition-colors">
                                        <UserIcon size={18} /> {t('common.profile')}
                                    </button>
                                    <div className="h-[1px] bg-gray-100 my-2 mx-2" />
                                    <button 
                                        onClick={() => logout()}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-xl text-sm font-bold text-red-600 transition-colors"
                                    >
                                        <LogOut size={18} /> {t('common.logout')}
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
}

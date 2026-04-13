'use client';

import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { 
    User as UserIcon, 
    Phone, 
    ShieldCheck, 
    Languages, 
    LogOut, 
    ChevronRight, 
    BadgeCheck,
    CreditCard,
    HelpCircle,
    Settings,
    Bell,
    LucideIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LanguageToggle } from '@/components/shared/LanguageToggle';

export default function ProfilePage() {
    const { user, logout } = useAuthStore();
    const { t } = useTranslation();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    interface ProfileItem {
        icon: LucideIcon;
        label: string;
        value?: string;
        color: string;
        path?: string;
        component?: React.ReactNode;
    }

    interface ProfileSection {
        title: string;
        items: ProfileItem[];
    }

    const sections: ProfileSection[] = [
        {
            title: 'Account Settings',
            items: [
                { icon: ShieldCheck, label: 'Security & Verification', value: user?.phone_verified ? 'Verified' : 'Pending', color: 'text-green-600', path: '/verify' },
                { icon: CreditCard, label: 'Payment Methods', value: 'M-Pesa Only', color: 'text-brand-600', path: '/profile' },
                { icon: Bell, label: 'Notifications', value: 'On', color: 'text-amber-500', path: '/notifications' },
            ]
        },
        {
            title: 'Preferences',
            items: [
                { icon: Languages, label: 'App Language', component: <LanguageToggle />, color: 'text-indigo-600' },
                { icon: Settings, label: 'Display Settings', value: 'Light Mode', color: 'text-gray-600', path: '/profile' },
            ]
        },
        {
            title: 'Support',
            items: [
                { icon: HelpCircle, label: 'Help Center & FAQ', color: 'text-blue-500', path: '/help' },
                { icon: BadgeCheck, label: 'Market Permits', color: 'text-brand-600', path: '/profile' },
            ]
        }
    ];

    if (!user) return null;

    return (
        <DashboardLayout title={t('common.profile')}>
            <div className="max-w-2xl mx-auto pb-12 animate-fade-up">
                
                {/* Profile Header */}
                <div className="relative mb-8 pt-6">
                    <div className="flex flex-col items-center">
                        <div className="relative mb-4 group">
                            <div className="w-32 h-32 bg-brand-50 rounded-[2.5rem] border-4 border-white shadow-brand-md flex items-center justify-center text-brand-600 transition-transform group-hover:scale-105">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover rounded-[2.5rem]" />
                                ) : (
                                    <UserIcon size={56} />
                                )}
                            </div>
                            {user.phone_verified && (
                                <div className="absolute -right-2 -bottom-2 w-10 h-10 bg-green-500 text-white rounded-2xl flex items-center justify-center border-4 border-white shadow-lg">
                                    <BadgeCheck size={20} />
                                </div>
                            )}
                        </div>
                        <h2 className="text-2xl font-black text-green-950 px-2">{user.name}</h2>
                        <div className="flex items-center gap-2 text-text-secondary mt-1 font-bold italic">
                            <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                                {user.role}
                            </span>
                            <span className="flex items-center gap-1 text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-600 font-mono tracking-tighter">
                                <Phone size={14} /> {user.phone}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Account Sections */}
                <div className="space-y-6 px-4">
                    {sections.map((section, idx) => (
                        <div key={idx} className="space-y-3">
                            <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em] ml-4">{section.title}</h3>
                            <div className="bg-white border border-border-default rounded-[2rem] overflow-hidden shadow-brand-sm">
                                {section.items.map((item, iIndex) => (
                                    <div 
                                        key={iIndex}
                                        onClick={() => item.path && router.push(item.path)}
                                        className={`flex items-center justify-between p-5 hover:bg-neutral-50 transition-colors cursor-pointer ${iIndex !== section.items.length - 1 ? 'border-b border-gray-50' : ''}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`${item.color} w-10 h-10 rounded-xl bg-opacity-10 flex items-center justify-center`}>
                                                <item.icon size={20} />
                                            </div>
                                            <span className="font-bold text-green-950 text-sm">{item.label}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {item.value && <span className="text-xs font-black text-brand-600 uppercase tracking-widest">{item.value}</span>}
                                            {item.component}
                                            {item.path && <ChevronRight size={18} className="text-text-muted" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Dangerous Territory */}
                    <div className="pt-6">
                        <button 
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-3 p-5 rounded-[2rem] bg-red-50 text-red-600 font-black text-lg hover:bg-red-100 active:scale-[0.98] transition-all shadow-sm border border-red-100"
                        >
                            <LogOut size={22} />
                            Sign Out Account
                        </button>
                        <p className="text-center text-[10px] text-text-muted font-bold uppercase tracking-widest mt-6">
                            Soko Mtaa v1.0.4 • Kenya Pride
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

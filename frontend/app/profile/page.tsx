'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
    User as UserIcon, 
    Mail, 
    Phone, 
    Globe, 
    Lock, 
    LogOut, 
    Camera, 
    CheckCircle2, 
    ChevronRight,
    Loader2,
    Shield,
    Languages,
    Bell,
    CreditCard
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiResponse, User } from '@/types';
import { useAuthStore } from '@/store/authStore';
import Image from 'next/image';



export default function ResidentProfilePage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { logout } = useAuthStore();
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [language, setLanguage] = useState<'en' | 'sw'>('sw');

    const { data: profileData, isLoading } = useQuery<ApiResponse<User>>({
        queryKey: ['profile'],
        queryFn: () => api.get('/profile').then(res => res.data),
    });

    useEffect(() => {
        if (profileData?.data) {
            setName(profileData.data.name);
            setEmail(profileData.data.email || '');
            setLanguage(profileData.data.preferred_language);
        }
    }, [profileData]);

    const updateProfileMutation = useMutation({
        mutationFn: (data: Partial<User>) => api.patch('/profile', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        }
    });

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
            logout();
            router.push('/login');
        } catch (error) {
            logout();
            router.push('/login');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-brand-600 mb-4" size={48} />
                <p className="text-sm font-black text-brand-700 uppercase tracking-widest animate-pulse">Safisha Wasifu...</p>
            </div>
        );
    }

    const user = profileData?.data;

    return (
        <DashboardLayout title="Wasifu Wangu (My Profile)">
            <div className="space-y-6 pb-20">
                
                {/* 1. Profile Header (Card Style) */}
                <div className="bg-green-950 p-8 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24" />
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="relative group">
                            <div className="w-28 h-28 bg-brand-500 rounded-[2.5rem] flex items-center justify-center text-4xl font-black shadow-xl border-4 border-white/20 relative overflow-hidden">
                                {user?.avatar_url ? (
                                    <Image src={user.avatar_url} alt={user.name} fill className="object-cover" />
                                ) : (
                                    user?.name.charAt(0)
                                )}
                            </div>
                            <button className="absolute bottom-1 right-1 w-10 h-10 bg-white text-green-950 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
                                <Camera size={18} />
                            </button>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">{user?.name}</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-300">Resident • Verified</p>
                        </div>
                    </div>
                </div>

                {/* 2. Account Details */}
                <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-brand-sm space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-green-950 px-2 flex items-center gap-2">
                        <Shield size={16} className="text-brand-600" />
                        Account Details
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-2">Full Name</label>
                             <div className="relative">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                                <input 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full h-14 pl-12 pr-4 bg-neutral-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-500 transition-all font-bold text-sm"
                                    placeholder="Your Name"
                                />
                             </div>
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-2">Email Address</label>
                             <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                                <input 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-14 pl-12 pr-4 bg-neutral-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-500 transition-all font-bold text-sm"
                                    placeholder="Your Email"
                                />
                             </div>
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-2">Phone Number</label>
                             <div className="relative opacity-60">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                                <input 
                                    value={user?.phone || ''}
                                    disabled
                                    className="w-full h-14 pl-12 pr-4 bg-neutral-50 rounded-2xl border-none font-bold text-sm"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-green-100 text-green-600 p-1 rounded-lg">
                                    <CheckCircle2 size={16} />
                                </div>
                             </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => updateProfileMutation.mutate({ name, email })}
                        disabled={updateProfileMutation.isPending}
                        className="w-full h-16 bg-brand-600 text-white rounded-2xl flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest shadow-xl shadow-brand-100 active:scale-95 transition-all"
                    >
                        {updateProfileMutation.isPending ? <Loader2 className="animate-spin" /> : 'Sasisha Habari (Save)'}
                    </button>
                </div>

                {/* 3. Preferences */}
                <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-brand-sm space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-green-950 px-2 flex items-center gap-2">
                        <Languages size={16} className="text-brand-600" />
                        Preferences
                    </h3>

                    <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <Globe size={20} className="text-text-muted" />
                            <span className="text-sm font-black text-green-950">Lugha (Language)</span>
                        </div>
                        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                            {(['en', 'sw'] as const).map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => {
                                        setLanguage(lang);
                                        updateProfileMutation.mutate({ preferred_language: lang });
                                    }}
                                    className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                                        language === lang ? 'bg-brand-600 text-white shadow-md' : 'text-text-muted'
                                    }`}
                                >
                                    {lang === 'en' ? 'ENG' : 'SW'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 4. Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => router.push('/payments')}
                        className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center text-center gap-3 active:scale-95 transition-all"
                    >
                        <CreditCard size={24} className="text-amber-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-green-950">Payment History</span>
                    </button>
                    <button 
                        onClick={() => router.push('/complaints')}
                        className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center text-center gap-3 active:scale-95 transition-all"
                    >
                        <Bell size={24} className="text-blue-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-green-950">My Alerts</span>
                    </button>
                </div>

                {/* 5. Security & Logout */}
                <div className="space-y-4 pt-4">
                    <button className="w-full h-16 bg-white border-2 border-gray-100 rounded-2xl flex items-center justify-between px-6 active:scale-95 transition-all">
                        <div className="flex items-center gap-3">
                            <Lock size={20} className="text-text-muted" />
                            <span className="text-sm font-black text-green-950">Badilisha Nenosiri</span>
                        </div>
                        <ChevronRight size={20} className="text-text-muted" />
                    </button>
                    
                    <button 
                        onClick={handleLogout}
                        className="w-full h-20 bg-red-50 text-red-600 rounded-[2.5rem] flex items-center justify-center gap-3 text-sm font-black uppercase tracking-[0.2em] active:scale-95 transition-all"
                    >
                        <LogOut size={24} />
                        Ondoka (Sign Out)
                    </button>
                </div>

                <div className="text-center pb-8">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Soko Mtaa v1.2.0 • Phase 2</p>
                </div>
            </div>
        </DashboardLayout>
    );
}

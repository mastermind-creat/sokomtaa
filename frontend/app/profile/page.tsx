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
    CreditCard,
    History,
    Settings2,
    ShieldCheck,
    Palette
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiResponse, User } from '@/types';
import { useAuthStore } from '@/store/authStore';
import Image from 'next/image';
import { useTranslation } from '@/hooks/useTranslation';

export default function ResidentProfilePage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { logout } = useAuthStore();
    const { t, locale, toggleLocale } = useTranslation();
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const { data: profileData, isLoading } = useQuery<ApiResponse<User>>({
        queryKey: ['profile'],
        queryFn: () => api.get('/profile').then(res => res.data),
    });

    useEffect(() => {
        if (profileData?.data) {
            setName(profileData.data.name);
            setEmail(profileData.data.email || '');
        }
    }, [profileData]);

    const updateProfileMutation = useMutation({
        mutationFn: (data: Partial<User>) => api.patch('/profile', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            setIsUpdating(false);
        },
        onError: () => {
            setIsUpdating(false);
        }
    });

    const { mutate: uploadAvatar, isPending: isUploadingAvatar } = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('avatar', file);
            return api.post('/profile/avatar', formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
    });

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            uploadAvatar(e.target.files[0]);
        }
    };

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
            <div className="min-h-screen bg-surface-base flex flex-col items-center justify-center">
                <div className="relative">
                    <Loader2 className="animate-spin text-brand-600 mb-4" size={48} />
                    <div className="absolute inset-0 blur-xl bg-brand-400/20 animate-pulse" />
                </div>
                <p className="text-xs font-black text-brand-700 uppercase tracking-[0.3em] animate-pulse">Loading Profile...</p>
            </div>
        );
    }

    const user = profileData?.data;

    return (
        <DashboardLayout title="My Account">
            <div className="max-w-4xl mx-auto space-y-10 pb-32">
                
                {/* 1. Profile Hero Section */}
                <section className="relative">
                    <div className="bg-gradient-to-br from-green-950 via-green-900 to-brand-900 p-10 lg:p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                        {/* Abstract background elements */}
                        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-40 -mt-40 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-500/10 rounded-full -ml-32 -mb-32 blur-2xl" />
                        
                        <div className="relative flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                            <div className="relative group">
                                <motion.div 
                                    whileHover={{ scale: 1.05 }}
                                    className="w-32 h-32 lg:w-40 lg:h-40 bg-brand-500 rounded-[3rem] flex items-center justify-center text-5xl font-black shadow-2xl border-4 border-white/20 relative overflow-hidden"
                                >
                                    {user?.avatar_url ? (
                                        <Image src={user.avatar_url} alt={user.name} fill className="object-cover" />
                                    ) : (
                                        <span className="text-white opacity-90">{user?.name?.charAt(0)}</span>
                                    )}
                                </motion.div>
                                <label className="absolute bottom-2 right-2 w-12 h-12 bg-white text-green-950 rounded-2xl flex items-center justify-center shadow-2xl hover:bg-brand-50 active:scale-90 transition-all border border-gray-100 cursor-pointer">
                                    {isUploadingAvatar ? (
                                        <Loader2 size={20} className="animate-spin text-brand-600" />
                                    ) : (
                                        <Camera size={20} />
                                    )}
                                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                                </label>
                            </div>

                            <div className="text-center lg:text-left space-y-3">
                                <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                                    <span className="px-3 py-1 bg-brand-500/20 backdrop-blur-md border border-brand-500/30 rounded-full text-[10px] font-black uppercase tracking-widest text-brand-300">
                                        Resident Member
                                    </span>
                                    {user?.phone_verified ? (
                                        <span className="px-3 py-1 bg-blue-500/20 backdrop-blur-md border border-blue-500/30 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-300 flex items-center gap-1.5">
                                            <CheckCircle2 size={12} /> Verified
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-amber-500/20 backdrop-blur-md border border-amber-500/30 rounded-full text-[10px] font-black uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
                                            <Shield size={12} /> Pending Verification
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-3xl lg:text-5xl font-black tracking-tight leading-tight">{user?.name}</h2>
                                <p className="text-brand-200/80 text-sm font-medium flex items-center justify-center lg:justify-start gap-2">
                                    <Mail size={14} /> {user?.email || 'No email provided'}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Personal Information */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-brand-sm space-y-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-green-950 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                                        <UserIcon size={18} />
                                    </div>
                                    Personal Information
                                </h3>
                                {!isUpdating ? (
                                    <button 
                                        onClick={() => setIsUpdating(true)}
                                        className="text-[10px] font-black uppercase tracking-widest text-brand-600 hover:text-brand-700"
                                    >
                                        Edit Details
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => setIsUpdating(false)}
                                        className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-text-primary"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2.5">
                                     <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] pl-1">Display Name</label>
                                     <div className="relative group">
                                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-600 transition-colors" size={18} />
                                        <input 
                                            value={name}
                                            disabled={!isUpdating}
                                            onChange={(e) => setName(e.target.value)}
                                            className={`w-full h-14 pl-12 pr-4 bg-neutral-50 rounded-2xl border-2 transition-all font-bold text-sm outline-none ${
                                                isUpdating ? 'border-brand-100 bg-white focus:border-brand-500 shadow-inner' : 'border-transparent'
                                            }`}
                                            placeholder="Your Name"
                                        />
                                     </div>
                                </div>

                                <div className="space-y-2.5">
                                     <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] pl-1">Email Address</label>
                                     <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-600 transition-colors" size={18} />
                                        <input 
                                            value={email}
                                            disabled={!isUpdating}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className={`w-full h-14 pl-12 pr-4 bg-neutral-50 rounded-2xl border-2 transition-all font-bold text-sm outline-none ${
                                                isUpdating ? 'border-brand-100 bg-white focus:border-brand-500 shadow-inner' : 'border-transparent'
                                            }`}
                                            placeholder="Your Email"
                                        />
                                     </div>
                                </div>

                                <div className="space-y-2.5 md:col-span-2">
                                     <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] pl-1">Phone Number (Primary ID)</label>
                                     <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                                        <input 
                                            value={user?.phone || ''}
                                            disabled
                                            className="w-full h-14 pl-12 pr-32 bg-neutral-50 rounded-2xl border-transparent font-black text-sm opacity-60"
                                        />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                            {user?.phone_verified ? (
                                                <div className="flex items-center gap-2 bg-green-50 text-green-600 px-3 py-1.5 rounded-xl border border-green-100">
                                                    <ShieldCheck size={14} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Verified</span>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => router.push('/verify')}
                                                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                                                >
                                                    Verify Now
                                                </button>
                                            )}
                                        </div>
                                     </div>
                                </div>
                            </div>

                            <AnimatePresence>
                                {isUpdating && (
                                    <motion.button 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        onClick={() => updateProfileMutation.mutate({ name, email })}
                                        disabled={updateProfileMutation.isPending}
                                        className="w-full h-16 bg-brand-600 text-white rounded-2xl flex items-center justify-center gap-3 text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-200 active:scale-95 transition-all"
                                    >
                                        {updateProfileMutation.isPending ? <Loader2 className="animate-spin" /> : 'Save Changes'}
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Order History Preview Card */}
                        <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-brand-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                            <div className="flex items-center gap-6 relative">
                                <div className="w-16 h-16 bg-brand-50 rounded-[1.5rem] flex items-center justify-center text-brand-600 shadow-inner shrink-0">
                                    <History size={32} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xl font-black text-green-950 tracking-tight">Activity & History</h4>
                                    <p className="text-xs text-text-secondary font-medium">Track your recent reservations and market interactions.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => router.push('/reservations')}
                                className="px-8 h-14 bg-green-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-brand-600 transition-all active:scale-95 relative"
                            >
                                View All Orders
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Preferences & Security */}
                    <div className="space-y-8">
                        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-brand-sm space-y-8">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-green-950 px-1 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                                    <Settings2 size={16} />
                                </div>
                                Preferences
                            </h3>

                            <div className="space-y-6">
                                {/* Language */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Globe size={16} className="text-text-muted" />
                                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Language</span>
                                        </div>
                                        <span className="text-[10px] font-black text-brand-600 uppercase">{locale === 'en' ? 'English' : 'Swahili'}</span>
                                    </div>
                                    <div className="flex bg-neutral-50 p-1.5 rounded-2xl border border-neutral-100 shadow-inner">
                                        {(['en', 'sw'] as const).map((lang) => (
                                            <button
                                                key={lang}
                                                onClick={() => {
                                                    if (locale !== lang) toggleLocale();
                                                    updateProfileMutation.mutate({ preferred_language: lang });
                                                }}
                                                className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${
                                                    locale === lang ? 'bg-white text-green-950 shadow-md' : 'text-text-muted hover:text-text-primary'
                                                }`}
                                            >
                                                {lang === 'en' ? 'ENG' : 'SW'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="h-[1px] bg-gray-50" />

                                {/* Notifications Toggle Mock */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Bell size={20} className="text-text-muted" />
                                        <span className="text-sm font-bold text-green-950">Notifications</span>
                                    </div>
                                    <div className="w-12 h-6 bg-brand-600 rounded-full relative flex items-center px-1 shadow-inner">
                                        <div className="w-4 h-4 bg-white rounded-full ml-auto" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-brand-sm space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-green-950 px-1 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Lock size={16} />
                                </div>
                                Security
                            </h3>

                            <div className="space-y-4">
                                <button className="w-full h-14 flex items-center justify-between px-4 bg-neutral-50 rounded-2xl hover:bg-neutral-100 transition-all border border-transparent hover:border-gray-100">
                                    <span className="text-xs font-bold text-green-950">Change Password</span>
                                    <ChevronRight size={16} className="text-text-muted" />
                                </button>
                                <button className="w-full h-14 flex items-center justify-between px-4 bg-neutral-50 rounded-2xl hover:bg-neutral-100 transition-all border border-transparent hover:border-gray-100">
                                    <span className="text-xs font-bold text-green-950">Two-Factor Auth</span>
                                    <span className="text-[9px] font-black uppercase text-text-muted">Off</span>
                                </button>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button 
                            onClick={handleLogout}
                            className="w-full h-20 bg-rose-50 text-rose-600 rounded-[2.5rem] flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.25em] active:scale-95 transition-all border border-rose-100 shadow-sm shadow-rose-900/5 hover:bg-rose-100"
                        >
                            <LogOut size={22} />
                            Sign Out
                        </button>
                    </div>
                </div>

                <div className="text-center pt-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-50 rounded-full border border-gray-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Soko Mtaa Ecosystem v2.1.0</p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

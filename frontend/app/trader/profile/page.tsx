'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Camera, Store, Clock, Phone, Upload, User,
    Key, Save, Eye, EyeOff, Loader2, ShieldCheck,
    MapPin, FileText
} from 'lucide-react';
import api from '@/lib/api';
import { ApiResponse } from '@/types';

import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

import Image from 'next/image';

interface TraderProfile {
    business_name: string;
    business_name_sw: string;
    description: string;
    mpesa_number: string;
    opening_time: string;
    closing_time: string;
    is_open: boolean;
    permit_number: string;
    stall_type: 'managed' | 'independent';
    latitude: number | null;
    longitude: number | null;
    id_front_url: string | null;
    id_back_url: string | null;
    selfie_url: string | null;
    banner_url: string | null;
    avatar_url: string | null;
    user: { name: string; phone: string; email: string; };
}

function FormField({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-bold text-text-primary mb-2">{label}</label>
            {children}
        </div>
    );
}

export default function TraderProfilePage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [saved, setSaved] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
    const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
    const { setPageTitle } = useUIStore();
    const { user: authUser, refreshUser } = useAuthStore();
    
    React.useEffect(() => {
        setPageTitle('My Profile');
        refreshUser();
    }, [setPageTitle, refreshUser]);

    const { data: profile, isLoading, error: profileError } = useQuery({
        queryKey: ['trader-profile-full'],
        queryFn: async () => {
            const res = await api.get<never, ApiResponse<TraderProfile>>('/trader/me');
            return res.data;
        },
        retry: false
    });

    const { data: markets, isLoading: marketsLoading } = useQuery({
        queryKey: ['markets-list'],
        queryFn: async () => {
            const res = await api.get<never, ApiResponse<any[]>>('/markets');
            return res.data;
        }
    });

    const isFirstTimeSetup = (profileError as any)?.code === 'NOT_FOUND';

    const [form, setForm] = useState<Partial<TraderProfile & { market_id: number; stall_number: string }>>({});
    const current: Partial<TraderProfile & { market_id: number; stall_number: string }> = { ...profile, ...form };

    const { mutate: setupProfile, isPending: isSettingUp } = useMutation({
        mutationFn: (data: any) => api.post('/trader/setup', data),
        onSuccess: async () => {
            await refreshUser();
            queryClient.invalidateQueries({ queryKey: ['trader-profile-full'] });
            setSaved(true);
            setTimeout(() => {
                setSaved(false);
                if (isFirstTimeSetup) router.push('/trader/dashboard');
            }, 1500);
            setForm({});
        },
        onError: (err: any) => {
            alert(err.message || 'Failed to setup profile. Please check your details.');
        }
    });


    const { mutate: saveProfile, isPending: isUpdating } = useMutation({
        mutationFn: (data: Partial<TraderProfile>) => api.put('/trader/update', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trader-profile-full'] });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
            setForm({});
        },
        onError: (err: any) => {
            alert(err.message || 'Failed to save profile.');
        }
    });

    const { mutate: submitKyc, isPending: isSubmittingKyc } = useMutation({
        mutationFn: async (data: { id_front: File; id_back: File; selfie?: File }) => {
            const formData = new FormData();
            formData.append('id_front', data.id_front);
            formData.append('id_back', data.id_back);
            if (data.selfie) formData.append('selfie', data.selfie);
            return api.post('/trader/kyc', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trader-profile-full'] });
            alert('KYC documents submitted successfully!');
        },
        onError: (err: any) => {
            alert(err.message || 'Failed to submit KYC documents.');
        }
    });

    const isPending = isSettingUp || isUpdating || isSubmittingKyc;

    const { mutate: uploadAvatar, isPending: isUploadingAvatar } = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('avatar', file);
            return api.post('/trader/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trader-profile-full'] });
        },
    });

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            uploadAvatar(e.target.files[0]);
        }
    };

    const set = (key: keyof TraderProfile, value: string | boolean) =>
        setForm(f => ({ ...f, [key]: value }));

    if (isLoading || (isFirstTimeSetup && marketsLoading)) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
                <div className="h-52 bg-gray-100 rounded-3xl animate-pulse" />
                <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
            </div>
        );
    }

    return (
        <>
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-10">
            {isFirstTimeSetup && (
                <div className="mb-6 p-6 bg-brand-50 border border-brand-100 rounded-[2.5rem] flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white shrink-0">
                        <Store size={24} />
                    </div>
                    <div>
                        <h4 className="text-brand-950 font-black text-sm uppercase tracking-tight">Complete Your Setup</h4>
                        <p className="text-brand-700 text-xs font-bold mt-0.5">Tell us about your business and stall to start selling.</p>
                    </div>
                </div>
            )}

            {/* Banner & Avatar */}
            <div className="relative rounded-3xl overflow-hidden">
                <div className="h-36 bg-gradient-to-r from-primary to-primary-light">
                    {current.banner_url && (
                        <Image
                            src={current.banner_url}
                            alt="Banner"
                            fill
                            className="object-cover"
                        />
                    )}
                    <button className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-2 bg-black/40 text-white rounded-xl text-xs font-bold hover:bg-black/60 transition-colors backdrop-blur-sm">
                        <Camera className="w-3.5 h-3.5" /> Change Banner
                    </button>
                </div>
                <div className="absolute -bottom-6 left-5">
                    <div className="relative w-20 h-20 rounded-2xl border-4 border-white bg-primary/10 overflow-hidden shadow-lg group">
                        {current.avatar_url ? (
                            <Image
                                src={current.avatar_url}
                                alt="Avatar"
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl font-black text-primary">
                                {current.business_name?.charAt(0) ?? '?'}
                            </div>
                        )}

                            {isUploadingAvatar ? (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
                                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                                </div>
                            ) : (
                                <label className="absolute inset-0 cursor-pointer bg-black/20 flex items-center justify-center rounded-2xl opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40">
                                        <Camera className="w-4 h-4 text-white" />
                                    </div>
                                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                                </label>
                            )}
                    </div>
                </div>
            </div>
            <div className="h-8" /> {/* spacer for avatar overhang */}

            {/* Business Info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h2 className="flex items-center gap-2 text-sm font-black text-text-primary uppercase tracking-wider">
                    <Store className="w-4 h-4" /> {isFirstTimeSetup ? 'Registration' : 'Business Info'}
                </h2>

                {isFirstTimeSetup && (
                    <>
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-text-primary">Where is your stall located?</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => set('stall_type', 'managed')}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                        (current.stall_type ?? 'managed') === 'managed'
                                            ? 'border-primary bg-primary/5'
                                            : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                                    }`}
                                >
                                    <Store className={(current.stall_type ?? 'managed') === 'managed' ? 'text-primary' : 'text-gray-400'} />
                                    <span className="text-xs font-black uppercase tracking-wider">Inside Market</span>
                                </button>
                                <button
                                    onClick={() => set('stall_type', 'independent')}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                        current.stall_type === 'independent'
                                            ? 'border-primary bg-primary/5'
                                            : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                                    }`}
                                >
                                    <MapPin className={current.stall_type === 'independent' ? 'text-primary' : 'text-gray-400'} />
                                    <span className="text-xs font-black uppercase tracking-wider">Independent</span>
                                </button>
                            </div>
                        </div>

                        {(current.stall_type ?? 'managed') === 'managed' ? (
                            <>
                                <FormField label="Select Your Market" id="market">
                                    <select
                                        id="market"
                                        value={current.market_id ?? ''}
                                        onChange={e => set('market_id' as any, e.target.value)}
                                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                                    >
                                        <option value="">Choose a market...</option>
                                        {markets?.map(m => (
                                            <option key={m.id} value={m.id}>{m.name} - {m.estate}</option>
                                        ))}
                                    </select>
                                </FormField>
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                    <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-2">
                                        <Clock size={12} /> Stall Allocation Note
                                    </p>
                                    <p className="text-blue-600 text-xs mt-1 font-medium">
                                        After registration, the county admin will review your profile and allocate a physical stall for your business.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-2">
                                        <MapPin size={12} /> Independent Stall Location
                                    </p>
                                    <p className="text-amber-600 text-xs mt-1 font-medium">
                                        Please provide your stall's exact location so residents can find you easily.
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (navigator.geolocation) {
                                            navigator.geolocation.getCurrentPosition((pos) => {
                                                setForm(f => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
                                                alert('Location captured successfully!');
                                            }, (err) => {
                                                alert('Failed to get location: ' + err.message);
                                            });
                                        } else {
                                            alert('Geolocation is not supported by your browser.');
                                        }
                                    }}
                                    className="w-full h-12 flex items-center justify-center gap-2 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-black uppercase tracking-wider hover:bg-green-100 transition-all"
                                >
                                    <MapPin size={18} />
                                    {current.latitude ? 'Location Captured ✓' : 'Get Current Location'}
                                </button>
                                {current.latitude && (
                                    <p className="text-center text-[10px] font-mono text-gray-400">
                                        Lat: {current.latitude.toFixed(6)}, Lng: {current.longitude?.toFixed(6)}
                                    </p>
                                )}
                            </div>
                        )}
                    </>
                )}

                <FormField label="Business Name (English)" id="bizName">
                    <input
                        id="bizName"
                        type="text"
                        value={(current.business_name as string) ?? ''}
                        onChange={e => set('business_name', e.target.value)}
                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    />
                </FormField>
                <FormField label="Business Name (Swahili)" id="bizNameSw">
                    <input
                        id="bizNameSw"
                        type="text"
                        value={(current.business_name_sw as string) ?? ''}
                        onChange={e => set('business_name_sw', e.target.value)}
                        placeholder="Optional — shown when Swahili is selected"
                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                </FormField>
                <FormField label="Description" id="description">
                    <textarea
                        id="description"
                        rows={4}
                        value={(current.description as string) ?? ''}
                        onChange={e => set('description', e.target.value)}
                        placeholder="Tell customers what you sell..."
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                </FormField>
            </div>

            {/* Trading Hours */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h2 className="flex items-center gap-2 text-sm font-black text-text-primary uppercase tracking-wider">
                    <Clock className="w-4 h-4" /> Trading Hours
                </h2>
                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Opens At" id="openTime">
                        <input id="openTime" type="time" value={(current.opening_time as string) ?? ''} onChange={e => set('opening_time', e.target.value)}
                            className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </FormField>
                    <FormField label="Closes At" id="closeTime">
                        <input id="closeTime" type="time" value={(current.closing_time as string) ?? ''} onChange={e => set('closing_time', e.target.value)}
                            className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </FormField>
                </div>
                <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-semibold text-text-primary">Currently Open</span>
                    <button
                        onClick={() => set('is_open', !(current.is_open))}
                        className={`relative w-12 h-6 rounded-full transition-colors ${current.is_open ? 'bg-green-500' : 'bg-gray-200'}`}
                        aria-label="Toggle open status"
                        role="switch"
                        aria-checked={!!current.is_open}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${current.is_open ? 'translate-x-6' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h2 className="flex items-center gap-2 text-sm font-black text-text-primary uppercase tracking-wider">
                    <Phone className="w-4 h-4" /> M-Pesa Details
                </h2>
                <FormField label="M-Pesa Number" id="mpesa">
                    <input id="mpesa" type="tel" value={(current.mpesa_number as string) ?? ''}
                        onChange={e => set('mpesa_number', e.target.value)}
                        placeholder="+254 7XX XXX XXX"
                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono" />
                </FormField>
            </div>

            {/* KYC Verification */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h2 className="flex items-center gap-2 text-sm font-black text-text-primary uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" /> KYC Verification
                </h2>
                <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                    <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider flex items-center gap-2">
                        <FileText size={12} /> Identity Documents
                    </p>
                    <p className="text-green-600 text-xs mt-1 font-medium">
                        Upload your National ID to be verified. This helps build trust with your customers.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID Front</label>
                        <div className="relative aspect-[3/2] bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all overflow-hidden group">
                            {current.id_front_url ? (
                                <Image src={current.id_front_url} alt="ID Front" fill className="object-cover" />
                            ) : (
                                <>
                                    <Camera className="w-6 h-6 text-gray-300 group-hover:text-primary transition-colors" />
                                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-primary transition-colors uppercase">Tap to Upload</span>
                                </>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        const file = e.target.files[0];
                                        const reader = new FileReader();
                                        reader.onload = (re) => set('id_front_url' as any, re.target?.result as string);
                                        reader.readAsDataURL(file);
                                        (e.target as any)._file = file; // Attach for submission
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID Back</label>
                        <div className="relative aspect-[3/2] bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all overflow-hidden group">
                            {current.id_back_url ? (
                                <Image src={current.id_back_url} alt="ID Back" fill className="object-cover" />
                            ) : (
                                <>
                                    <Camera className="w-6 h-6 text-gray-300 group-hover:text-primary transition-colors" />
                                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-primary transition-colors uppercase">Tap to Upload</span>
                                </>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        const file = e.target.files[0];
                                        const reader = new FileReader();
                                        reader.onload = (re) => set('id_back_url' as any, re.target?.result as string);
                                        reader.readAsDataURL(file);
                                        (e.target as any)._file = file; // Attach for submission
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>

                {!isFirstTimeSetup && (current.id_front_url && current.id_back_url) && (
                    <button
                        onClick={() => {
                            const frontInput = document.querySelector('input[type="file"]') as any;
                            const backInput = document.querySelectorAll('input[type="file"]')[1] as any;
                            if (frontInput?._file && backInput?._file) {
                                submitKyc({ id_front: frontInput._file, id_back: backInput._file });
                            } else {
                                alert('Please re-select files to submit.');
                            }
                        }}
                        disabled={isPending}
                        className="w-full h-12 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-light active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isSubmittingKyc ? <Loader2 className="animate-spin mx-auto" /> : 'Submit KYC Documents'}
                    </button>
                )}
            </div>

            {/* Permit */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h2 className="flex items-center gap-2 text-sm font-black text-text-primary uppercase tracking-wider">
                    <Upload className="w-4 h-4" /> Business Permit (Optional)
                </h2>
                <FormField label="Permit Number (Optional)" id="permit">
                    <input id="permit" type="text" value={(current.permit_number as string) ?? ''}
                        onChange={e => set('permit_number', e.target.value)}
                        placeholder="Optional"
                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </FormField>
                <button className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl w-full text-sm font-semibold text-text-secondary hover:border-primary hover:text-primary transition-colors min-h-[48px]">
                    <Upload className="w-4 h-4" /> Upload Permit Image (Optional)
                </button>
            </div>

            {/* Account Details */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h2 className="flex items-center gap-2 text-sm font-black text-text-primary uppercase tracking-wider">
                    <User className="w-4 h-4" /> Account Details
                </h2>
                <FormField label="Full Name" id="fullName">
                    <input id="fullName" type="text" value={current.user?.name ?? authUser?.name ?? ''} readOnly
                        className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-text-secondary cursor-not-allowed" />
                </FormField>
                <FormField label="Phone Number" id="phone">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input id="phone" type="tel" value={current.user?.phone ?? authUser?.phone ?? ''} readOnly
                                className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-mono text-text-secondary cursor-not-allowed" />
                            {authUser?.phone_verified && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                        {!authUser?.phone_verified && (
                            <button
                                onClick={() => router.push('/verify')}
                                className="px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-amber-500/20 whitespace-nowrap"
                            >
                                Verify Now
                            </button>
                        )}
                    </div>
                </FormField>
                <FormField label="Email (optional)" id="email">
                    <input id="email" type="email" defaultValue={current.user?.email ?? authUser?.email ?? ''}
                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </FormField>
            </div>

            {/* Change Password toggle */}
            {showChangePassword && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                    <h2 className="flex items-center gap-2 text-sm font-black text-text-primary uppercase tracking-wider">
                        <Key className="w-4 h-4" /> Change Password
                    </h2>
                    {(['current', 'newPw', 'confirm'] as const).map(f => (
                        <FormField key={f} label={f === 'current' ? 'Current Password' : f === 'newPw' ? 'New Password' : 'Confirm New Password'} id={f}>
                            <div className="relative">
                                <input id={f} type={showPw[f] ? 'text' : 'password'}
                                    value={pwForm[f]}
                                    onChange={e => setPwForm(p => ({ ...p, [f]: e.target.value }))}
                                    className="w-full h-12 pl-4 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                                <button type="button" onClick={() => setShowPw(p => ({ ...p, [f]: !p[f] }))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary">
                                    {showPw[f] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </FormField>
                    ))}
                </div>
            )}

            {/* Danger Zone */}
            <div className="space-y-2">
                <button onClick={() => setShowChangePassword(!showChangePassword)}
                    className="w-full py-3.5 border border-gray-200 rounded-xl text-sm font-bold text-text-secondary hover:bg-gray-50 transition-colors min-h-[48px]">
                    {showChangePassword ? 'Cancel Password Change' : 'Change Password'}
                </button>
                <button onClick={() => setShowDeleteModal(true)}
                    className="w-full py-3.5 border border-red-100 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors min-h-[48px]">
                    Request Account Deletion
                </button>
            </div>

        </div>

            {/* Save/Setup Button - Fixed at the very bottom for mobile */ }
    <div className="fixed bottom-[72px] left-0 right-0 p-4 bg-white border-t border-gray-200 z-[100] md:static md:bg-transparent md:border-none md:p-6 md:max-w-2xl md:mx-auto">
        <button
            onClick={() => isFirstTimeSetup ? setupProfile(current) : saveProfile(current)}
            disabled={isPending || (!isFirstTimeSetup && Object.keys(form).length === 0)}
            className="w-full flex items-center justify-center gap-3 py-4 bg-primary text-white rounded-2xl font-black text-base shadow-2xl shadow-primary/30 hover:bg-primary-light transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-h-[60px]"
        >
            <Save className="w-5 h-5" />
            {saved ? 'Profile Saved! ✓' : isPending ? 'Processing...' : isFirstTimeSetup ? 'Complete Setup' : 'Save Changes'}
        </button>
    </div>
        </>
    );
}

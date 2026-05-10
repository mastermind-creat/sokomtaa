'use client';

import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera, Store, Clock, Phone, Upload, User,
    Key, Save, Eye, EyeOff, Loader2, ShieldCheck,
    FileText, ChevronRight, AlertCircle, CheckCircle2,
    BadgeCheck, XCircle
} from 'lucide-react';
import api from '@/lib/api';
import { ApiResponse } from '@/types';

import { useUIStore } from '@/store/uiStore';
import { uploadToCloudinary } from '@/lib/cloudinary';
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
    permit_image_url: string | null;
    verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
    rejection_reason: string | null;
    user: { name: string; phone: string; email: string; };
}

function FormField({ label, id, children, error }: { label: string; id: string; children: React.ReactNode; error?: string }) {
    return (
        <div className="space-y-2">
            <label htmlFor={id} className="block text-sm font-bold text-green-900">{label}</label>
            {children}
            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
        </div>
    );
}

export default function TraderProfilePage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<'business' | 'kyc' | 'account'>('business');
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
    const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
    const [kycFiles, setKycFiles] = useState<{ id_front?: File, id_back?: File, permit?: File }>({});
    
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const permitInputRef = useRef<HTMLInputElement>(null);

    const { setPageTitle } = useUIStore();
    const { user: authUser, refreshUser } = useAuthStore();
    
    React.useEffect(() => {
        setPageTitle('Profile Management');
        refreshUser();
    }, [setPageTitle, refreshUser]);

    const { data: profile, isLoading, error: profileError } = useQuery<TraderProfile, { message: string, code: string }>({
        queryKey: ['trader-profile-full'],
        queryFn: async () => {
            const res = await api.get<never, ApiResponse<TraderProfile>>('/trader/me');
            return res.data;
        },
        retry: false
    });

    const isFirstTimeSetup = profileError?.code === 'NOT_FOUND';

    const [form, setForm] = useState<Partial<TraderProfile & { market_id: number; stall_number: string }>>({});
    const current: Partial<TraderProfile & { market_id: number; stall_number: string }> = { ...profile, ...form };

    const { mutate: setupProfile, isPending: isSettingUp } = useMutation({
        mutationFn: (data: Partial<TraderProfile>) => api.post('/trader/setup', data),
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
        onError: (err: { message?: string }) => alert(err.message || 'Failed to setup profile.')
    });

    const { mutate: saveProfile, isPending: isUpdating } = useMutation({
        mutationFn: (data: Partial<TraderProfile>) => api.put('/trader/update', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trader-profile-full'] });
            useAuthStore.getState().refreshUser();
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
            setForm({});
        },
        onError: (err: { message?: string }) => alert(err.message || 'Failed to save profile.')
    });

    const { mutate: uploadAvatar, isPending: isUploadingAvatar } = useMutation({
        mutationFn: async (file: File) => {
            const url = await uploadToCloudinary(file, 'traders/logos');
            return api.put('/trader/update', { avatar_url: url });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trader-profile-full'] });
            useAuthStore.getState().refreshUser();
        },
        onError: (err: { message?: string }) => alert(err.message || 'Failed to upload image.')
    });

    const { mutate: uploadBanner, isPending: isUploadingBanner } = useMutation({
        mutationFn: async (file: File) => {
            const url = await uploadToCloudinary(file, 'traders/banners');
            return api.put('/trader/update', { banner_url: url });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trader-profile-full'] }),
        onError: (err: { message?: string }) => alert(err.message || 'Failed to upload banner.')
    });

    const { mutate: uploadPermit, isPending: isUploadingPermit } = useMutation({
        mutationFn: async (file: File) => {
            const url = await uploadToCloudinary(file, 'traders/permits');
            return api.put('/trader/update', { permit_image_url: url });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trader-profile-full'] }),
        onError: (err: { message?: string }) => alert(err.message || 'Failed to upload permit.')
    });

    const { mutate: submitKyc, isPending: isSubmittingKyc } = useMutation({
        mutationFn: async (data: { id_front: File; id_back: File }) => {
            // Upload in parallel
            const [id_front_url, id_back_url] = await Promise.all([
                uploadToCloudinary(data.id_front, 'traders/kyc'),
                uploadToCloudinary(data.id_back, 'traders/kyc')
            ]);
            
            return api.post('/trader/kyc/update-urls', { id_front_url, id_back_url });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trader-profile-full'] });
            alert('KYC documents submitted successfully!');
            setKycFiles({});
        },
        onError: (err: { message?: string }) => alert(err.message || 'Failed to submit KYC.')
    });

    const isPending = isSettingUp || isUpdating || isSubmittingKyc || isUploadingAvatar || isUploadingBanner || isUploadingPermit;

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) uploadAvatar(e.target.files[0]);
    };

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) uploadBanner(e.target.files[0]);
    };

    const handlePermitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            uploadPermit(file);
        }
    };

    const set = (key: keyof TraderProfile, value: string | number | boolean | null) =>
        setForm(f => ({ ...f, [key]: value }));

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
                <div className="h-48 bg-gray-100 rounded-3xl animate-pulse" />
                <div className="h-64 bg-gray-100 rounded-3xl animate-pulse" />
            </div>
        );
    }

    const tabs = [
        { id: 'business', label: 'Business Profile', icon: Store },
        { id: 'kyc', label: 'Identity & KYC', icon: ShieldCheck },
        { id: 'account', label: 'Account Settings', icon: User },
    ] as const;

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 pb-32">
            {/* Header / Tabs */}
            <div className="flex items-center gap-2 mb-8 bg-gray-50 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black transition-all whitespace-nowrap ${
                            activeTab === tab.id
                                ? 'bg-white text-brand-600 shadow-sm border border-gray-100'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'
                        }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                >
                    {/* Tab 1: Business Profile */}
                    {activeTab === 'business' && (
                        <div className="space-y-6">
                            {/* Banner & Avatar Section */}
                            <section className="relative bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                                <div className="h-44 relative group">
                                    {current.banner_url ? (
                                        <Image src={current.banner_url} alt="Banner" fill className="object-cover" unoptimized />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-brand-600/10 via-brand-50 to-amber-50" />
                                    )}
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all" />
                                    <button 
                                        onClick={() => bannerInputRef.current?.click()}
                                        className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-md rounded-xl text-xs font-black text-brand-600 shadow-xl hover:bg-white transition-all"
                                    >
                                        <Camera size={14} />
                                        {isUploadingBanner ? 'Uploading...' : 'Change Cover'}
                                    </button>
                                    <input type="file" ref={bannerInputRef} onChange={handleBannerChange} className="hidden" accept="image/*" />
                                </div>

                                <div className="px-6 pb-8 relative">
                                    <div className="absolute -top-12 left-6">
                                        <div className="relative w-24 h-24 rounded-3xl border-4 border-white bg-white shadow-2xl overflow-hidden group">
                                            {current.avatar_url ? (
                                                <Image src={current.avatar_url} alt="Avatar" fill className="object-cover" unoptimized />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-3xl font-black text-brand-600 bg-brand-50">
                                                    {current.business_name?.charAt(0) ?? '?'}
                                                </div>
                                            )}
                                            <button 
                                                onClick={() => avatarInputRef.current?.click()}
                                                aria-label="Change Profile Picture"
                                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                                            >
                                                <Camera className="text-white" size={24} />
                                            </button>
                                            <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                                            {isUploadingAvatar && (
                                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                                    <Loader2 className="animate-spin text-brand-600" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="pt-16 grid md:grid-cols-2 gap-6">
                                        <FormField label="Business Name (English)" id="bizName">
                                            <input
                                                id="bizName"
                                                type="text"
                                                value={current.business_name ?? ''}
                                                onChange={e => set('business_name', e.target.value)}
                                                className="w-full h-14 px-5 bg-gray-50 border border-gray-100 rounded-2xl text-base font-bold text-green-950 focus:bg-white focus:ring-4 focus:ring-brand-600/5 focus:border-brand-600 transition-all"
                                                placeholder="e.g. Mama Mboga Fresh"
                                            />
                                        </FormField>
                                        <FormField label="Business Name (Swahili)" id="bizNameSw">
                                            <input
                                                id="bizNameSw"
                                                type="text"
                                                value={current.business_name_sw ?? ''}
                                                onChange={e => set('business_name_sw', e.target.value)}
                                                className="w-full h-14 px-5 bg-gray-50 border border-gray-100 rounded-2xl text-base font-bold text-green-950 focus:bg-white focus:ring-4 focus:ring-brand-600/5 focus:border-brand-600 transition-all"
                                                placeholder="Optional Swahili name"
                                            />
                                        </FormField>
                                        <div className="md:col-span-2">
                                            <FormField label="Business Description" id="desc">
                                                <textarea
                                                    id="desc"
                                                    value={current.description ?? ''}
                                                    onChange={e => set('description', e.target.value)}
                                                    rows={4}
                                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-base font-medium text-green-950 focus:bg-white focus:ring-4 focus:ring-brand-600/5 focus:border-brand-600 transition-all resize-none"
                                                    placeholder="Describe what you sell and why customers should choose you..."
                                                />
                                            </FormField>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Trading Hours Section */}
                            <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
                                <h3 className="text-lg font-black text-green-950 mb-6 flex items-center gap-3">
                                    <Clock className="text-brand-600" /> Trading Schedule
                                </h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <FormField label="Opening Time" id="open">
                                        <input
                                            id="open"
                                            type="time"
                                            value={current.opening_time ?? ''}
                                            onChange={e => set('opening_time', e.target.value)}
                                            className="w-full h-14 px-5 bg-gray-50 border border-gray-100 rounded-2xl text-base font-bold focus:bg-white transition-all"
                                        />
                                    </FormField>
                                    <FormField label="Closing Time" id="close">
                                        <input
                                            id="close"
                                            type="time"
                                            value={current.closing_time ?? ''}
                                            onChange={e => set('closing_time', e.target.value)}
                                            className="w-full h-14 px-5 bg-gray-50 border border-gray-100 rounded-2xl text-base font-bold focus:bg-white transition-all"
                                        />
                                    </FormField>
                                </div>
                                <div className="mt-8 p-6 bg-gray-50 rounded-3xl flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-black text-green-900 uppercase tracking-wider">Operational Status</h4>
                                        <p className="text-xs font-bold text-gray-500 mt-0.5">Manually set if you are currently open for orders.</p>
                                    </div>
                                    <button
                                        onClick={() => set('is_open', !current.is_open)}
                                        aria-label="Toggle operating status"
                                        className={`relative w-16 h-8 rounded-full transition-all duration-300 ${current.is_open ? 'bg-brand-600' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${current.is_open ? 'left-9' : 'left-1'}`} />
                                    </button>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* Tab 2: Identity & KYC */}
                    {activeTab === 'kyc' && (
                        <div className="space-y-6">
                            {/* Status Banner */}
                            <section className={`p-6 rounded-[2.5rem] border-2 flex items-start gap-4 transition-all ${
                                current.verification_status === 'verified' ? 'bg-green-50 border-green-100' :
                                current.verification_status === 'rejected' ? 'bg-red-50 border-red-100' :
                                'bg-amber-50 border-amber-100'
                            }`}>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                    current.verification_status === 'verified' ? 'bg-green-600 text-white' :
                                    current.verification_status === 'rejected' ? 'bg-red-600 text-white' :
                                    'bg-amber-600 text-white'
                                }`}>
                                    {current.verification_status === 'verified' ? <BadgeCheck size={24} /> :
                                     current.verification_status === 'rejected' ? <XCircle size={24} /> :
                                     <AlertCircle size={24} />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-black text-green-950">
                                            {current.verification_status === 'verified' ? 'Account Verified' : 
                                             current.verification_status === 'rejected' ? 'Verification Rejected' :
                                             current.verification_status === 'unverified' ? 'Identity Verification Required' :
                                             'Verification Pending'}
                                        </h4>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                            current.verification_status === 'verified' ? 'bg-green-200 text-green-800' :
                                            current.verification_status === 'rejected' ? 'bg-red-200 text-red-800' :
                                            current.verification_status === 'unverified' ? 'bg-gray-200 text-gray-800' :
                                            'bg-amber-200 text-amber-800'
                                        }`}>
                                            {current.verification_status === 'unverified' ? 'Not Submitted' : current.verification_status}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 text-sm font-medium mt-1">
                                        {current.verification_status === 'verified' ? 'Your business is fully verified. Customers can trust your stall.' :
                                         current.verification_status === 'rejected' ? `Issue: ${current.rejection_reason ?? 'Invalid documents provided.'}` :
                                         current.verification_status === 'unverified' ? 'Please scan and upload your National ID to enable all trader features.' :
                                         'Our team is currently reviewing your documents. This usually takes 24-48 hours.'}
                                    </p>
                                </div>
                            </section>

                            {/* Document Grid */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 space-y-6">
                                    <h3 className="text-base font-black text-green-950 flex items-center gap-3">
                                        <FileText className="text-brand-600" /> National ID
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* ID Front */}
                                            <div className="space-y-2 text-center">
                                                <div className="relative aspect-[4/3] bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex items-center justify-center overflow-hidden group hover:border-brand-600 hover:bg-brand-50 transition-all">
                                                    {kycFiles.id_front ? (
                                                        <img src={URL.createObjectURL(kycFiles.id_front)} className="object-cover w-full h-full" alt="Preview" />
                                                    ) : current.id_front_url ? (
                                                        <Image src={current.id_front_url} alt="ID Front" fill className="object-cover" unoptimized />
                                                    ) : (
                                                        <Camera className="text-gray-300" size={32} />
                                                    )}
                                                    <input 
                                                        type="file" 
                                                        onChange={e => e.target.files?.[0] && setKycFiles(f => ({ ...f, id_front: e.target.files![0] }))}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        aria-label="Upload ID Front"
                                                        accept="image/*"
                                                        capture="environment"
                                                    />
                                                </div>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Front Side</span>
                                            </div>
                                            {/* ID Back */}
                                            <div className="space-y-2 text-center">
                                                <div className="relative aspect-[4/3] bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex items-center justify-center overflow-hidden group hover:border-brand-600 hover:bg-brand-50 transition-all">
                                                    {kycFiles.id_back ? (
                                                        <img src={URL.createObjectURL(kycFiles.id_back)} className="object-cover w-full h-full" alt="Preview" />
                                                    ) : current.id_back_url ? (
                                                        <Image src={current.id_back_url} alt="ID Back" fill className="object-cover" unoptimized />
                                                    ) : (
                                                        <Camera className="text-gray-300" size={32} />
                                                    )}
                                                    <input 
                                                        type="file" 
                                                        onChange={e => e.target.files?.[0] && setKycFiles(f => ({ ...f, id_back: e.target.files![0] }))}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        aria-label="Upload ID Back"
                                                        accept="image/*"
                                                        capture="environment"
                                                    />
                                                </div>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Back Side</span>
                                            </div>
                                        </div>
                                        {(kycFiles.id_front || kycFiles.id_back) && (
                                            <button 
                                                onClick={() => kycFiles.id_front && kycFiles.id_back && submitKyc({ id_front: kycFiles.id_front, id_back: kycFiles.id_back })}
                                                disabled={!kycFiles.id_front || !kycFiles.id_back || isSubmittingKyc}
                                                className="w-full h-12 bg-brand-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brand-700 transition-all disabled:opacity-50"
                                            >
                                                {isSubmittingKyc ? <Loader2 className="animate-spin mx-auto" /> : 'Update Identity Docs'}
                                            </button>
                                        )}
                                    </div>
                                </section>

                                <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 space-y-6">
                                    <h3 className="text-base font-black text-green-950 flex items-center gap-3">
                                        <Upload className="text-brand-600" /> Business Permit
                                    </h3>
                                    <FormField label="Permit Number" id="permitNum">
                                        <input
                                            id="permitNum"
                                            value={current.permit_number ?? ''}
                                            onChange={e => set('permit_number', e.target.value)}
                                            className="w-full h-12 px-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white transition-all"
                                            placeholder="Enter permit number..."
                                        />
                                    </FormField>
                                    <div className="relative aspect-[16/9] bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex items-center justify-center overflow-hidden group hover:border-brand-600 hover:bg-brand-50 transition-all">
                                        {current.permit_image_url ? (
                                            <Image src={current.permit_image_url} alt="Permit" fill className="object-cover" unoptimized />
                                        ) : (
                                            <div className="text-center p-4">
                                                <Upload className="text-gray-300 mx-auto mb-2" size={32} />
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Upload Permit Photo</p>
                                            </div>
                                        )}
                                        <input type="file" ref={permitInputRef} onChange={handlePermitChange} className="hidden" accept="image/*" capture="environment" />
                                        <button 
                                            onClick={() => permitInputRef.current?.click()}
                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-black uppercase tracking-widest transition-all"
                                        >
                                            {isUploadingPermit ? 'Uploading...' : 'Change Permit'}
                                        </button>
                                        {isUploadingPermit && (
                                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                                <Loader2 className="animate-spin text-brand-600" />
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Account & Settings */}
                    {activeTab === 'account' && (
                        <div className="space-y-6">
                            {/* Personal Info Card (Read Only) */}
                            <section className="bg-gradient-to-br from-green-950 to-green-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                                <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
                                    <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center text-4xl font-black shrink-0 border border-white/20 shadow-2xl">
                                        {(current.user?.name ?? authUser?.name ?? 'S').charAt(0)}
                                    </div>
                                    <div className="space-y-4 flex-1">
                                        <div className="space-y-1">
                                            <h3 className="text-2xl font-black">{current.user?.name ?? authUser?.name}</h3>
                                            <p className="text-green-300 font-bold flex items-center gap-2">
                                                <BadgeCheck size={16} /> Verified Soko Mtaa Partner
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black uppercase text-green-400 tracking-widest">Phone</span>
                                                <p className="font-mono text-sm">{current.user?.phone ?? authUser?.phone}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black uppercase text-green-400 tracking-widest">Email</span>
                                                <p className="text-sm truncate">{current.user?.email ?? authUser?.email ?? 'Not provided'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 space-y-6">
                                <h3 className="text-base font-black text-green-950 flex items-center gap-3">
                                    <Phone className="text-brand-600" /> Payment & Communication
                                </h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <FormField label="M-Pesa Number" id="mpesa">
                                        <input
                                            id="mpesa"
                                            value={current.mpesa_number ?? ''}
                                            onChange={e => set('mpesa_number', e.target.value)}
                                            className="w-full h-12 px-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-mono font-bold focus:bg-white transition-all"
                                            placeholder="+254 7XX XXX XXX"
                                        />
                                    </FormField>
                                    <FormField label="Contact Email" id="email">
                                        <input
                                            id="email"
                                            defaultValue={current.user?.email ?? authUser?.email ?? ''}
                                            className="w-full h-12 px-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white transition-all"
                                            placeholder="your@email.com"
                                        />
                                    </FormField>
                                </div>
                            </section>

                            {/* Security Actions */}
                            <section className="space-y-4">
                                <button
                                    onClick={() => setShowChangePassword(!showChangePassword)}
                                    className="w-full py-4 px-6 bg-white border border-gray-100 rounded-3xl flex items-center justify-between group hover:border-brand-600 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-brand-600 group-hover:bg-brand-50 transition-all">
                                            <Key size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-black text-green-950">Security & Password</p>
                                            <p className="text-xs font-bold text-gray-400">Update your account login credentials</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-gray-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
                                </button>

                                <AnimatePresence>
                                    {showChangePassword && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="bg-gray-50 rounded-[2.5rem] p-8 space-y-4 border border-gray-100 mt-2">
                                                {(['current', 'newPw', 'confirm'] as const).map(f => (
                                                    <FormField key={f} label={f === 'current' ? 'Current Password' : f === 'newPw' ? 'New Password' : 'Confirm New Password'} id={f}>
                                                        <div className="relative">
                                                            <input
                                                                id={f}
                                                                type={showPw[f] ? 'text' : 'password'}
                                                                value={pwForm[f]}
                                                                onChange={e => setPwForm(p => ({ ...p, [f]: e.target.value }))}
                                                                className="w-full h-12 pl-5 pr-12 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-brand-600/5 focus:border-brand-600 transition-all"
                                                            />
                                                            <button 
                                                                type="button" 
                                                                onClick={() => setShowPw(p => ({ ...p, [f]: !p[f] }))}
                                                                aria-label={showPw[f] ? 'Hide password' : 'Show password'}
                                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-600"
                                                            >
                                                                {showPw[f] ? <EyeOff size={18} /> : <Eye size={18} />}
                                                            </button>
                                                        </div>
                                                    </FormField>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    className="w-full py-4 px-6 bg-red-50/30 border border-red-100/50 rounded-3xl flex items-center justify-between group hover:bg-red-50 hover:border-red-200 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-red-100/50 flex items-center justify-center text-red-400 group-hover:text-red-600 transition-all">
                                            <XCircle size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-black text-red-900">Danger Zone</p>
                                            <p className="text-xs font-bold text-red-400">Request account deletion or deactivation</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-red-200 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
                                </button>
                            </section>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Sticky Save Button */}
            <div className="fixed bottom-[80px] left-0 right-0 p-4 md:static md:p-0 md:mt-10 z-50">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => isFirstTimeSetup ? setupProfile(current) : saveProfile(current)}
                        disabled={isPending || (!isFirstTimeSetup && Object.keys(form).length === 0)}
                        className={`w-full h-16 rounded-[1.25rem] font-black text-base shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 ${
                            saved ? 'bg-green-600 shadow-green-200' : 'bg-brand-600 shadow-brand-200 hover:bg-brand-700'
                        } text-white`}
                    >
                        {isPending ? (
                            <Loader2 className="animate-spin" size={24} />
                        ) : saved ? (
                            <>
                                <CheckCircle2 size={24} />
                                Changes Saved Successfully!
                            </>
                        ) : (
                            <>
                                <Save size={24} />
                                {isFirstTimeSetup ? 'Complete Store Setup' : 'Save Profile Changes'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

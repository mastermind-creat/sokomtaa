'use client';

import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera, Store, Clock, Phone, Upload, User,
    Key, Save, Eye, EyeOff, Loader2, ShieldCheck,
    FileText, ChevronRight, AlertCircle, CheckCircle2,
    BadgeCheck, XCircle, ShoppingBag, Navigation2, MapPin
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
    market?: { id: number; name: string };
    stall?: { stall_number: string };
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

// Camera Modal for Document Scanning
function CameraModal({ onCapture, onClose }: { onCapture: (file: File) => void, onClose: () => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isStarting, setIsStarting] = useState(true);

    React.useEffect(() => {
        let currentStream: MediaStream | null = null;
        const start = async () => {
            try {
                const s = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        facingMode: 'environment',
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    } 
                });
                currentStream = s;
                setStream(s);
                if (videoRef.current) videoRef.current.srcObject = s;
                setIsStarting(false);
            } catch (err) {
                console.error('Camera access failed:', err);
                onClose();
            }
        };
        start();
        return () => {
            if (currentStream) {
                currentStream.getTracks().forEach(t => t.stop());
            }
        };
    }, [onClose]);

    const capture = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
                onCapture(file);
                onClose();
            }
        }, 'image/jpeg', 0.9);
    };

    return (
        <div className="fixed inset-0 z-[150] bg-black flex flex-col animate-in fade-in duration-300">
            <div className="relative flex-1 flex items-center justify-center overflow-hidden">
                {isStarting && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4">
                        <Loader2 className="animate-spin" size={48} />
                        <p className="font-black tracking-widest text-xs uppercase">Initializing Camera...</p>
                    </div>
                )}
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className={`w-full h-full object-cover transition-opacity duration-500 ${isStarting ? 'opacity-0' : 'opacity-100'}`} 
                />
                
                {/* Guide Overlay */}
                <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none flex items-center justify-center">
                    <div className="w-full aspect-[4/3] border-2 border-white/50 rounded-3xl relative">
                        <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-brand-500 rounded-tl-xl" />
                        <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-brand-500 rounded-tr-xl" />
                        <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-brand-500 rounded-bl-xl" />
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-brand-500 rounded-br-xl" />
                    </div>
                </div>
            </div>

            <div className="bg-green-950 p-8 pb-12 flex items-center justify-between relative">
                <button 
                    onClick={onClose}
                    className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                    <XCircle size={24} />
                </button>

                <button 
                    onClick={capture}
                    className="w-20 h-20 rounded-full bg-white border-[6px] border-brand-500 shadow-2xl flex items-center justify-center active:scale-90 transition-all group"
                >
                    <div className="w-12 h-12 rounded-full bg-brand-500 group-hover:scale-110 transition-all" />
                </button>

                <div className="w-12" />

                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-black text-brand-300 uppercase tracking-widest">
                    Position Document in Frame
                </div>
            </div>
        </div>
    );
}

// Helper: extract first readable message from a Laravel error response
function extractError(err: unknown): string {
    const e = err as { message?: string; errors?: Record<string, string[]> };
    if (e?.errors) {
        const first = Object.values(e.errors)[0];
        if (first?.length) return first[0];
    }
    return e?.message || 'Something went wrong. Please try again.';
}

// ── LocationSection sub-component ────────────────────────────────────────────
// Shown to independent traders so they can pin their stall's coordinates.
// Uses browser Geolocation API (high accuracy). The detected coords are
// stored in parent form state and saved alongside the next profile save.
interface LocationSectionProps {
    latitude: number | null;
    longitude: number | null;
    onCoordsChange: (lat: number, lng: number) => void;
}

function LocationSection({ latitude, longitude, onCoordsChange }: LocationSectionProps) {
    const [isLocating, setIsLocating] = React.useState(false);
    const [locError, setLocError]     = React.useState<string | null>(null);
    const [justDetected, setJustDetected] = React.useState(false);

    const detect = () => {
        if (!navigator.geolocation) {
            setLocError('Your browser does not support location services.');
            return;
        }
        setIsLocating(true);
        setLocError(null);
        setJustDetected(false);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                onCoordsChange(pos.coords.latitude, pos.coords.longitude);
                setIsLocating(false);
                setJustDetected(true);
                setTimeout(() => setJustDetected(false), 4000);
            },
            (err) => {
                setIsLocating(false);
                if (err.code === err.PERMISSION_DENIED) {
                    setLocError('Location access denied. Please allow it in your browser settings and try again.');
                } else if (err.code === err.TIMEOUT) {
                    setLocError('Location timed out. Please try again in a clear outdoor area.');
                } else {
                    setLocError('Could not determine your location. Please try again.');
                }
            },
            { timeout: 12000, maximumAge: 60000, enableHighAccuracy: true }
        );
    };

    const hasCoords = latitude !== null && longitude !== null;

    return (
        <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
            <h3 className="text-lg font-black text-green-950 mb-2 flex items-center gap-3">
                <MapPin className="text-brand-600" /> Your Stall Location
            </h3>
            <p className="text-sm text-gray-500 font-medium mb-6 leading-relaxed">
                Adding your GPS coordinates lets customers find you on the map.
                Stand at your stall and tap the button below for best accuracy.
            </p>

            {/* Current coordinates display */}
            {hasCoords && (
                <div className="mb-5 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shrink-0">
                        <CheckCircle2 size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-green-950">Location Pinned</p>
                        <p className="text-[11px] font-mono text-green-700 mt-0.5">
                            {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
                        </p>
                    </div>
                </div>
            )}

            {/* Success flash */}
            {justDetected && (
                <div className="mb-4 p-3 bg-brand-50 border border-brand-100 rounded-2xl text-sm font-bold text-brand-700 flex items-center gap-2">
                    <Navigation2 size={16} /> Location detected! Tap Save below to keep it.
                </div>
            )}

            {/* Error */}
            {locError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-2xl text-sm font-bold text-red-700 flex items-center gap-2">
                    <AlertCircle size={16} /> {locError}
                </div>
            )}

            {/* Detect button */}
            <button
                type="button"
                onClick={detect}
                disabled={isLocating}
                className="w-full h-14 flex items-center justify-center gap-3 bg-brand-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg shadow-brand-200 hover:bg-brand-700 active:scale-95 transition-all disabled:opacity-60"
            >
                {isLocating
                    ? <><Loader2 size={20} className="animate-spin" /> Detecting Location…</>
                    : <><Navigation2 size={20} /> {hasCoords ? 'Update My Location' : 'Detect My Location'}</>
                }
            </button>

            <p className="text-[10px] text-text-muted font-medium text-center mt-3">
                Your browser will ask for location permission. This only runs when you tap the button.
            </p>
        </section>
    );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function TraderProfilePage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<'business' | 'kyc' | 'account'>('business');
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
    const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
    const [kycFiles, setKycFiles] = useState<{ id_front?: File, id_back?: File, permit?: File }>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [isUploadingAvatarSetup, setIsUploadingAvatarSetup] = useState(false);
    const [isUploadingBannerSetup, setIsUploadingBannerSetup] = useState(false);
    
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [deletionPassword, setDeletionPassword] = useState('');
    const [deletionError, setDeletionError] = useState<string | null>(null);

    const [activeCamera, setActiveCamera] = useState<null | 'id_front' | 'id_back' | 'permit'>(null);

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

    // Fetch markets for the dropdown
    const { data: markets } = useQuery({
        queryKey: ['markets-list'],
        queryFn: async () => {
            const res = await api.get<never, ApiResponse<Array<{ id: number; name: string }>>>('/markets');
            return res.data;
        }
    });

    const isFirstTimeSetup = profileError?.code === 'NOT_FOUND';

    const [form, setForm] = useState<Partial<TraderProfile & { market_id: number; stall_number: string }>>({});
    
    // Default values from profile when available
    const initialMarketId = profile?.market?.id;
    const initialStallNumber = profile?.stall?.stall_number;

    const current: Partial<TraderProfile & { market_id: number; stall_number: string }> = { 
        ...profile, 
        market_id: initialMarketId,
        stall_number: initialStallNumber,
        ...form 
    };

    const { mutate: setupProfile, isPending: isSettingUp } = useMutation({
        mutationFn: (data: Partial<TraderProfile & { market_id?: number; stall_number?: string }>) =>
            api.post('/trader/setup', data),
        onSuccess: async () => {
            setFormError(null);
            await refreshUser();
            queryClient.invalidateQueries({ queryKey: ['trader-profile-full'] });
            setSaved(true);
            setTimeout(() => {
                setSaved(false);
                router.push('/trader/dashboard');
            }, 1500);
            setForm({});
        },
        onError: (err: unknown) => setFormError(extractError(err))
    });

    const { mutate: saveProfile, isPending: isUpdating } = useMutation({
        mutationFn: (data: Partial<TraderProfile & { market_id?: number; stall_number?: string }>) => api.put('/trader/update', data),
        onSuccess: () => {
            setFormError(null);
            queryClient.invalidateQueries({ queryKey: ['trader-profile-full'] });
            useAuthStore.getState().refreshUser();
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
            setForm({});
        },
        onError: (err: unknown) => setFormError(extractError(err))
    });

    const { mutate: deleteAccount, isPending: isDeleting } = useMutation({
        mutationFn: (password: string) => api.delete('/profile', { data: { password } }),
        onSuccess: () => {
            useAuthStore.getState().logout();
            router.push('/login');
        },
        onError: (err: unknown) => setDeletionError(extractError(err))
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
        onError: (err: unknown) => setFormError(extractError(err))
    });

    const { mutate: uploadBanner, isPending: isUploadingBanner } = useMutation({
        mutationFn: async (file: File) => {
            const url = await uploadToCloudinary(file, 'traders/banners');
            return api.put('/trader/update', { banner_url: url });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trader-profile-full'] }),
        onError: (err: unknown) => setFormError(extractError(err))
    });

    const { mutate: uploadPermit, isPending: isUploadingPermit } = useMutation({
        mutationFn: async (file: File) => {
            const url = await uploadToCloudinary(file, 'traders/permits');
            return api.put('/trader/update', { permit_image_url: url });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trader-profile-full'] }),
        onError: (err: unknown) => setFormError(extractError(err))
    });

    const { mutate: submitKyc, isPending: isSubmittingKyc } = useMutation({
        mutationFn: async (data: { id_front: File; id_back: File }) => {
            const [id_front_url, id_back_url] = await Promise.all([
                uploadToCloudinary(data.id_front, 'traders/kyc'),
                uploadToCloudinary(data.id_back, 'traders/kyc')
            ]);
            return api.post('/trader/kyc/update-urls', { id_front_url, id_back_url });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trader-profile-full'] });
            setFormError(null);
            setKycFiles({});
        },
        onError: (err: unknown) => setFormError(extractError(err))
    });

    const isPending = isSettingUp || isUpdating || isSubmittingKyc || isUploadingAvatar || isUploadingBanner || isUploadingPermit || isUploadingAvatarSetup || isUploadingBannerSetup;

    // During first-time setup, store uploaded URL in form state (no profile exists yet).
    // For existing profiles, update backend immediately.
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (isFirstTimeSetup) {
            setIsUploadingAvatarSetup(true);
            try {
                const url = await uploadToCloudinary(file, 'traders/logos');
                setForm(f => ({ ...f, avatar_url: url }));
            } catch (err) { setFormError(extractError(err)); }
            finally { setIsUploadingAvatarSetup(false); }
        } else {
            uploadAvatar(file);
        }
    };

    const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (isFirstTimeSetup) {
            setIsUploadingBannerSetup(true);
            try {
                const url = await uploadToCloudinary(file, 'traders/banners');
                setForm(f => ({ ...f, banner_url: url }));
            } catch (err) { setFormError(extractError(err)); }
            finally { setIsUploadingBannerSetup(false); }
        } else {
            uploadBanner(file);
        }
    };

    const handlePermitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        uploadPermit(file);
    };

    const set = (key: keyof (TraderProfile & { market_id: number; stall_number: string }), value: string | number | boolean | null) => {
        setFormError(null);
        setForm(f => ({ ...f, [key]: value }));
    };

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
        <div className="max-w-4xl mx-auto px-4 py-6 pb-20">
            {/* Header / Tabs - Sticky on Mobile */}
            <div className="sticky top-0 z-40 -mx-4 px-4 py-3 bg-white/80 backdrop-blur-md border-b border-gray-100 mb-8 sm:relative sm:top-auto sm:mx-0 sm:px-0 sm:bg-transparent sm:backdrop-blur-none sm:border-none">
                <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-2xl">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-3.5 rounded-xl text-xs sm:text-sm font-black transition-all relative ${
                                activeTab === tab.id
                                    ? 'bg-white text-brand-600 shadow-sm border border-gray-100'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <tab.icon size={16} className={activeTab === tab.id ? 'text-brand-600' : 'text-gray-400'} />
                            <span className="hidden xs:inline">{tab.label}</span>
                            <span className="xs:hidden">{tab.id === 'business' ? 'Profile' : tab.id === 'kyc' ? 'KYC' : 'Account'}</span>
                            
                            {activeTab === tab.id && (
                                <motion.div 
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-100 -z-10"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* First-time Setup Banner */}
            {isFirstTimeSetup && (
                <div className="mb-6 flex items-start gap-4 bg-brand-50 border-2 border-brand-100 rounded-[2rem] p-5">
                    <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shrink-0">
                        <Store size={20} />
                    </div>
                    <div>
                        <h3 className="font-black text-green-950 text-sm">Welcome! Set up your store.</h3>
                        <p className="text-xs text-gray-500 mt-0.5 font-medium">Fill in your Business Name below and tap <strong>Complete Store Setup</strong> to get started. You can add more details later.</p>
                    </div>
                </div>
            )}

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
                                        {(isUploadingBanner || isUploadingBannerSetup) ? 'Uploading...' : 'Change Cover'}
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
                                            {(isUploadingAvatar || isUploadingAvatarSetup) && (
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

                            {/* Market & Stall Section */}
                            <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
                                <h3 className="text-lg font-black text-green-950 mb-6 flex items-center gap-3">
                                    <Store className="text-brand-600" /> Market & Stall Location
                                </h3>
                                
                                <div className="grid md:grid-cols-2 gap-6">
                                    <FormField label="Assigned Market" id="marketId">
                                        <div className="relative">
                                            <select
                                                id="marketId"
                                                value={current.market_id ?? ''}
                                                onChange={e => set('market_id', parseInt(e.target.value))}
                                                className="w-full h-14 px-5 bg-gray-50 border border-gray-100 rounded-2xl text-base font-bold text-green-950 focus:bg-white focus:ring-4 focus:ring-brand-600/5 focus:border-brand-600 transition-all appearance-none"
                                            >
                                                <option value="">Select a market</option>
                                                {markets?.map(m => (
                                                    <option key={m.id} value={m.id}>{m.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <ChevronRight className="rotate-90" size={16} />
                                            </div>
                                        </div>
                                    </FormField>

                                    <FormField label="Stall Number" id="stallNum">
                                        <input
                                            id="stallNum"
                                            type="text"
                                            value={current.stall_number ?? ''}
                                            onChange={e => set('stall_number', e.target.value)}
                                            className="w-full h-14 px-5 bg-gray-50 border border-gray-100 rounded-2xl text-base font-bold text-green-950 focus:bg-white focus:ring-4 focus:ring-brand-600/5 focus:border-brand-600 transition-all"
                                            placeholder="e.g. A1, B12"
                                        />
                                    </FormField>
                                    
                                    <div className="md:col-span-2">
                                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex gap-3 items-start">
                                            <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                                            <p className="text-sm text-amber-900 font-medium">
                                                Changing your stall or market may require administrative re-verification. 
                                                Ensure you select the correct physical location.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* GPS Location Section — independent traders only */}
                            {(current.stall_type === 'independent' || isFirstTimeSetup) && (
                                <LocationSection
                                    latitude={current.latitude ?? null}
                                    longitude={current.longitude ?? null}
                                    onCoordsChange={(lat, lng) => {
                                        setForm(f => ({ ...f, latitude: lat, longitude: lng }));
                                    }}
                                />
                            )}

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
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-black text-green-900 uppercase tracking-wider">Operational Status</h4>
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${current.is_open ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                                {current.is_open ? 'Live' : 'Closed'}
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-gray-500 mt-1 leading-relaxed">
                                            This is a manual override. <br/>
                                            <span className="text-brand-600">Note:</span> Your stall automatically closes outside business hours.
                                        </p>
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
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/40 gap-2">
                                                        <button 
                                                            type="button"
                                                            onClick={() => setActiveCamera('id_front')}
                                                            className="px-4 py-2 bg-brand-600 text-white text-[10px] font-black uppercase rounded-full"
                                                        >
                                                            Take Photo
                                                        </button>
                                                        <span className="text-white text-[8px] font-bold uppercase">or</span>
                                                        <label className="px-4 py-2 bg-white text-gray-900 text-[10px] font-black uppercase rounded-full cursor-pointer">
                                                            Upload
                                                            <input 
                                                                type="file" 
                                                                onChange={e => e.target.files?.[0] && setKycFiles(f => ({ ...f, id_front: e.target.files![0] }))}
                                                                className="hidden"
                                                                accept="image/*"
                                                            />
                                                        </label>
                                                    </div>
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
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/40 gap-2">
                                                        <button 
                                                            type="button"
                                                            onClick={() => setActiveCamera('id_back')}
                                                            className="px-4 py-2 bg-brand-600 text-white text-[10px] font-black uppercase rounded-full"
                                                        >
                                                            Take Photo
                                                        </button>
                                                        <span className="text-white text-[8px] font-bold uppercase">or</span>
                                                        <label className="px-4 py-2 bg-white text-gray-900 text-[10px] font-black uppercase rounded-full cursor-pointer">
                                                            Upload
                                                            <input 
                                                                type="file" 
                                                                onChange={e => e.target.files?.[0] && setKycFiles(f => ({ ...f, id_back: e.target.files![0] }))}
                                                                className="hidden"
                                                                accept="image/*"
                                                            />
                                                        </label>
                                                    </div>
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
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-3 transition-all">
                                            <button 
                                                type="button"
                                                onClick={() => setActiveCamera('permit')}
                                                className="px-6 py-2 bg-brand-600 text-white text-[10px] font-black uppercase rounded-full shadow-lg"
                                            >
                                                Scan Permit
                                            </button>
                                            <button 
                                                onClick={() => permitInputRef.current?.click()}
                                                className="px-6 py-2 bg-white text-gray-900 text-[10px] font-black uppercase rounded-full shadow-lg"
                                            >
                                                Upload Photo
                                            </button>
                                        </div>
                                        <input type="file" ref={permitInputRef} onChange={handlePermitChange} className="hidden" accept="image/*" />
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

                            {/* User Actions */}
                            <section className="space-y-4">
                                <button
                                    onClick={() => router.push('/reservations')}
                                    className="w-full py-4 px-6 bg-brand-50 border border-brand-100 rounded-3xl flex items-center justify-between group hover:border-brand-600 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-brand-600 shadow-sm">
                                            <ShoppingBag size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-black text-green-950">My Purchases</p>
                                            <p className="text-xs font-bold text-brand-600/70">View items you bought as a resident</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-brand-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
                                </button>

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
                                    onClick={() => setIsDeletingAccount(true)}
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

            {/* Error Banner */}
            {formError && (
                <div className="mx-auto max-w-4xl mb-2">
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
                        <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                        <p className="text-red-700 text-sm font-bold">{formError}</p>
                    </div>
                </div>
            )}

            {/* Save Button - Non-sticky, at the bottom of the content */}
            <div className="mt-12 mb-20 px-4 md:px-0">
                <button
                    onClick={() => {
                        setFormError(null);
                        // Strip non-serialisable / server-computed fields before sending
                        const { user: _u, verification_status: _vs, rejection_reason: _rr, ...safe } = current as TraderProfile & { market_id?: number; stall_number?: string; user?: unknown; verification_status?: string; rejection_reason?: string };
                        void _u; void _vs; void _rr;
                        if (isFirstTimeSetup) {
                            setupProfile(safe as Partial<TraderProfile>);
                        } else {
                            saveProfile(safe as Partial<TraderProfile>);
                        }
                    }}
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

            {/* Account Deletion Confirmation Modal */}
            <AnimatePresence>
                {isDeletingAccount && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isDeleting && setIsDeletingAccount(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full -translate-y-1/2 translate-x-1/2 -z-10" />
                            
                            <div className="space-y-6">
                                <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
                                    <XCircle size={32} />
                                </div>
                                
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black text-gray-900">Delete Account?</h2>
                                    <p className="text-gray-500 font-bold leading-relaxed">
                                        This action is permanent. You will lose all your store data, products, and transaction history.
                                        <span className="block mt-2 text-red-600">Je, una uhakika unataka kufuta akaunti yako?</span>
                                    </p>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <FormField label="Confirm with Password" id="delPw" error={deletionError ?? undefined}>
                                        <div className="relative">
                                            <input
                                                type={showPw.current ? 'text' : 'password'}
                                                id="delPw"
                                                value={deletionPassword}
                                                onChange={e => setDeletionPassword(e.target.value)}
                                                className="w-full h-14 px-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-red-200 transition-all"
                                                placeholder="Enter your password to confirm..."
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowPw(p => ({ ...p, current: !p.current }))}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                                            >
                                                {showPw.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </FormField>

                                    <div className="grid grid-cols-2 gap-4 pt-4">
                                        <button
                                            onClick={() => !isDeleting && setIsDeletingAccount(false)}
                                            className="h-14 rounded-2xl font-black text-gray-400 hover:bg-gray-50 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => deleteAccount(deletionPassword)}
                                            disabled={!deletionPassword || isDeleting}
                                            className="h-14 rounded-2xl bg-red-600 text-white font-black shadow-lg shadow-red-100 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                                        >
                                            {isDeleting ? <Loader2 className="animate-spin" size={20} /> : 'Delete Account'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Document Scanner Modal */}
            <AnimatePresence>
                {activeCamera && (
                    <CameraModal 
                        onClose={() => setActiveCamera(null)}
                        onCapture={(file) => {
                            if (activeCamera === 'id_front') setKycFiles(f => ({ ...f, id_front: file }));
                            else if (activeCamera === 'id_back') setKycFiles(f => ({ ...f, id_back: file }));
                            else if (activeCamera === 'permit') {
                                const event = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
                                handlePermitChange(event);
                            }
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

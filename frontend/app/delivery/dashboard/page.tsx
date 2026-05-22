'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    MapPin,
    Navigation,
    Package,
    Phone,
    CheckCircle2,
    Clock,
    AlertCircle,
    Power,
    Check,
    Loader2,
    RefreshCw,
    Search,
    Store,
    Upload,
    ShieldCheck,
    XCircle,
    FileText,
    ShoppingBag,
    Truck,
    History,
    Bike,
    User,
    DollarSign,
    CheckCircle
} from 'lucide-react';
import api from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useOffline } from '@/hooks/useOffline';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';

interface RiderProfile {
    id: number;
    vehicle_type: string;
    vehicle_registration: string;
    is_available: boolean;
    earnings_balance: number;
    verification_status: string;
    latitude?: number;
    longitude?: number;
}

interface RiderStats {
    profile: RiderProfile;
    completed_deliveries: number;
    active_deliveries: number;
    today_earnings: number;
    recent_transactions: any[];
    active_orders?: any[];
}

export default function RiderDashboard() {
    const { setPageTitle } = useUIStore();
    const { user, refreshUser } = useAuthStore();
    const queryClient = useQueryClient();
    const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: -1.2921, lng: 36.8219 });
    const [otpInputs, setOtpInputs] = useState<{ [key: number]: string }>({});
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [completingId, setCompletingId] = useState<number | null>(null);

    useEffect(() => {
        setPageTitle('Delivery Deck');
        refreshUser();

        // Get rider's current geo coordinates
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setCoords(newCoords);
                    // Update location on backend
                    api.post('/delivery/update-location', {
                        latitude: newCoords.lat,
                        longitude: newCoords.lng
                    }).catch(() => { });
                },
                () => { }
            );
        }
    }, [setPageTitle, refreshUser]);

    // Fetch stats, wallet balance, and recent transaction log
    const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useQuery({
        queryKey: ['rider-stats'],
        queryFn: () => api.get<never, { data: RiderStats }>('/delivery/stats').then(res => res.data),
        refetchInterval: 10000,
    });
    const stats = statsData;
    const profile = stats?.profile;

    // Fetch ALL pending shipments (no geo filter) — visible even when offline
    const { data: pendingData, isLoading: pendingLoading, refetch: refetchPending } = useQuery({
        queryKey: ['rider-pending-shipments'],
        queryFn: () => api.get<never, { data: any[] }>('/delivery/pending-shipments').then(res => res.data),
        refetchInterval: 8000,
    });
    const pendingShipments = pendingData || [];

    // Fetch geo-filtered nearby pool (only when online)
    const { data: poolData, isLoading: poolLoading, refetch: refetchPool } = useQuery({
        queryKey: ['rider-orders-pool', coords],
        queryFn: () => api.get<never, { data: any[] }>(`/delivery/orders?lat=${coords.lat}&lng=${coords.lng}`).then(res => res.data),
        enabled: !!profile?.is_available,
        refetchInterval: 5000,
    });
    const ordersPool = poolData || [];

    // Mutations
    const toggleMutation = useMutation({
        mutationFn: () => api.post('/delivery/toggle-availability'),
        onSuccess: () => {
            toast.success("Availability status updated successfully!");
            queryClient.invalidateQueries({ queryKey: ['rider-stats'] });
            queryClient.invalidateQueries({ queryKey: ['rider-orders-pool'] });
        }
    });

    const acceptMutation = useMutation({
        mutationFn: (id: number) => api.post(`/delivery/orders/${id}/accept`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rider-stats'] });
            queryClient.invalidateQueries({ queryKey: ['rider-orders-pool'] });
        }
    });

    const pickupMutation = useMutation({
        mutationFn: (id: number) => api.post(`/delivery/orders/${id}/pickup`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rider-stats'] });
        }
    });

    const arrivalMutation = useMutation({
        mutationFn: (id: number) => api.post(`/delivery/orders/${id}/notify-arrival`),
        onSuccess: () => {
            // Success alerts now handled by toast
        }
    });

    const completeMutation = useMutation({
        mutationFn: ({ id, code }: { id: number; code: string }) =>
            api.post(`/delivery/orders/${id}/complete`, { pickup_code: code }),
        onSuccess: () => {
            // Bust all caches that show earnings so every view reflects the
            // new balance immediately — without waiting for polling intervals.
            queryClient.invalidateQueries({ queryKey: ['rider-stats'] });
            queryClient.invalidateQueries({ queryKey: ['rider-orders-pool'] });
            queryClient.invalidateQueries({ queryKey: ['deliveryProfile'] }); // wallet page balance
            queryClient.invalidateQueries({ queryKey: ['riderWithdrawals'] }); // wallet tx history
            setOtpInputs({});
        }
    });

    const handleAccept = async (id: number) => {
        setProcessingId(id);
        try {
            await acceptMutation.mutateAsync(id);
            toast.success("Shipment accepted! It is now in your Active list.");
            refetchStats();
        } catch (err: any) {
            const errMsg = err.response?.data?.message || "This shipment has already been claimed by another rider!";
            toast.error(errMsg, { duration: 5000 });
            // Immediately refresh the pool so the claimed order vanishes
            refetchPool();
        }
        setProcessingId(null);
    };

    const handlePickup = async (id: number) => {
        setProcessingId(id);
        try {
            await pickupMutation.mutateAsync(id);
            toast.success("Stall pickup confirmed! Package is now in transit.");
            refetchStats();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to confirm pickup.");
        }
        setProcessingId(null);
    };

    const handleArrival = async (id: number) => {
        setProcessingId(id);
        try {
            await arrivalMutation.mutateAsync(id);
            toast.success("Customer notified successfully via SMS and in-app banner!", { duration: 4000 });
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to send arrival notification.");
        }
        setProcessingId(null);
    };

    const handleComplete = async (id: number) => {
        const code = otpInputs[id];
        if (!code) {
            toast.error("Please enter the resident's verification code to cash out.");
            return;
        }
        setCompletingId(id);
        try {
            await completeMutation.mutateAsync({ id, code });
            toast.success("Verification successful! Earnings have been credited to your wallet.");
            refetchStats();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Verification code is incorrect.");
        }
        setCompletingId(null);
    };

    const kycStatus = profile?.verification_status; // not_submitted | pending | verified | rejected
    const isNetworkOffline = useOffline();
    const isOffline = !profile?.is_available || isNetworkOffline;

    useEffect(() => {
        if (!isNetworkOffline) {
            refetchStats();
            refetchPending();
            refetchPool();
        }
    }, [isNetworkOffline]);

    return (
        <div className="pb-40 -mx-4 md:-mx-0 font-sans">
            {/* ── KYC Status Banners (only shown when relevant) ── */}

            {/* 1. Not yet submitted — prompt rider to upload docs */}
            {kycStatus === 'not_submitted' && (
                <div className="px-4 mb-6">
                    <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-6 flex items-start gap-4 shadow-sm">
                        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-200">
                            <FileText size={28} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-black text-blue-950 uppercase tracking-tight">Complete Your KYC</h3>
                            <p className="text-blue-700 text-xs font-bold leading-relaxed mb-4">Upload your National ID and driving licence to unlock payments and full access.</p>
                            <Link
                                href="/delivery/kyc"
                                className="inline-flex items-center gap-2 h-10 px-5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md"
                            >
                                <Upload size={14} /> Upload Documents
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Submitted — under admin review */}
            {kycStatus === 'pending' && (
                <div className="px-4 mb-6">
                    <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-6 flex items-center gap-4 shadow-sm">
                        <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-200">
                            <Clock size={28} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-amber-950 uppercase tracking-tight">Documents Under Review</h3>
                            <p className="text-amber-700 text-xs font-bold leading-relaxed">Your KYC documents are being reviewed by county administrators. You can explore orders but cannot accept payments yet.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Rejected — prompt resubmission */}
            {kycStatus === 'rejected' && (
                <div className="px-4 mb-6">
                    <div className="bg-red-50 border border-red-100 rounded-[2rem] p-6 flex items-start gap-4 shadow-sm">
                        <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-200">
                            <XCircle size={28} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-black text-red-950 uppercase tracking-tight">KYC Not Approved</h3>
                            <p className="text-red-700 text-xs font-bold leading-relaxed mb-4">Your documents were not approved. Please re-upload with the correct documents.</p>
                            <Link
                                href="/delivery/kyc"
                                className="inline-flex items-center gap-2 h-10 px-5 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md"
                            >
                                <Upload size={14} /> Re-submit Documents
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Status and Wallet Card */}
            <div className="px-4 mb-8">
                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex flex-col gap-6">
                    {/* Rider Profile Summary */}
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-brand-50 text-brand-700 rounded-2xl flex items-center justify-center font-black shadow-inner relative overflow-hidden shrink-0 border border-brand-100">
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt={user.name || ''} className="w-full h-full object-cover" />
                            ) : (
                                <User size={20} className="text-brand-600" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-base font-black text-green-950 uppercase tracking-tight truncate leading-none">{user?.name || 'Rider Terminal'}</h2>
                                {kycStatus === 'verified' && (
                                    <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 border border-brand-100 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0">
                                        <ShieldCheck size={10} className="text-brand-600" /> Verified
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] text-text-muted font-bold mt-1 uppercase tracking-widest">
                                {profile?.vehicle_type || 'Bicycle'} • {profile?.vehicle_registration || 'No Plates'}
                            </p>
                        </div>
                    </div>

                    <div className="h-[1px] bg-gray-100" />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-3 h-3 rounded-full animate-pulse",
                                isNetworkOffline
                                    ? "bg-amber-500"
                                    : profile?.is_available
                                        ? "bg-green-500"
                                        : "bg-gray-400"
                            )} />
                            <span className="text-xs font-black uppercase tracking-widest text-green-950">
                                {isNetworkOffline
                                    ? "No Connection"
                                    : profile?.is_available
                                        ? "Online & Ready"
                                        : "Offline"}
                            </span>
                        </div>
                        <button
                            onClick={() => !isNetworkOffline && toggleMutation.mutate()}
                            disabled={toggleMutation.isPending || isNetworkOffline}
                            className={cn(
                                "h-14 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2.5",
                                isNetworkOffline
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                    : profile?.is_available
                                        ? "bg-rose-50 text-rose-600 border border-rose-100"
                                        : "bg-brand-600 text-white shadow-xl shadow-brand-600/20"
                            )}
                        >
                            <Power size={16} />
                            {isNetworkOffline
                                ? "Offline"
                                : profile?.is_available
                                    ? "Go Offline"
                                    : "Go Online"}
                        </button>
                    </div>

                    <div className="h-[1px] bg-gray-100" />

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1">Balance</span>
                            <span className="text-lg font-black text-green-950">KES {Number(profile?.earnings_balance || 0).toLocaleString()}</span>
                            <span className="text-[8px] font-bold text-brand-600 block mt-0.5 tracking-widest uppercase">Wallet</span>
                        </div>
                        <div className="border-l border-gray-100 pl-3">
                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1">Today</span>
                            <span className="text-lg font-black text-green-950">KES {Number(stats?.today_earnings || 0).toLocaleString()}</span>
                            <span className="text-[8px] font-bold text-amber-500 block mt-0.5 tracking-widest uppercase">Earned</span>
                        </div>
                        <div className="text-right border-l border-gray-100 pl-3">
                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1">Completed</span>
                            <span className="text-lg font-black text-green-950">{stats?.completed_deliveries || 0}</span>
                            <span className="text-[8px] font-bold text-gray-400 block mt-0.5 tracking-widest uppercase">Jobs Done</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 3-Column Dashboard Layout (Desktop: Side-by-Side, Mobile: Stacked) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4">

                {/* Column 1: Active Shipments */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-black text-green-950 uppercase tracking-[0.15em]">Active Shipments</h3>
                        <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-100 uppercase tracking-widest animate-pulse">
                            Active ({stats?.active_deliveries || 0})
                        </span>
                    </div>

                    {!stats?.active_orders || stats.active_orders.length === 0 ? (
                        <div className="py-12 text-center bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-100 p-6">
                            <Package className="mx-auto text-gray-300 mb-3" size={40} />
                            <p className="text-xs font-black text-text-muted uppercase tracking-widest leading-relaxed">
                                No active deliveries.<br />Go to the Pool to accept jobs!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {stats.active_orders.map((res: any) => {
                                if (!res) return null;
                                const isAssigned = res.delivery_status === 'assigned';
                                const isPickedUp = res.delivery_status === 'picked_up';
                                const isArrived = res.delivery_status === 'in_transit';

                                return (
                                    <div key={res.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-brand-md overflow-hidden p-6 space-y-6">
                                        {/* Status Header */}
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <span className={cn(
                                                    "text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest",
                                                    isAssigned ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                        isPickedUp ? "bg-blue-50 text-blue-700 border-blue-100" :
                                                            "bg-brand-50 text-brand-700 border-brand-100"
                                                )}>
                                                    {isAssigned ? 'Stall Pickup Required' :
                                                        isPickedUp ? 'In Transit to Resident' : 'Arrived / Verification'}
                                                </span>
                                                <h4 className="text-base font-black text-green-950 uppercase tracking-tight mt-2">{res.product?.name || 'Produce'}</h4>
                                                <div className="flex items-center gap-1 text-[10px] text-text-secondary font-medium mt-0.5">
                                                    <MapPin size={12} className="text-brand-500 shrink-0" />
                                                    <span className="truncate max-w-[150px]">{res.delivery_address}</span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="text-[9px] font-black text-brand-600 block uppercase tracking-widest">Payout</span>
                                                <span className="text-base font-black text-green-950">KES {Number(res.rider_fee || res.delivery_fee).toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {/* Delivery Image (if available) */}
                                        {res.delivery_image_url && (
                                            <div className="w-full h-32 rounded-2xl overflow-hidden border border-gray-100 relative">
                                                <img src={res.delivery_image_url} alt="Delivery Location" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none flex items-end p-3">
                                                    <span className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                                        <MapPin size={12} /> Resident&apos;s Gate/Door
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Dynamic Progress Stepper */}
                                        <div className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100/50 space-y-3">
                                            <div className="flex items-center justify-between text-[9px] font-black text-text-muted uppercase tracking-widest pb-1 border-b border-gray-100/40">
                                                <span>Job Progress</span>
                                                <span className="text-brand-600 font-bold">
                                                    {isAssigned ? 'Stage 1/3' : isPickedUp ? 'Stage 2/3' : 'Stage 3/3'}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 relative pt-2">
                                                <div className="text-center space-y-1.5">
                                                    <div className={cn(
                                                        "h-2 rounded-full transition-all duration-300",
                                                        isAssigned || isPickedUp || isArrived ? "bg-amber-500" : "bg-neutral-200"
                                                    )} />
                                                    <p className={cn(
                                                        "text-[9px] font-black uppercase tracking-wider",
                                                        isAssigned ? "text-amber-600" : "text-text-muted"
                                                    )}>1. Pickup</p>
                                                </div>

                                                <div className="text-center space-y-1.5">
                                                    <div className={cn(
                                                        "h-2 rounded-full transition-all duration-300",
                                                        isPickedUp || isArrived ? "bg-blue-500" : "bg-neutral-200"
                                                    )} />
                                                    <p className={cn(
                                                        "text-[9px] font-black uppercase tracking-wider",
                                                        isPickedUp ? "text-blue-600" : "text-text-muted"
                                                    )}>2. Transit</p>
                                                </div>

                                                <div className="text-center space-y-1.5">
                                                    <div className={cn(
                                                        "h-2 rounded-full transition-all duration-300",
                                                        isArrived ? "bg-brand-500 animate-pulse" : "bg-neutral-200"
                                                    )} />
                                                    <p className={cn(
                                                        "text-[9px] font-black uppercase tracking-wider",
                                                        isArrived ? "text-brand-600" : "text-text-muted"
                                                    )}>3. Arrived</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stepper Actions */}
                                        <div className="flex flex-col gap-3">
                                            {isAssigned ? (
                                                <button
                                                    onClick={() => handlePickup(res.id)}
                                                    disabled={processingId === res.id}
                                                    className="w-full h-14 bg-gray-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-gray-950/20"
                                                >
                                                    {processingId === res.id ? (
                                                        <Loader2 size={16} className="animate-spin text-brand-400" />
                                                    ) : (
                                                        <Package size={16} className="text-brand-400" />
                                                    )}
                                                    Confirm Stall Pickup
                                                </button>
                                            ) : (
                                                <div className="space-y-4">
                                                    <button
                                                        onClick={() => handleArrival(res.id)}
                                                        disabled={processingId === res.id}
                                                        className="w-full h-14 bg-brand-50 text-brand-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-brand-100 active:scale-95 transition-all"
                                                    >
                                                        {processingId === res.id ? (
                                                            <Loader2 size={16} className="animate-spin" />
                                                        ) : (
                                                            <Navigation size={16} />
                                                        )}
                                                        Send Arrival Alert (SMS)
                                                    </button>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="CODE"
                                                            value={otpInputs[res.id] || ''}
                                                            onChange={(e) => setOtpInputs({ ...otpInputs, [res.id]: e.target.value })}
                                                            className="flex-1 h-14 min-w-0 px-2 bg-gray-50 border border-gray-100 rounded-2xl text-center text-xs font-black uppercase tracking-widest text-green-950 placeholder:text-neutral-300"
                                                        />
                                                        <button
                                                            onClick={() => handleComplete(res.id)}
                                                            disabled={completingId === res.id}
                                                            className="h-14 px-4 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shrink-0"
                                                        >
                                                            {completingId === res.id ? (
                                                                <Loader2 size={16} className="animate-spin" />
                                                            ) : (
                                                                <CheckCircle size={16} />
                                                            )}
                                                            Complete
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex gap-2 mt-2">
                                                <a
                                                    href={`tel:${res.resident?.phone}`}
                                                    className="flex-1 h-12 bg-white border border-gray-100 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted active:text-green-950 active:scale-95 transition-all shadow-sm"
                                                >
                                                    <Phone size={14} className="text-brand-500" /> Call Resident
                                                </a>
                                                <a
                                                    href={`tel:${res.trader?.mpesa_number || res.trader?.phone}`}
                                                    className="flex-1 h-12 bg-white border border-gray-100 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted active:text-green-950 active:scale-95 transition-all shadow-sm"
                                                >
                                                    <Store size={14} className="text-brand-500" /> Call Trader
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Column 2: Shipments Available */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div>
                            <h3 className="text-xs font-black text-green-950 uppercase tracking-[0.15em]">
                                Shipments Available
                                {pendingShipments.length > 0 && (
                                    <span className="ml-2 text-[8px] font-black px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-100">
                                        {pendingShipments.length}
                                    </span>
                                )}
                            </h3>
                            <p className="text-[10px] text-text-muted font-bold mt-0.5">
                                {isOffline ? 'Go Online to accept jobs' : 'Live matching pool — tap to accept'}
                            </p>
                        </div>
                        <button
                            onClick={() => { refetchPending(); refetchPool(); }}
                            className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-text-muted active:text-green-950 active:scale-95 transition-all shadow-sm"
                        >
                            <RefreshCw size={14} />
                        </button>
                    </div>

                    {pendingLoading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-36 bg-gray-50 rounded-[2.5rem] animate-pulse mb-4" />)
                    ) : pendingShipments.length === 0 ? (
                        <div className="py-20 text-center bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-100 p-6">
                            <Search className="mx-auto text-gray-300 mb-4" size={48} />
                            <p className="text-xs font-black text-text-muted uppercase tracking-widest leading-relaxed">
                                No shipments awaiting delivery.<br />Check back shortly!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingShipments.map((order: any) => (
                                <div key={order.id} className={cn(
                                    "bg-white rounded-[2.5rem] border shadow-brand-sm p-6 space-y-4 transition-all duration-300",
                                    !profile?.is_available ? "border-gray-100 opacity-80" : "border-gray-50 hover:border-brand-200"
                                )}>
                                    <div className="flex items-start gap-4">
                                        {order.product?.image_url ? (
                                            <img
                                                src={order.product.image_url}
                                                alt={order.product.name}
                                                className="w-16 h-16 rounded-2xl object-cover shrink-0 bg-gray-100"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center shrink-0">
                                                <Package size={24} className="text-brand-500" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100 uppercase tracking-widest">
                                                    #{order.reservation_code}
                                                </span>
                                                {order.quantity && (
                                                    <span className="text-[8px] font-black text-text-muted uppercase tracking-widest">
                                                        Qty: {order.quantity} {order.product?.unit}
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="text-sm font-black text-green-950 uppercase tracking-tight truncate">
                                                {order.product?.name || 'Produce'}
                                            </h4>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <Store size={10} className="text-brand-500 shrink-0" />
                                                <p className="text-[10px] font-bold text-text-secondary truncate">
                                                    {order.trader?.business_name || 'Trader'}
                                                    {order.trader?.market?.name ? ` · ${order.trader.market.name}` : ''}
                                                </p>
                                            </div>
                                            {order.delivery_address && (
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <MapPin size={10} className="text-rose-400 shrink-0" />
                                                    <p className="text-[10px] font-bold text-text-muted truncate">{order.delivery_address}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-[8px] font-black text-brand-600 block uppercase tracking-widest mb-0.5">Payout</span>
                                            <span className="text-base font-black text-green-950">KES {Number(order.rider_fee || order.delivery_fee || 0).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => profile?.is_available && handleAccept(order.id)}
                                        disabled={processingId === order.id || !profile?.is_available}
                                        className={cn(
                                            "w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                                            !profile?.is_available
                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                : "bg-gray-950 text-white active:scale-95 shadow-md shadow-gray-950/20"
                                        )}
                                    >
                                        {processingId === order.id ? (
                                            <Loader2 size={16} className="animate-spin text-brand-400" />
                                        ) : !profile?.is_available ? (
                                            <Power size={16} />
                                        ) : (
                                            <CheckCircle2 size={16} className="text-brand-400" />
                                        )}
                                        {!profile?.is_available ? 'Go Online to Accept' : 'Accept Delivery'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Column 3: Delivery History */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div>
                            <h3 className="text-xs font-black text-green-950 uppercase tracking-[0.15em]">Delivery History</h3>
                            <p className="text-[10px] text-text-muted font-bold mt-0.5">Recently completed jobs</p>
                        </div>
                        <History size={16} className="text-text-muted" />
                    </div>

                    {!stats?.recent_transactions || stats.recent_transactions.length === 0 ? (
                        <div className="py-8 text-center bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-100 p-6">
                            <ShoppingBag className="mx-auto text-gray-300 mb-2" size={32} />
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-relaxed">
                                No completed jobs yet.<br />Accept an assignment to get started!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {stats.recent_transactions.slice(0, 5).map((tx: any) => (
                                <div key={tx.id} className="bg-white rounded-3xl border border-gray-100 shadow-brand-xs p-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-brand-600 shrink-0">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-xs font-black text-green-950 truncate uppercase tracking-tight">
                                                {tx.reservation?.product?.name || 'Produce Delivery'}
                                            </h4>
                                            <p className="text-[9px] font-bold text-text-muted mt-0.5">
                                                {new Date(tx.created_at).toLocaleDateString()} at {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-xs font-black text-brand-600">+KES {Number(tx.amount).toLocaleString()}</span>
                                        <p className="text-[8px] font-black text-neutral-400 uppercase tracking-widest mt-0.5">Wallet Credit</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
